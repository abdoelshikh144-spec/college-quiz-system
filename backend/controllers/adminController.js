const AdminUser = require('../models/AdminUser');
const AdminSession = require('../models/AdminSession');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const {
  generateSessionToken,
  hashToken,
  comparePassword,
} = require('../utils/authUtils');

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const admin = await AdminUser.findOne({ email: cleanEmail });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate session token
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await AdminSession.create({
      tokenHash,
      adminUser: admin._id,
      expiresAt,
    });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        _id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin login',
    });
  }
};

// Admin Logout
const adminLogout = async (req, res) => {
  try {
    if (req.sessionDoc) {
      await AdminSession.findByIdAndDelete(req.sessionDoc._id);
    }
    res.clearCookie('adminToken');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Admin Logout Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log out',
    });
  }
};

// Admin Me
const getAdminMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: {
      _id: req.admin._id,
      email: req.admin.email,
    },
  });
};

// Admin: Get Results with Filtering
const getAdminResults = async (req, res) => {
  try {
    const { department, subjectId, status, search } = req.query;
    const filter = {};

    if (department && ['CS', 'IS', 'Management'].includes(department)) {
      filter.department = department;
    }

    if (subjectId) {
      filter.subject = subjectId;
    }

    if (status && ['Pass', 'Fail'].includes(status)) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { studentId: { $regex: term, $options: 'i' } },
        { studentName: { $regex: term, $options: 'i' } },
        { subjectCode: { $regex: term, $options: 'i' } },
      ];
    }

    const results = await Result.find(filter).sort({ createdAt: -1 });

    // Calculate summary statistics
    const totalExams = results.length;
    const passedCount = results.filter((r) => r.status === 'Pass').length;
    const failedCount = results.filter((r) => r.status === 'Fail').length;
    const passRate = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0;
    const averageScore =
      totalExams > 0
        ? (results.reduce((acc, r) => acc + r.score, 0) / totalExams).toFixed(1)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalExams,
        passedCount,
        failedCount,
        passRate,
        averageScore,
      },
      results,
    });
  } catch (error) {
    console.error('Get Admin Results Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve examination results',
    });
  }
};

// Admin: Overall Dashboard Summary
const getAdminStats = async (req, res) => {
  try {
    const [totalStudents, totalSubjects, totalQuestions, totalExams] = await Promise.all([
      Student.countDocuments(),
      Subject.countDocuments(),
      Question.countDocuments(),
      Result.countDocuments(),
    ]);

    const passedExams = await Result.countDocuments({ status: 'Pass' });
    const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalSubjects,
        totalQuestions,
        totalExams,
        passedExams,
        passRate,
      },
    });
  } catch (error) {
    console.error('Get Admin Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics',
    });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  getAdminMe,
  getAdminResults,
  getAdminStats,
};
