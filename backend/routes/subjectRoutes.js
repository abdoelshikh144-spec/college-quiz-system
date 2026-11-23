const express = require('express');
const router = express.Router();
const {
  getPublicSubjects,
  getAdminSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Public route for student registration
router.get('/public', getPublicSubjects);

// Admin protected routes
router.get('/', requireAdminAuth, getAdminSubjects);
router.post('/', requireAdminAuth, createSubject);
router.put('/:id', requireAdminAuth, updateSubject);
router.delete('/:id', requireAdminAuth, deleteSubject);

module.exports = router;
