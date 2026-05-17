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
  const { title, topic, difficulty, tags, notes, isSolved, solvedDate, leetcodeUrl } = req.body;

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
      isSolved: isSolved || false,
      solvedDate: isSolved ? solvedDate || new Date() : null,
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

    const { isSolved, solvedDate, ...rest } = req.body;

    // Auto-stamp solvedDate when a question is first marked solved
    if (typeof isSolved !== 'undefined') {
      rest.isSolved = isSolved;
      rest.solvedDate = isSolved ? (solvedDate || question.solvedDate || new Date()) : null;
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

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion };
