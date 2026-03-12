const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const { users: User } = require("../models");
//const { User } = require("../models");
const { isTokenRevoked } = require("../middleware/blacklist");

require("dotenv").config();

/* ============================
   🔒 Check Revoked Token
============================ */
const checkRevokedToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token && isTokenRevoked(token)) {
    return res
      .status(401)
      .json({ message: "Token has been revoked. Please log in again." });
  }

  next();
};

/* ============================
   🔐 JWT Strategy
============================ */
passport.use(
  new JWTstrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token, done) => {
      try {
        const user = await User.findByPk(token.user.id);

        if (!user || !user.is_active) {
          return done(null, false);
        }

        return done(null, {
          id: user.id,
          role: user.role,
          profile_completed: user.profile_completed,
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

/* ============================
   📝 Local Signup (Minimal)
============================ */
passport.use(
  "signup",
  new LocalStrategy(
    {
      usernameField: "email_address",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email_address, password, done) => {
      try {
        const { first_name, last_name } = req.body;

        if (!first_name || !last_name) {
          return done(null, false, { message: "First and last name required" });
        }

        const existingUser = await User.findOne({
          where: { email_address: email_address.toLowerCase().trim() },
        });

        if (existingUser) {
          return done(null, false, { message: "Email already in use" });
        }

        const newUser = await User.create({
          email_address,
          password,
          first_name,
          last_name,
          role: "User",
          profile_completed: false,
        });

        return done(null, newUser, { message: "Signup successful" });
      } catch (error) {
        return done(error);
      }
    }
  )
);

/* ============================
   🔑 Local Login
============================ */
passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "email_address",
      passwordField: "password",
    },
    async (email_address, password, done) => {
      try {
        const user = await User.findOne({
          where: { email_address: email_address.toLowerCase().trim() },
        });

        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        if (!user.is_active) {
          return done(null, false, { message: "Account deactivated" });
        }

        const isValidPassword = await user.validatePassword(password);

        if (!isValidPassword) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user, { message: "Login successful" });
      } catch (error) {
        return done(error);
      }
    }
  )
);

/* ============================
   🌐 Google OAuth
============================ */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) return done(null, false, { message: "Google account has no email" });

        let user = await User.findOne({
          where: { email_address: email.toLowerCase().trim() },
        });

        if (!user) {
          user = await User.create({
            first_name: profile.given_name || "Runner",
            last_name: profile.family_name || "",
            email_address: email.toLowerCase().trim(),
            password: "OAuthUser",
            role: "User",
            profile_completed: false,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/* ============================
   🔓 Optional Auth Middleware
============================ */
const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    req.user = user || null;
    next();
  })(req, res, next);
};

/* ============================
   🔐 Protected Middleware
============================ */
const requireAuth = passport.authenticate("jwt", { session: false });

const requireCompletedProfile = (req, res, next) => {
  if (!req.user.profile_completed) {
    return res.status(403).json({ message: "Please complete your profile first" });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

module.exports = {
  passport,
  checkRevokedToken,
  optionalAuth,
  requireAuth,
  requireCompletedProfile,
  requireAdmin,
};