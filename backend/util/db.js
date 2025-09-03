const mysql = require("mysql2");
const Sequelize = require("sequelize");
const path = require("path");

// Load environment variables from project root
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// DATABASE CONNECTION
const sequelize = new Sequelize(
  process.env.DB_NAME || "u354738377_deaconschool",
  process.env.DB_USER || "u354738377_deaconschool",
  process.env.DB_PASSWORD || "@6pv7BOIvC",
  {
    host: process.env.DB_HOST || "92.113.22.53",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
