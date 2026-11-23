const Student = require('../models/Student');

// Verify student by studentId
const verifyStudent = async (req, res) => {
  try {
    const rawId = req.params.studentId;
    if (!rawId || !rawId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    const studentId = rawId.trim().toUpperCase();
    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student ID not found in college records. Please verify your ID with the administration.',
      });
    }

    return res.status(200).json({
      success: true,
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        department: student.department,
      },
    });
  } catch (error) {
    console.error('Verify Student Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying student ID',
    });
  }
};

// Admin: Get all students
const getAllStudents = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    if (department) filter.department = department;

    const students = await Student.find(filter).sort({ studentId: 1 });
    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('Get All Students Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
    });
  }
};

// Admin: Create student
const createStudent = async (req, res) => {
  try {
    const { studentId, fullName, department } = req.body;

    if (!studentId || !fullName || !department) {
      return res.status(400).json({
        success: false,
        message: 'All fields (studentId, fullName, department) are required',
      });
    }

    const trimmedId = studentId.trim().toUpperCase();
    const existing = await Student.findOne({ studentId: trimmedId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student with ID ${trimmedId} already exists`,
      });
    }

    const student = await Student.create({
      studentId: trimmedId,
      fullName: fullName.trim(),
      department,
    });

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student,
    });
  } catch (error) {
    console.error('Create Student Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student',
    });
  }
};

module.exports = {
  verifyStudent,
  getAllStudents,
  createStudent,
};
