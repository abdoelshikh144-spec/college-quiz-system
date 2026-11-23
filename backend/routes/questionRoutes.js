const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAdminQuestions,
  createQuestion,
  deleteQuestion,
  importQuestionsJson,
} = require('../controllers/questionController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// All question management routes are admin protected
router.use(requireAdminAuth);

router.get('/', getAdminQuestions);
router.post('/', createQuestion);
router.delete('/:id', deleteQuestion);
router.post('/import', upload.single('file'), importQuestionsJson);

module.exports = router;
