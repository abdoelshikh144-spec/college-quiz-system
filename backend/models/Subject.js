const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CS', 'IS', 'Management'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    passingPercentage: {
      type: Number,
      required: [true, 'Passing percentage is required'],
      default: 50,
      min: [1, 'Passing percentage must be at least 1'],
      max: [100, 'Passing percentage cannot exceed 100'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate subject codes within the same department
subjectSchema.index({ department: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
