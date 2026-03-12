// models/upcomingRunRegistrations.js
module.exports = (sequelize, DataTypes) => {
  const UpcomingRunRegistration = sequelize.define(
    "UpcomingRunRegistration",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      run_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "UpcomingRuns", key: "id" },
        onDelete: "CASCADE",
      },
    },
    { tableName: "upcoming_run_registrations", underscored: true }
  );

  return UpcomingRunRegistration;
};