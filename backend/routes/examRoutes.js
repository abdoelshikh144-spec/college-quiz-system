const express = require('express');
const router = express.Router();
const {
  startExam,
  saveAnswer,
  submitExam,
  getResultById,
} = require('../controllers/examController');

// Public student exam routes
router.post('/start', startExam);
router.post('/save-answer', saveAnswer);
router.post('/submit', submitExam);
router.get('/result/:id', getResultById);

module.exports = router;
