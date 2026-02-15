const Sequelize = require("sequelize");
const sequelize = require("../util/db");

const ContactMessage = sequelize.define(
  "ContactMessage",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
      comment: "Sender (references users.id)",
    },
    subject: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Message subject",
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
      comment: "Message body",
    },
    is_read: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: "Whether admin has read the message",
    },
  },
  {
    timestamps: true,
    tableName: "contact_messages",
    indexes: [
      { fields: ["createdAt"] },
      { fields: ["is_read"] },
      { fields: ["user_id"] },
    ],
  }
);

module.exports = ContactMessage;
