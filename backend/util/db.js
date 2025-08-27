const mysql = require("mysql2");
const Sequelize = require("sequelize");
require("dotenv").config();

// DATABASE CONNECTION (all sensitive values from environment variables)
const sequelize = new Sequelize(
  process.env.DB_NAME || "deacons",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "stopthisshit@ma",
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: false,
  }
);

module.exports = sequelize;
