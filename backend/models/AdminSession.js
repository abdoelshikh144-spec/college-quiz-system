const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically remove document when expired
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdminSession', adminSessionSchema);
