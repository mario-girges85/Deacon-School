// Migration: Make phone non-unique, ensure code is required and unique
// Usage: node backend/scripts/migrate-phone-code-uniqueness.js

const sequelize = require("../util/db");

async function run() {
  console.log("Starting migration: phone uniqueness -> removed; code -> unique & not null");
  const qi = sequelize.getQueryInterface();

  try {
    // 1) Drop unique index on phone if it exists
    const [indexes] = await sequelize.query("SHOW INDEX FROM `users`");
    const phoneUniqueIndexes = (indexes || []).filter(
      (idx) => String(idx.Column_name).toLowerCase() === "phone" && idx.Non_unique === 0
    );

    for (const idx of phoneUniqueIndexes) {
      const keyName = idx.Key_name;
      console.log(`Dropping unique index on phone: ${keyName}`);
      await sequelize.query(`ALTER TABLE \`users\` DROP INDEX \`${keyName}\``);
    }

    // 2) Ensure code column is NOT NULL
    console.log("Ensuring code column is NOT NULL...");
    await sequelize.query("ALTER TABLE `users` MODIFY `code` VARCHAR(255) NOT NULL");

    // 3) Add unique index on code if it doesn't exist
    const [indexesAfter] = await sequelize.query("SHOW INDEX FROM `users`");
    const hasCodeUnique = (indexesAfter || []).some(
      (idx) => String(idx.Column_name).toLowerCase() === "code" && idx.Non_unique === 0
    );
    if (!hasCodeUnique) {
      console.log("Creating unique index on code...");
      await sequelize.query("ALTER TABLE `users` ADD UNIQUE INDEX `users_code_unique` (`code`)");
    } else {
      console.log("Unique index on code already exists.");
    }

    console.log("✔ Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

run();


