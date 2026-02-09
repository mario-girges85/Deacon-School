const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_in_production";

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  WARNING: JWT_SECRET is not set in environment variables!");
  console.warn("⚠️  Using default secret. Please set JWT_SECRET in your .env file for production!");
}

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "رمز الوصول مطلوب",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database to ensure they still exist and get latest data
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] }, // Don't include password
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      code: user.code,
      role: user.role,
      level_id: user.level_id,
      class_id: user.class_id,
      subject: user.subject,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "رمز الوصول غير صحيح",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "انتهت صلاحية رمز الوصول",
      });
    }

    return res.status(500).json({
      success: false,
      message: "خطأ في التحقق من الهوية",
    });
  }
};

/**
 * Middleware to require admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "يجب تسجيل الدخول أولاً",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "هذه الصفحة متاحة للمديرين فقط",
    });
  }

  next();
};

/**
 * Middleware to require teacher role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "يجب تسجيل الدخول أولاً",
    });
  }

  if (req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "هذه الصفحة متاحة للمعلمين فقط",
    });
  }

  next();
};

/**
 * Middleware to require supervisor role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireSupervisor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "يجب تسجيل الدخول أولاً",
    });
  }

  if (req.user.role !== "supervisor") {
    return res.status(403).json({
      success: false,
      message: "هذه الصفحة متاحة للمشرفين فقط",
    });
  }

  next();
};

/**
 * Middleware to require staff role (teacher, admin, or supervisor)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "يجب تسجيل الدخول أولاً",
    });
  }

  const staffRoles = ["teacher", "admin", "supervisor"];
  if (!staffRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "هذه الصفحة متاحة للعاملين فقط",
    });
  }

  next();
};

/**
 * Middleware to require management role (admin or supervisor)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "يجب تسجيل الدخول أولاً",
    });
  }

  const managementRoles = ["admin", "supervisor"];
  if (!managementRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "هذه الصفحة متاحة للإدارة فقط",
    });
  }

  next();
};

/**
 * Middleware to check for specific roles
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} - Middleware function
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول أولاً",
      });
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى هذه الصفحة",
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          phone: user.phone,
          code: user.code,
          role: user.role,
          level_id: user.level_id,
          class_id: user.class_id,
          subject: user.subject,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacher,
  requireSupervisor,
  requireStaff,
  requireManagement,
  checkRole,
  optionalAuth,
};
