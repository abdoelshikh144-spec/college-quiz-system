const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true,
    },
    // Supports Version 1 (String) and Version 2 (Bilingual Object: { ar: String, en: String })
    text: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Question text is required'],
    },
    // Supports Version 1 (Array of 4 Strings) and Version 2 (Bilingual Object: { ar: [String], en: [String] })
    options: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Four options are required'],
      validate: {
        validator: function (val) {
          if (Array.isArray(val)) {
            // Version 1 legacy format
            return val.length === 4 && val.every((opt) => typeof opt === 'string' && opt.trim().length > 0);
          } else if (val && typeof val === 'object') {
            // Version 2 bilingual format: must have at least ar or en array of 4 items
            const arValid = !val.ar || (Array.isArray(val.ar) && val.ar.length === 4 && val.ar.every((o) => typeof o === 'string' && o.trim().length > 0));
            const enValid = !val.en || (Array.isArray(val.en) && val.en.length === 4 && val.en.every((o) => typeof o === 'string' && o.trim().length > 0));
            const hasAtLeastOne = (Array.isArray(val.ar) && val.ar.length === 4) || (Array.isArray(val.en) && val.en.length === 4);
            return arValid && enValid && hasAtLeastOne;
          }
          return false;
        },
        message: 'Options must contain four non-empty strings for each language provided',
      },
    },
    correctIndex: {
      type: Number,
      required: [true, 'Correct option index is required'],
      min: [0, 'Correct index must be between 0 and 3'],
      max: [3, 'Correct index must be between 0 and 3'],
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

module.exports = mongoose.model('Question', questionSchema);
