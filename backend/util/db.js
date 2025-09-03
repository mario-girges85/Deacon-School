const mysql = require("mysql2");
const Sequelize = require("sequelize");
require("dotenv").config();

// DATABASE CONNECTION (hardcoded for production)
const sequelize = new Sequelize(
  "u354738377_deaconschool",
  "u354738377_deaconschool",
  "@6pv7BOIvC",
  {
    host: "92.113.22.53",
    port: 3306,
    dialect: "mysql",
    logging: false,
  }
);

module.exports = sequelize;
