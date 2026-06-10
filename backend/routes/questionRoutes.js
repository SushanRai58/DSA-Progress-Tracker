const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reviewQuestion,
} = require('../controllers/questionController');

// All question routes require a valid JWT
router.use(protect);

router.route('/').get(getQuestions).post(createQuestion);
router.route('/:id').put(updateQuestion).delete(deleteQuestion);
router.route('/:id/review').put(reviewQuestion);

module.exports = router;
