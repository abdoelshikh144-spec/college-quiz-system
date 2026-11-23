const Subject = require('../models/Subject');
const Question = require('../models/Question');
const Result = require('../models/Result');
const ExamSession = require('../models/ExamSession');

// Public: Get subjects by department (dynamic for student registration)
const getPublicSubjects = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};

    if (department) {
      if (!['CS', 'IS', 'Management'].includes(department)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department specified',
        });
      }
      filter.department = department;
    }

    const subjects = await Subject.find(filter)
      .select('_id department code name passingPercentage')
      .sort({ code: 1 });

    return res.status(200).json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error('Get Public Subjects Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subjects',
    });
  }
};

// Admin: Get all subjects with associated questions count and results count (supports department filter)
const getAdminSubjects = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    if (department && ['CS', 'IS', 'Management'].includes(department)) {
      filter.department = department;
    }

    const subjects = await Subject.find(filter).sort({ department: 1, code: 1 });

    const subjectsWithStats = await Promise.all(
      subjects.map(async (subj) => {
        const [questionCount, resultCount] = await Promise.all([
          Question.countDocuments({ subject: subj._id }),
          Result.countDocuments({ subject: subj._id }),
        ]);

        return {
          ...subj.toObject(),
          questionCount,
          resultCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      subjects: subjectsWithStats,
    });
  } catch (error) {
    console.error('Get Admin Subjects Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subjects',
    });
  }
};

// Admin: Create new subject
const createSubject = async (req, res) => {
  try {
    const { department, code, name, passingPercentage } = req.body;

    if (!department || !code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Department, subject code, and subject name are required',
      });
    }

    if (!['CS', 'IS', 'Management'].includes(department)) {
      return res.status(400).json({
        success: false,
        message: 'Department must be CS, IS, or Management',
      });
    }

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    // Check duplicate code within the same department
    const existing = await Subject.findOne({ department, code: trimmedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Subject code "${trimmedCode}" already exists in the ${department} department.`,
      });
    }

    const passRate = passingPercentage !== undefined && passingPercentage !== null && passingPercentage !== ''
      ? Number(passingPercentage)
      : 50;

    if (isNaN(passRate) || passRate < 1 || passRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Passing percentage must be a number between 1 and 100',
      });
    }

    const subject = await Subject.create({
      department,
      code: trimmedCode,
      name: trimmedName,
      passingPercentage: passRate,
      createdBy: req.admin ? req.admin._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully in the dashboard',
      subject,
    });
  } catch (error) {
    console.error('Create Subject Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create subject',
    });
  }
};

// Admin: Update subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, code, name, passingPercentage } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const targetDepartment = department || subject.department;
    if (department && !['CS', 'IS', 'Management'].includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }

    if (code) {
      const trimmedCode = code.trim().toUpperCase();
      const existing = await Subject.findOne({
        department: targetDepartment,
        code: trimmedCode,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Subject code "${trimmedCode}" already exists in ${targetDepartment} department.`,
        });
      }
      subject.code = trimmedCode;
    }

    if (department) {
      subject.department = department;
    }

    if (name) {
      subject.name = name.trim();
    }

    if (passingPercentage !== undefined && passingPercentage !== null && passingPercentage !== '') {
      const passRate = Number(passingPercentage);
      if (isNaN(passRate) || passRate < 1 || passRate > 100) {
        return res.status(400).json({
          success: false,
          message: 'Passing percentage must be a number between 1 and 100',
        });
      }
      subject.passingPercentage = passRate;
    }

    await subject.save();

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      subject,
    });
  } catch (error) {
    console.error('Update Subject Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update subject',
    });
  }
};

// Admin: Safe Delete Subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Safe handling strategy check 1: Are there examination results associated with this subject?
    const resultCount = await Result.countDocuments({ subject: id });
    if (resultCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Safe delete protection: Cannot delete subject "${subject.name}" because it already has ${resultCount} student examination result(s) recorded.`,
      });
    }

    // Safe handling strategy check 2: Are there questions linked to this subject?
    const questionCount = await Question.countDocuments({ subject: id });
    if (questionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Safe delete protection: Cannot delete subject "${subject.name}" because it has ${questionCount} associated question(s) in its question bank. Delete questions first or reassign them.`,
      });
    }

    // Safe handling strategy check 3: Are there active exam sessions?
    const activeSessionCount = await ExamSession.countDocuments({ subject: id });
    if (activeSessionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Safe delete protection: Cannot delete subject "${subject.name}" because there are active exam sessions associated with it.`,
      });
    }

    await Subject.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Subject "${subject.name}" (${subject.code}) has been safely deleted.`,
    });
  } catch (error) {
    console.error('Delete Subject Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete subject',
    });
  }
};

module.exports = {
  getPublicSubjects,
  getAdminSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
