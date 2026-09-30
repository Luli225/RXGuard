/**
 * Role-Based Access Control Middleware (FR15, US-PA-02)
 * Restricts sensitive operations by role.
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for privileged operation'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Insufficient Privilege: Action requires one of [${allowedRoles.join(', ')}]. Current role: "${req.user.role}".`,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

module.exports = { requireRole };
