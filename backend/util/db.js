const mysql = require("mysql2");
const Sequelize = require("sequelize");
const path = require("path");


// DATABASE CONNECTION using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,

  }
);

module.exports = sequelize;
