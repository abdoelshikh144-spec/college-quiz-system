const express = require('express');
const router = express.Router();
const {
  adminLogin,
  adminLogout,
  getAdminMe,
  getAdminResults,
  getAdminStats,
} = require('../controllers/adminController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Public admin login
router.post('/login', adminLogin);

// Protected admin routes
router.post('/logout', requireAdminAuth, adminLogout);
router.get('/me', requireAdminAuth, getAdminMe);
router.get('/results', requireAdminAuth, getAdminResults);
router.get('/stats', requireAdminAuth, getAdminStats);

module.exports = router;
