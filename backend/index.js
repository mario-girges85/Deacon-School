const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");

const sequelize = require("./util/db");
const userRouter = require("./routes/userRouter");
const classRouter = require("./routes/classRouter");
const levelRouter = require("./routes/levelRouter");
const curriculumRouter = require("./routes/curriculumRouter");
const scheduleRouter = require("./routes/scheduleRouter");
const eventsRouter = require("./routes/eventsRouter");
const hymnsRouter = require("./routes/hymnsRouter");
const contactRouter = require("./routes/contactRouter");

// Import models and relationships
const {
  User,
  Levels,
  Classes,
  Curriculum,
  Events,
  Hymns,
  CurriculumHymns,
} = require("./models/relationships");
// Ensure teacher subject assignment model is registered for syncing
require("./models/teacherSubjectAssignment");
require("./models/contactMessage");

// Ensure all levels exist (seed on startup)
const seedLevels = async () => {
  try {
    const requiredCombinations = [];
    // Level 0 (Preparatory): stages 1-2
    for (let stage = 1; stage <= 2; stage += 1) {
      requiredCombinations.push({ level: 0, stage });
    }
    // Levels 1-3: stages 1-3
    for (let level = 1; level <= 3; level += 1) {
      for (let stage = 1; stage <= 3; stage += 1) {
        requiredCombinations.push({ level, stage });
      }
    }

    for (const combo of requiredCombinations) {
      await Levels.findOrCreate({
        where: { level: combo.level, stage: combo.stage },
        defaults: combo,
      });
    }

    console.log(
      `Levels ensured: ${requiredCombinations.length} combinations present.`,
    );
  } catch (err) {
    console.error("Failed to seed levels:", err);
  }
};

// Ensure all classes exist (seed on startup)
const seedClasses = async () => {
  try {
    console.log("🚀 Starting classes seeding...");

    const classData = [
      // مبنى الأنبا كاراس – الدور الأول
      {
        location: "مبنى الأنبا كاراس – الدور الأول – فصل يمين الكنيسة",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الأول – فصل يسار الكنيسة",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الأول – فصل الممر (1)",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الأول – فصل الممر (2)",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الأول – فصل الممر (3)",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الأول – فصل الممر (4)",
      },
      {
        location:
          "مبنى الأنبا كاراس – الدور الأول – كنيسة الانبا كاراس مكان الشمامسة",
      },

      // مبنى الأنبا كاراس – الدور الثالث
      { location: "مبنى الأنبا كاراس – الدور الثالث – فصل يمين" },
      { location: "مبنى الأنبا كاراس – الدور الثالث – فصل شمال" },
      {
        location: "مبنى الأنبا كاراس – الدور الثالث – قاعة داخلية",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الثالث – قاعة خارجية",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الثالث – غرفة الممر (1)",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الثالث – غرفة الممر (2)",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الثالث – غرفة الممر (3)",
      },

      // مبنى الأنبا كاراس – الدور الرابع
      {
        location: "مبنى الأنبا كاراس – الدور الرابع – غرفة يمين",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الرابع – غرفة يسار",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الرابع – غرفة وسطى",
      },

      // مبنى الأنبا كاراس – الدور الخامس
      {
        location: "مبنى الأنبا كاراس – الدور الخامس – غرفة الممر (1)",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الخامس – غرفة الممر (2)",
      },
      {
        location: "مبنى الأنبا كاراس – الدور الخامس – غرفة الممر (3)",
      },

      // مبنى الأنبا كاراس – الدور السادس
      {
        location: "مبنى الأنبا كاراس – الدور السادس – غرفة يمين",
      },
      {
        location: "مبنى الأنبا كاراس – الدور السادس – غرفة يسار",
      },
      {
        location: "مبنى الأنبا كاراس – الدور السادس – غرفة وسطى",
      },
    ];

    console.log(`📋 Found ${classData.length} classes to seed`);

    // Create classes without association to levels
    let createdCount = 0;
    let existingCount = 0;

    for (const classItem of classData) {
      try {
        console.log(`🔄 Processing: ${classItem.location}`);

        const [instance, created] = await Classes.findOrCreate({
          where: { location: classItem.location },
          defaults: {
            location: classItem.location,
            // level_id will be null initially
          },
        });

        if (created) {
          createdCount++;
          console.log(`✅ Created: ${classItem.location}`);
        } else {
          existingCount++;
          console.log(`⏭️ Already exists: ${classItem.location}`);
        }
      } catch (itemError) {
        console.error(
          `❌ Error creating ${classItem.location}:`,
          itemError.message,
        );
      }
    }

    console.log(
      `🎉 Classes seeding completed: ${createdCount} created, ${existingCount} already existed. Total: ${classData.length}`,
    );
  } catch (err) {
    console.error("💥 Failed to seed classes:", err);
    console.error("Error details:", err.message);
    console.error("Stack trace:", err.stack);
  }
};

