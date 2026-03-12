// models/runs.js
module.exports = (sequelize, DataTypes) => {
  const Run = sequelize.define(
    "Run",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,   // <---- match Users.id
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      distance: { type: DataTypes.FLOAT, allowNull: false },
      duration: { type: DataTypes.INTEGER, allowNull: false },
      average_pace: DataTypes.FLOAT,
      average_speed: DataTypes.FLOAT,
      elevation_gain: DataTypes.FLOAT,
      run_date: { type: DataTypes.DATE, allowNull: false },
      title: DataTypes.STRING,
      source: {
        type: DataTypes.ENUM("manual", "strava"),
        defaultValue: "manual",
      },
      strava_activity_id: { type: DataTypes.STRING, unique: true },
      is_personal_best: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: "runs", underscored: true }
  );

  Run.associate = (models) => {
    Run.belongsTo(models.users, { foreignKey: "user_id" });
  };

  return Run;
};