const mongoose = require('mongoose');

const resultAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    questionText: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    options: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    selectedOption: {
      type: Number,
      default: null,
    },
    correctOption: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
      uppercase: true,
      index: true,
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
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0, // Dynamic score: depends on actual question count
    },
    total: {
      type: Number,
      required: [true, 'Total number of questions is required'],
      min: 1,
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
    },
    passingPercentage: {
      type: Number,
      required: [true, 'Passing percentage is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Pass', 'Fail'],
      index: true,
    },
    answers: {
      type: [resultAnswerSchema],
      required: true,
    },
    submissionType: {
      type: String,
      enum: ['Manual', 'Auto_Expired'],
      default: 'Manual',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Strictly enforces one attempt per student per subject
resultSchema.index({ studentId: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
