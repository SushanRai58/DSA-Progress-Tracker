const Question = require('../models/Question');

// GET /api/questions — fetch only the authenticated user's questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
};

// POST /api/questions — create a new question for the authenticated user
const createQuestion = async (req, res) => {
  const { title, topic, difficulty, tags, notes, solved, solvedDate, leetcodeUrl } = req.body;

  if (!title || !topic || !difficulty) {
    return res.status(400).json({ message: 'Title, topic, and difficulty are required' });
  }

  try {
    const question = await Question.create({
      title,
      topic,
      difficulty,
      tags: tags || [],
      notes: notes || '',
      solved: solved || false,
      solvedDate: solved ? solvedDate || new Date() : null,
      leetcodeUrl: leetcodeUrl || '',
      user: req.user._id,
    });

    res.status(201).json(question);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to create question' });
  }
};

// PUT /api/questions/:id — update a question (ownership enforced)
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Prevent users from modifying each other's questions
    if (question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this question' });
    }

    // Accept both `solved` and legacy `isSolved` field names from the client
    const { solved: solvedRaw, isSolved, solvedDate, ...rest } = req.body;
    const solved = solvedRaw !== undefined ? solvedRaw : isSolved;

    if (typeof solved !== 'undefined') {
      rest.solved = solved;
      const sd = solved ? new Date(solvedDate || question.solvedDate || Date.now()) : null;
      rest.solvedDate = sd;
      // Advance the next review date by reviewInterval days when solved; clear it when unsolved
      rest.nextReview = solved
        ? new Date(sd.getTime() + (question.reviewInterval || 1) * 24 * 60 * 60 * 1000)
        : null;
    }

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: rest },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to update question' });
  }
};

// DELETE /api/questions/:id — delete a question (ownership enforced)
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }

    await question.deleteOne();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// PUT /api/questions/:id/review — mark a question as reviewed; doubles the interval (capped at 30d)
const reviewQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    if (question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const newInterval = Math.min((question.reviewInterval || 1) * 2, 30);
    const nextReview  = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: { reviewInterval: newInterval, nextReview } },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to record review' });
  }
};

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion, reviewQuestion };
