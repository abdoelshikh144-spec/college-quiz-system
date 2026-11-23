const express = require('express');
const router = express.Router();
const { verifyStudent, getAllStudents, createStudent } = require('../controllers/studentController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Public route: verify student ID
router.get('/verify/:studentId', verifyStudent);

// Admin routes:
router.get('/', requireAdminAuth, getAllStudents);
router.post('/', requireAdminAuth, createStudent);

module.exports = router;
