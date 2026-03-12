// models/upcomingRuns.js
module.exports = (sequelize, DataTypes) => {
  const UpcomingRun = sequelize.define(
    "UpcomingRun",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATE, allowNull: false },
      distance: { type: DataTypes.FLOAT, allowNull: false },
      start_point: { type: DataTypes.STRING, allowNull: false },
      end_point: { type: DataTypes.STRING, allowNull: false },
      location: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: "upcoming_runs", underscored: true }
  );

  UpcomingRun.associate = (models) => {
    UpcomingRun.belongsToMany(models.users, {
      through: "UpcomingRunRegistrations",
      foreignKey: "run_id",
      otherKey: "user_id",
    });
  };

  return UpcomingRun;
};