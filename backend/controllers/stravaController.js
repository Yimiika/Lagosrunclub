const axios = require("axios");
const { users, runs } = require("../models");
const { Op } = require("sequelize");

/* ============================================
   TOKEN REFRESH
============================================ */
const refreshStravaToken = async (user) => {
  if (!user.strava_refresh_token) return null;

  if (Date.now() / 1000 < user.strava_token_expires_at) {
    return user.strava_access_token;
  }

  const response = await axios.post(
    "https://www.strava.com/oauth/token",
    {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: user.strava_refresh_token,
    }
  );

  user.strava_access_token = response.data.access_token;
  user.strava_refresh_token = response.data.refresh_token;
  user.strava_token_expires_at = response.data.expires_at;

  await user.save();

  return user.strava_access_token;
};

/* ============================================
   SYNC RUNS (FULL HISTORICAL IMPORT)
   - Calculates average pace & speed
   - Sets personal best automatically
============================================ */
exports.syncStravaRuns = async (user) => {
  const token = await refreshStravaToken(user);
  if (!token) return;

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 100, page },
      }
    );

    const activities = response.data;
    if (activities.length === 0) {
      hasMore = false;
      break;
    }

    const runsOnly = activities.filter(a => a.type === "Run");

    for (const activity of runsOnly) {
      const exists = await runs.findOne({
        where: { strava_activity_id: activity.id }
      });

      if (!exists) {
        const distanceKm = activity.distance / 1000;
        const durationMin = activity.moving_time / 60;

        const average_pace = distanceKm > 0 ? durationMin / distanceKm : null;
        const average_speed = distanceKm > 0 ? distanceKm / (durationMin / 60) : null;

        // Fetch previous runs for PB calculation
        const previousRuns = await runs.findAll({ where: { user_id: user.id } });

        let is_personal_best = false;
        if (previousRuns.length === 0) {
          is_personal_best = true;
        } else {
          const maxDistance = Math.max(...previousRuns.map(r => r.distance));
          if (distanceKm > maxDistance) {
            is_personal_best = true;
            // Reset previous personal best
            await runs.update({ is_personal_best: false }, {
              where: { user_id: user.id, is_personal_best: true },
            });
          }
        }

        await runs.create({
          user_id: user.id,
          strava_activity_id: activity.id,
          distance: distanceKm,
          duration: durationMin,
          average_pace,
          average_speed,
          elevation_gain: activity.total_elevation_gain || null,
          run_date: new Date(activity.start_date),
          title: activity.name || null,
          source: "strava",
          is_personal_best,
        });
      }
    }

    page++;
  }
};

/* ============================================
   CONNECT
============================================ */
exports.connectStrava = (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${process.env.STRAVA_REDIRECT_URI}&approval_prompt=force&scope=activity:read_all`;
  res.redirect(url);
};

/* ============================================
   CALLBACK
============================================ */
exports.stravaCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post(
      "https://www.strava.com/oauth/token",
      {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }
    );

    const {
      access_token,
      refresh_token,
      expires_at,
      athlete,
    } = tokenResponse.data;

    const user = await users.findByPk(req.user.id);

    user.strava_access_token = access_token;
    user.strava_refresh_token = refresh_token;
    user.strava_token_expires_at = expires_at;
    user.strava_athlete_id = athlete.id;

    await user.save();

    await exports.syncStravaRuns(user);

    res.json({ message: "Strava connected and runs synced!" });

  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ error: "Strava connection failed" });
  }
};

/* ============================================
   DISCONNECT
============================================ */
exports.disconnectStrava = async (req, res) => {
  const user = await users.findByPk(req.user.id);

  user.strava_access_token = null;
  user.strava_refresh_token = null;
  user.strava_token_expires_at = null;
  user.strava_athlete_id = null;

  await user.save();

  res.json({ message: "Strava disconnected" });
};