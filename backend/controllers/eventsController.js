const { Events } = require("../models/relationships");

// Get all events
const getEvents = async (req, res) => {
  try {
    const events = await Events.findAll({
      where: { is_active: true },
      order: [["name", "ASC"]],
    });
    return res.json({ success: true, events });
  } catch (error) {
    console.error("getEvents error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء جلب المناسبات" });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Events.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "المناسبة غير موجودة" });
    }

    return res.json({ success: true, event });
  } catch (error) {
    console.error("getEventById error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء جلب المناسبة" });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    const { name, name_arabic, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: "اسم المناسبة مطلوب" });
    }

    const event = await Events.create({
      name,
      name_arabic,
      description,
      color: color || "#3B82F6",
      icon,
    });

    return res.status(201).json({ success: true, event });
  } catch (error) {
    console.error("createEvent error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء إنشاء المناسبة" });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, name_arabic, description, color, icon, is_active } = req.body;

    const event = await Events.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "المناسبة غير موجودة" });
    }

    await event.update({
      name: name || event.name,
      name_arabic: name_arabic !== undefined ? name_arabic : event.name_arabic,
      description: description !== undefined ? description : event.description,
      color: color || event.color,
      icon: icon !== undefined ? icon : event.icon,
      is_active: is_active !== undefined ? is_active : event.is_active,
    });

    return res.json({ success: true, event });
  } catch (error) {
    console.error("updateEvent error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء تحديث الحدث" });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Events.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "المناسبة غير موجودة" });
    }

    await event.destroy();

    return res.json({ success: true, message: "تم حذف الحدث بنجاح" });
  } catch (error) {
    console.error("deleteEvent error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء حذف الحدث" });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
