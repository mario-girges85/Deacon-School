/**
 * Migration script to change curriculum from level-based to class-based
 * 
 * This script:
 * 1. Adds class_id column (nullable initially)
 * 2. Migrates existing curriculum entries to classes
 * 3. Makes class_id NOT NULL
 * 4. Removes level_id column
 */

const sequelize = require("../util/db");
const { Curriculum, Classes, Levels } = require("../models/relationships");

const migrateCurriculumToClasses = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log("🔄 Starting curriculum migration from levels to classes...");

    // Check if migration is needed
    const [tableInfo] = await sequelize.query(
      "SHOW COLUMNS FROM curriculums LIKE 'level_id'",
      { transaction }
    );

    if (tableInfo.length === 0) {
      console.log("✅ Migration already completed - level_id column doesn't exist");
      await transaction.commit();
      return;
    }

    // Check if class_id already exists
    const [classIdInfo] = await sequelize.query(
      "SHOW COLUMNS FROM curriculums LIKE 'class_id'",
      { transaction }
    );

    if (classIdInfo.length > 0) {
      console.log("✅ class_id column already exists, skipping column creation");
    } else {
      // Step 1: Add class_id as nullable (if it doesn't exist)
      console.log("📝 Step 1: Adding class_id column (nullable)...");
      try {
        await sequelize.query(
          "ALTER TABLE curriculums ADD COLUMN class_id CHAR(36) BINARY NULL COMMENT 'Reference to classes table'",
          { transaction }
        );
        console.log("✅ class_id column added");
      } catch (e) {
        if (e.message.includes("Duplicate column name")) {
          console.log("ℹ️  class_id column already exists");
        } else {
          throw e;
        }
      }
    }

    // Step 2: Migrate data
    console.log("📝 Step 2: Migrating curriculum data from levels to classes...");
    
    // Get all curriculum entries with level_id
    const curriculumEntries = await sequelize.query(
      "SELECT id, level_id FROM curriculums WHERE level_id IS NOT NULL AND class_id IS NULL",
      { type: sequelize.QueryTypes.SELECT, transaction }
    );

    console.log(`Found ${curriculumEntries.length} curriculum entries to migrate`);

    if (curriculumEntries.length > 0) {
      // For each curriculum entry, assign it to the first class of that level
      // If no class exists for that level, we'll skip it (or you can create one)
      for (const entry of curriculumEntries) {
        // Find a class for this level
        const classes = await Classes.findAll({
          where: { level_id: entry.level_id },
          limit: 1,
          transaction
        });

        if (classes.length > 0) {
          await sequelize.query(
            "UPDATE curriculums SET class_id = ? WHERE id = ?",
            {
              replacements: [classes[0].id, entry.id],
              transaction
            }
          );
          console.log(`✅ Migrated curriculum ${entry.id} to class ${classes[0].id}`);
        } else {
          console.log(`⚠️  No class found for level ${entry.level_id}, skipping curriculum ${entry.id}`);
          // Option: Delete entries without a matching class, or assign to a default class
          // For now, we'll leave them NULL and handle later
        }
      }
    }

    // Step 3: Check if there are any NULL class_id entries
    const [nullEntries] = await sequelize.query(
      "SELECT COUNT(*) as count FROM curriculums WHERE class_id IS NULL",
      { type: sequelize.QueryTypes.SELECT, transaction }
    );

    if (nullEntries.count > 0) {
      console.log(`⚠️  Warning: ${nullEntries.count} curriculum entries have NULL class_id`);
      console.log("   These entries will need manual assignment or deletion");
      
      // Option 1: Delete entries without class_id
      // await sequelize.query(
      //   "DELETE FROM curriculums WHERE class_id IS NULL",
      //   { transaction }
      // );
      
      // Option 2: Assign to a default class (first class in database)
      const defaultClass = await Classes.findOne({ transaction });
      if (defaultClass) {
        await sequelize.query(
          "UPDATE curriculums SET class_id = ? WHERE class_id IS NULL",
          {
            replacements: [defaultClass.id],
            transaction
          }
        );
        console.log(`✅ Assigned ${nullEntries.count} entries to default class ${defaultClass.id}`);
      }
    }

    // Step 4: Make class_id NOT NULL (only if no NULL values remain)
    const [remainingNulls] = await sequelize.query(
      "SELECT COUNT(*) as count FROM curriculums WHERE class_id IS NULL",
      { type: sequelize.QueryTypes.SELECT, transaction }
    );

    if (remainingNulls.count === 0) {
      console.log("📝 Step 3: Making class_id NOT NULL...");
      await sequelize.query(
        "ALTER TABLE curriculums MODIFY COLUMN class_id CHAR(36) BINARY NOT NULL COMMENT 'Reference to classes table'",
        { transaction }
      );
      console.log("✅ class_id is now NOT NULL");
    } else {
      throw new Error(`Cannot make class_id NOT NULL: ${remainingNulls.count} entries still have NULL class_id`);
    }

    // Step 5: Remove old indexes on level_id
    console.log("📝 Step 4: Removing old indexes on level_id...");
    try {
      await sequelize.query(
        "ALTER TABLE curriculums DROP INDEX curriculums_level_id_subject_semester_lecture",
        { transaction }
      );
      console.log("✅ Removed unique index on level_id");
    } catch (e) {
      console.log("ℹ️  Index on level_id doesn't exist or already removed");
    }

    try {
      await sequelize.query(
        "ALTER TABLE curriculums DROP INDEX curriculums_level_id",
        { transaction }
      );
      console.log("✅ Removed index on level_id");
    } catch (e) {
      console.log("ℹ️  Index on level_id doesn't exist or already removed");
    }

    // Step 6: Remove foreign key constraint on level_id
    console.log("📝 Step 5: Removing foreign key constraint on level_id...");
    try {
      await sequelize.query(
        "ALTER TABLE curriculums DROP FOREIGN KEY curriculums_level_id_foreign_idx",
        { transaction }
      );
      console.log("✅ Removed foreign key constraint on level_id");
    } catch (e) {
      console.log("ℹ️  Foreign key on level_id doesn't exist or already removed");
    }

    // Step 7: Remove level_id column
    console.log("📝 Step 6: Removing level_id column...");
    await sequelize.query(
      "ALTER TABLE curriculums DROP COLUMN level_id",
      { transaction }
    );
    console.log("✅ Removed level_id column");

    await transaction.commit();
    console.log("🎉 Migration completed successfully!");
    
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

module.exports = migrateCurriculumToClasses;

// Run migration if called directly
if (require.main === module) {
  migrateCurriculumToClasses()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

