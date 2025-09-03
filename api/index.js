// Vercel serverless function entry point
const app = require("../backend/index");

// Initialize database on cold start
const initializeDatabase = async () => {
  try {
    const sequelize = require("../backend/util/db");
    const {
      User,
      Levels,
      Classes,
      Curriculum,
      Events,
      Hymns,
      CurriculumHymns,
    } = require("../backend/models/relationships");

    // Sync database
    await sequelize.sync({ force: false, alter: false });

    // Ensure curriculum_hymns table exists
    if (typeof CurriculumHymns?.sync === "function") {
      await CurriculumHymns.sync({ alter: true });
    }

    console.log("Database synchronized successfully for Vercel function.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

// Initialize database on first request
let dbInitialized = false;
const ensureDatabaseInitialized = async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
  next();
};

// Apply database initialization middleware
app.use(ensureDatabaseInitialized);

module.exports = app;
