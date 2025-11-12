const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware xác thực JWT token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware kiểm tra role
 * @param {string[]} allowedRoles - Danh sách roles được phép
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
}

/**
 * Middleware kiểm tra ownership hoặc role cao hơn
 * Cho phép user truy cập resource của mình, hoặc admin/bank_staff truy cập mọi resource
 */
function authorizeOwnerOrStaff(resourceUserIdField = 'user_id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role || 'user';
    
    // Admin và bank_staff có thể truy cập mọi resource
    if (userRole === 'admin' || userRole === 'bank_staff') {
      return next();
    }

    // User chỉ có thể truy cập resource của mình
    // Resource ID sẽ được check trong route handler
    req.checkOwnership = true;
    req.resourceUserIdField = resourceUserIdField;
    next();
  };
}

/**
 * Middleware kiểm tra user có active không
 */
async function checkUserActive(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const db = req.app.locals.db;
    const user = await db.findUserById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ 
        error: 'Account disabled', 
        message: 'Your account has been disabled. Please contact administrator.' 
      });
    }

    next();
  } catch (err) {
    console.error('Error checking user active status:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Helper: Check if user has permission
 * @param {string} userRole - User's role
 * @param {string} resource - Resource name (e.g., 'users', 'checks')
 * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
 * @returns {boolean}
 */
function hasPermission(userRole, resource, action) {
  const permissions = {
    admin: {
      users: ['create', 'read', 'update', 'delete', 'list'],
      checks: ['create', 'read', 'update', 'delete', 'list', 'read_all', 'update_all', 'delete_all'],
      system: ['manage'],
    },
    bank_staff: {
      users: ['read', 'list'],
      checks: ['create', 'read', 'update', 'delete', 'list', 'read_all', 'update_all', 'verify', 'approve'],
    },
    user: {
      checks: ['create', 'read', 'update', 'delete', 'list'],
    },
  };

  return permissions[userRole]?.[resource]?.includes(action) || false;
}

/**
 * Middleware kiểm tra permission cụ thể
 */
function requirePermission(resource, action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role || 'user';
    
    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `You don't have permission to ${action} ${resource}` 
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticate,
  authorize,
  authorizeOwnerOrStaff,
  checkUserActive,
  hasPermission,
  requirePermission,
};