// Ensure curriculum exists for each level-stage
const seedCurriculum = async () => {
  try {
    const subjects = ["taks", "al7an", "coptic"]; // per requirement
    const semesters = [1, 2];
    const lectures = Array.from({ length: 10 }, (_, i) => i + 1);

    const allLevels = await Levels.findAll();
    for (const lvl of allLevels) {
      for (const subject of subjects) {
        for (const semester of semesters) {
          for (const lecture of lectures) {
            await Curriculum.findOrCreate({
              where: {
                level_id: lvl.id,
                subject,
                semester,
                lecture,
              },
              defaults: {
                level_id: lvl.id,
                subject,
                semester,
                lecture,
                path: null,
              },
            });
          }
        }
      }
    }

    console.log("Curriculum seeding completed");
  } catch (err) {
    console.error("Failed to seed curriculum:", err);
  }
};

// Ensure admin account exists -
const seedAdmin = async () => {
  try {
    const bcrypt = require("bcrypt");

    // Admin credentials
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123"; // Default password if env var not set
    const adminData = {
      name: "Mario gerges",
      phone: "01285948011", // Admin phone
      password: await bcrypt.hash(adminPassword, 10), // Admin password
      birthday: "1990-01-01",
      gender: "male",
      role: "admin",
      code: "admin",
    };

    const [admin, created] = await User.findOrCreate({
      where: {
        phone: adminData.phone,
        role: "admin",
      },
      defaults: adminData,
    });

    if (created) {
      console.log("✅ Admin account created successfully");
      console.log("📱 Phone: 01285948011");
      console.log("password: ", process.env.ADMIN_PASSWORD);
    } else {
      console.log("⏭️ Admin account already exists");
      console.log("📱 Phone: 01285948011");
      console.log("password: ", process.env.ADMIN_PASSWORD);
    }
  } catch (err) {
    console.error("❌ Failed to seed admin account:", err);
  }
};

const port = process.env.PORT;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS configuration – allow requests from any origin
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("Hello school");
});

app.use("/users", userRouter);
app.use("/classes", classRouter);
app.use("/levels", levelRouter);
app.use("/", curriculumRouter);
app.use("/schedule", scheduleRouter);
app.use("/events", eventsRouter);
app.use("/hymns", hymnsRouter);
app.use("/contact", contactRouter);

// Serve uploads statically
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// Initialize database and start server
const initializeServer = async () => {
  try {
    // Run migration for curriculum table (level_id -> class_id)
    try {
      const migrateCurriculumToClasses = require("./migrations/migrateCurriculumToClasses");
      await migrateCurriculumToClasses();
    } catch (migrationError) {
      console.error(
        "Migration error (may be expected if already migrated):",
        migrationError.message,
      );
    }

    // Run migration for contact_messages (user_id schema)
    try {
      const migrateContactMessages = require("./migrations/migrateContactMessagesToUserId");
      await migrateContactMessages();
    } catch (migrationError) {
      console.error(
        "Contact messages migration error (may be expected if already migrated):",
        migrationError.message,
      );
    }

    // Sync database - only create tables if they don't exist
    // Options:
    // - force: false (default) - won't drop existing tables
    // - alter: false (default) - won't modify existing table structure
    // - This ensures data persistence between server restarts
    // Avoid global alter to prevent hitting key limits on existing tables
    await sequelize.sync({ force: false, alter: true });
    // Ensure the new curriculum_hymns table exists/updates
    if (typeof CurriculumHymns?.sync === "function") {
      await CurriculumHymns.sync({ alter: true });
    }

    console.log("Database synchronized successfully.");

    // Always ensure admin account exists
    await seedAdmin();

    // Check if database is already seeded
    const existingLevels = await Levels.count();
    if (existingLevels === 0) {
      console.log("Database is empty, starting initial seeding...");
      await seedLevels();
      await seedClasses();
      await seedCurriculum();
      console.log("Initial database seeding completed.");
    } else {
      console.log("Database already contains data, skipping seeding.");
    }

    console.log(`Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error("Database synchronization failed:", error);
  }
};

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(port, "0.0.0.0", initializeServer);
}

// Export for Vercel
module.exports = app;
