const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      email_address: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone_number: {
        type: DataTypes.STRING(15),
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location_area: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      profile_image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("User", "Admin"),
        allowNull: false,
        defaultValue: "User",
      },
      profile_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
       strava_access_token: {type:DataTypes.TEXT,allowNull: true},
    strava_refresh_token: {type:DataTypes.TEXT,allowNull: true},
    strava_token_expires_at:{type:DataTypes.BIGINT,allowNull: true},
    strava_athlete_id: {type:DataTypes.STRING,allowNull: true},
    },
    {
      tableName: "Users",
      timestamps: true,
    }
  );

  // Helper to capitalize names
  const capitalize = (value) => {
    if (!value) return value;
    return value
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // 🔹 Before Create Hook
  User.beforeCreate(async (user) => {
    // Normalize
    user.email_address = user.email_address.toLowerCase().trim();
    if (user.username) user.username = user.username.toLowerCase().trim();
    user.first_name = capitalize(user.first_name);
    user.last_name = capitalize(user.last_name);
    if (user.location_area) user.location_area = capitalize(user.location_area);
    if (user.phone_number) user.phone_number = user.phone_number.trim();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });

  // 🔹 Before Update Hook
  User.beforeUpdate(async (user) => {
    if (user.email_address) user.email_address = user.email_address.toLowerCase().trim();
    if (user.username) user.username = user.username.toLowerCase().trim();
    if (user.first_name) user.first_name = capitalize(user.first_name);
    if (user.last_name) user.last_name = capitalize(user.last_name);
    if (user.location_area) user.location_area = capitalize(user.location_area);
    if (user.phone_number) user.phone_number = user.phone_number.trim();

    if (user.changed("password")) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  // Password validation
  User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};