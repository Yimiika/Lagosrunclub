require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(process.env.DIRECT_URL, {
  dialect: "postgres",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/* =====================================================
   🔹 MODELS
===================================================== */

db.users = require("./users")(sequelize, DataTypes);
db.runs = require("./runs")(sequelize, DataTypes);
db.upcomingRuns = require("./upcomingRuns")(sequelize, DataTypes);
db.upcomingRunRegistrations = require("./upcomingRunRegistrations")(sequelize, DataTypes);
// db.badges = require("./badges")(sequelize, DataTypes); // Optional future

/* =====================================================
   🔹 RELATIONSHIPS
===================================================== */

// User <-> Runs
db.users.hasMany(db.runs, { foreignKey: "user_id", onDelete: "CASCADE", as: "runs" });
db.runs.belongsTo(db.users, { foreignKey: "user_id", as: "user" });

// Upcoming Runs <-> Users (many-to-many)
db.users.belongsToMany(db.upcomingRuns, {
  through: db.upcomingRunRegistrations,
  foreignKey: "user_id",
  otherKey: "run_id",
  as: "registered_runs",
});

db.upcomingRuns.belongsToMany(db.users, {
  through: db.upcomingRunRegistrations,
  foreignKey: "run_id",
  otherKey: "user_id",
  as: "users",
});

/*
Future relationships example:

// Users can earn many badges
db.users.belongsToMany(db.badges, {
  through: "user_badges",
  foreignKey: "user_id",
});

db.badges.belongsToMany(db.users, {
  through: "user_badges",
  foreignKey: "badge_id",
});
*/

/* =====================================================
   🔹 SYNC DATABASE
===================================================== */

db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database & tables synced");
  })
  .catch((err) => {
    console.error("Unable to sync database & tables:", err);
  });

module.exports = db;