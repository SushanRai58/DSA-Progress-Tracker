const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    solvedDate: {
      type: Date,
      default: null,
    },
    leetcodeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    reviewInterval: {
      type: Number,
      default: 1,
    },
    nextReview: {
      type: Date,
      default: null,
    },
    // Each question is scoped to a single user — prevents cross-user data leaks
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
