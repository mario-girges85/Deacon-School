/**
 * Migration: contact_messages - use user_id (sender from account) instead of name/email/phone
 * Drops and recreates the table with the new schema.
 */

const sequelize = require("../util/db");

const migrateContactMessagesToUserId = async () => {
  try {
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'contact_messages'"
    );
    if (tables.length === 0) {
      console.log("contact_messages table does not exist - sync will create it");
      return;
    }

    const [cols] = await sequelize.query(
      "SHOW COLUMNS FROM contact_messages LIKE 'user_id'"
    );
    if (cols.length > 0) {
      console.log("contact_messages already has user_id - migration skipped");
      return;
    }

    console.log("Migrating contact_messages to user_id schema...");
    await sequelize.query("DROP TABLE IF EXISTS contact_messages");
    console.log("Dropped old contact_messages table - sync will recreate");
  } catch (err) {
    console.error("Migration error:", err.message);
    throw err;
  }
};

module.exports = migrateContactMessagesToUserId;
