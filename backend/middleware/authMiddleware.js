const AdminSession = require('../models/AdminSession');
const { hashToken } = require('../utils/authUtils');

const requireAdminAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.',
      });
    }

    const tokenHash = hashToken(token);
    const session = await AdminSession.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).populate('adminUser', '-passwordHash');

    if (!session || !session.adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    req.admin = session.adminUser;
    req.sessionDoc = session;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication server error',
    });
  }
};

module.exports = {
  requireAdminAuth,
};
