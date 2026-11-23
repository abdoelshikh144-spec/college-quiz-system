const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      index: true,
      trim: true,
      uppercase: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CS', 'IS', 'Management'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    selectedQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    savedAnswers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedOption: {
          type: Number,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find active session for student and subject
examSessionSchema.index({ studentId: 1, subject: 1, isCompleted: 1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
