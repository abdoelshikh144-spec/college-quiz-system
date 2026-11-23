const Question = require('../models/Question');
const Subject = require('../models/Subject');

// Admin: Get questions (supports filtering by subjectId or department)
const getAdminQuestions = async (req, res) => {
  try {
    const { subjectId, department } = req.query;
    const filter = {};

    if (subjectId) {
      filter.subject = subjectId;
    } else if (department && ['CS', 'IS', 'Management'].includes(department)) {
      const subjectsInDept = await Subject.find({ department }).select('_id');
      const subjectIds = subjectsInDept.map((s) => s._id);
      filter.subject = { $in: subjectIds };
    }

    const questions = await Question.find(filter)
      .populate('subject', 'name code department')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error('Get Admin Questions Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve questions',
    });
  }
};

// Admin: Create question manually (Supports both Bilingual and Single-language format)
const createQuestion = async (req, res) => {
  try {
    const {
      subjectId,
      text,
      options,
      text_ar,
      text_en,
      options_ar,
      options_en,
      correctIndex,
    } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId is required',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Selected subject not found',
      });
    }

    const cIndex = Number(correctIndex);
    if (isNaN(cIndex) || cIndex < 0 || cIndex > 3 || !Number.isInteger(cIndex)) {
      return res.status(400).json({
        success: false,
        message: 'correctIndex must be an integer between 0 and 3',
      });
    }

    let finalQuestionText;
    let finalOptions;

    // Check if bilingual inputs are provided
    if (text_ar || text_en || options_ar || options_en) {
      const arText = String(text_ar || '').trim();
      const enText = String(text_en || '').trim();

      if (!arText && !enText) {
        return res.status(400).json({
          success: false,
          message: 'At least one language (Arabic or English) question text is required',
        });
      }

      finalQuestionText = {
        ar: arText || enText,
        en: enText || arText,
      };

      const arOpts = Array.isArray(options_ar) ? options_ar.map((o) => String(o || '').trim()) : [];
      const enOpts = Array.isArray(options_en) ? options_en.map((o) => String(o || '').trim()) : [];

      const isArValid = arOpts.length === 4 && arOpts.every((o) => o.length > 0);
      const isEnValid = enOpts.length === 4 && enOpts.every((o) => o.length > 0);

      if (!isArValid && !isEnValid) {
        return res.status(400).json({
          success: false,
          message: 'You must provide 4 non-empty options for at least one language',
        });
      }

      finalOptions = {
        ar: isArValid ? arOpts : enOpts,
        en: isEnValid ? enOpts : arOpts,
      };
    } else if (text && typeof text === 'object') {
      // Direct object format { ar, en }
      finalQuestionText = text;
      finalOptions = options;
    } else {
      // Legacy Version 1 string and array format
      if (!text || !options) {
        return res.status(400).json({
          success: false,
          message: 'Question text and options are required',
        });
      }

      if (!Array.isArray(options) || options.length !== 4) {
        return res.status(400).json({
          success: false,
          message: 'Options must be an array of exactly 4 strings',
        });
      }

      const cleanedOpts = options.map((opt) => String(opt || '').trim());
      if (cleanedOpts.some((opt) => opt.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'All 4 options must be non-empty strings',
        });
      }

      finalQuestionText = String(text).trim();
      finalOptions = cleanedOpts;
    }

    const question = await Question.create({
      subject: subject._id,
      text: finalQuestionText,
      options: finalOptions,
      correctIndex: cIndex,
      createdBy: req.admin ? req.admin._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question,
    });
  } catch (error) {
    console.error('Create Question Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create question',
    });
  }
};

// Admin: Delete question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Delete Question Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete question',
    });
  }
};

