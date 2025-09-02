const Sequelize = require("sequelize");
const sequelize = require("../util/db");

const Events = sequelize.define(
  "Events",
  {
    id: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Event name (e.g., Christmas, Easter, Baptism, etc.)",
    },
    name_arabic: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Event name in Arabic",
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Event description",
    },
    color: {
      type: Sequelize.STRING(7),
      allowNull: true,
      defaultValue: "#3B82F6",
      comment: "Hex color code for event theming",
    },
    icon: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Icon name or path for the event",
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: "Whether the event is active and visible",
    },
  },
  {
    timestamps: true,
    tableName: "events",
    indexes: [{ fields: ["name"] }, { fields: ["is_active"] }],
  }
);

module.exports = Events;
