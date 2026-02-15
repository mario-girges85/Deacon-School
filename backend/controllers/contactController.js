const ContactMessage = require("../models/contactMessage");
const User = require("../models/user");
const { buildImageUrl } = require("../util/userHelpers");

// Submit a new contact message (authenticated users only)
const createMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "الموضوع والرسالة مطلوبان",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول لإرسال رسالة",
      });
    }

    const msg = await ContactMessage.create({
      user_id: userId,
      subject: String(subject).trim(),
      message: String(message).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "تم إرسال رسالتك بنجاح",
      id: msg.id,
    });
  } catch (error) {
    console.error("createMessage error:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الرسالة",
    });
  }
};

// Get all contact messages (admin only)
const getMessages = async (req, res) => {
  try {
    const rows = await ContactMessage.findAll({
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "image"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const messages = rows.map((m) => {
      const msg = m.toJSON();
      if (msg.sender?.image) {
        msg.sender.image = buildImageUrl(req, msg.sender.image);
      }
      return msg;
    });

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الرسائل",
    });
  }
};

// Mark message as read (admin only)
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findByPk(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: "الرسالة غير موجودة" });
    }
    await msg.update({ is_read: true });
    return res.json({ success: true, message: msg });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ",
    });
  }
};

// Delete message (admin only)
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findByPk(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: "الرسالة غير موجودة" });
    }
    await msg.destroy();
    return res.json({ success: true, message: "تم حذف الرسالة" });
  } catch (error) {
    console.error("deleteMessage error:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء الحذف",
    });
  }
};

module.exports = {
  createMessage,
  getMessages,
  markAsRead,
  deleteMessage,
};