// Admin: Bulk JSON Import (Supports both Version 1 and Version 2 Bilingual)
const importQuestionsJson = async (req, res) => {
  try {
    let { subjectId, jsonData } = req.body;

    // Handle file upload or body payload
    if (req.file && req.file.buffer) {
      try {
        jsonData = JSON.parse(req.file.buffer.toString('utf-8'));
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON file content. Could not parse JSON structure.',
        });
      }
    } else if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
      } catch (parseErr) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON string provided in jsonData field.',
        });
      }
    }

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId is required to import questions',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Selected subject not found',
      });
    }

    if (!jsonData || typeof jsonData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid question data format. Expected an object with questions array or an array of questions.',
      });
    }

    let questionsArray = [];
    if (Array.isArray(jsonData.questions)) {
      questionsArray = jsonData.questions;
    } else if (Array.isArray(jsonData)) {
      questionsArray = jsonData;
    } else {
      return res.status(400).json({
        success: false,
        message: 'JSON must contain a "questions" array.',
      });
    }

    if (questionsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The questions array is empty.',
      });
    }

    const isVersion2 = jsonData.version === 2;
    const validDocuments = [];
    const failedRecords = [];

    questionsArray.forEach((item, index) => {
      const itemNum = index + 1;

      if (!item || typeof item !== 'object') {
        failedRecords.push({
          index: itemNum,
          error: 'Question entry is not an object',
        });
        return;
      }

      // 1. Validate Correct Index
      const rawCorrect = item.correctIndex !== undefined ? item.correctIndex : item.correct;
      const cIndex = Number(rawCorrect);
      if (rawCorrect === undefined || isNaN(cIndex) || cIndex < 0 || cIndex > 3 || !Number.isInteger(cIndex)) {
        failedRecords.push({
          index: itemNum,
          text: typeof item.text === 'string' ? item.text.substring(0, 40) : 'Invalid index',
          error: 'Correct index must be an integer between 0 and 3',
        });
        return;
      }

      // 2. Check if Version 2 Bilingual structure
      if (item.text && typeof item.text === 'object' && !Array.isArray(item.text)) {
        const arText = item.text.ar ? String(item.text.ar).trim() : '';
        const enText = item.text.en ? String(item.text.en).trim() : '';

        if (!arText && !enText) {
          failedRecords.push({
            index: itemNum,
            error: 'Bilingual question text missing both Arabic and English strings',
          });
          return;
        }

        if (!item.options || typeof item.options !== 'object' || Array.isArray(item.options)) {
          failedRecords.push({
            index: itemNum,
            error: 'Version 2 bilingual options must be an object with ar and/or en arrays',
          });
          return;
        }

        const arOpts = Array.isArray(item.options.ar) ? item.options.ar.map((o) => String(o || '').trim()) : [];
        const enOpts = Array.isArray(item.options.en) ? item.options.en.map((o) => String(o || '').trim()) : [];

        const hasValidArOpts = arOpts.length === 4 && arOpts.every((o) => o.length > 0);
        const hasValidEnOpts = enOpts.length === 4 && enOpts.every((o) => o.length > 0);

        if (!hasValidArOpts && !hasValidEnOpts) {
          failedRecords.push({
            index: itemNum,
            error: 'Options must contain exactly 4 non-empty strings in at least one language (ar or en)',
          });
          return;
        }

        validDocuments.push({
          subject: subject._id,
          text: {
            ar: arText || enText,
            en: enText || arText,
          },
          options: {
            ar: hasValidArOpts ? arOpts : enOpts,
            en: hasValidEnOpts ? enOpts : arOpts,
          },
          correctIndex: cIndex,
          createdBy: req.admin ? req.admin._id : null,
        });
      } else {
        // Version 1 Legacy format (String text and array options)
        const textStr = item.text ? String(item.text).trim() : '';
        if (!textStr) {
          failedRecords.push({
            index: itemNum,
            error: 'Question text is missing or empty',
          });
          return;
        }

        if (!Array.isArray(item.options) || item.options.length !== 4) {
          failedRecords.push({
            index: itemNum,
            text: textStr.substring(0, 40),
            error: 'Options must contain exactly 4 items',
          });
          return;
        }

        const cleanedOpts = item.options.map((opt) => String(opt || '').trim());
        if (cleanedOpts.some((opt) => opt.length === 0)) {
          failedRecords.push({
            index: itemNum,
            text: textStr.substring(0, 40),
            error: 'One or more options are empty strings',
          });
          return;
        }

        validDocuments.push({
          subject: subject._id,
          text: textStr,
          options: cleanedOpts,
          correctIndex: cIndex,
          createdBy: req.admin ? req.admin._id : null,
        });
      }
    });

    let insertedCount = 0;
    if (validDocuments.length > 0) {
      const inserted = await Question.insertMany(validDocuments, { ordered: false });
      insertedCount = inserted.length;
    }

    return res.status(200).json({
      success: true,
      message: `Import processed. Successfully imported ${insertedCount} questions.`,
      report: {
        totalReceived: questionsArray.length,
        importedCount: insertedCount,
        failedCount: failedRecords.length,
        failedRecords,
      },
    });
  } catch (error) {
    console.error('Import Questions JSON Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to import questions',
    });
  }
};

module.exports = {
  getAdminQuestions,
  createQuestion,
  deleteQuestion,
  importQuestionsJson,
};
