const mongoose = require('mongoose');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');
const Result = require('../models/Result');

// Helper function to auto-finalize an expired session
const finalizeExpiredSession = async (session) => {
  const subject = await Subject.findById(session.subject);
  const questions = await Question.find({ _id: { $in: session.selectedQuestions } });

  // Map saved answers
  const answerMap = new Map();
  if (Array.isArray(session.savedAnswers)) {
    session.savedAnswers.forEach((ans) => {
      answerMap.set(String(ans.questionId), ans.selectedOption);
    });
  }

  let score = 0;
  const total = session.selectedQuestions.length;
  const answersDetail = [];

  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  session.selectedQuestions.forEach((qId) => {
    const q = questionMap.get(String(qId));
    if (!q) return;

    const qIdStr = String(q._id);
    const selected = answerMap.has(qIdStr) ? answerMap.get(qIdStr) : null;
    const isCorrect = selected !== null && selected === q.correctIndex;

    if (isCorrect) {
      score += 1;
    }

    answersDetail.push({
      questionId: q._id,
      questionText: q.text,
      options: q.options,
      selectedOption: selected,
      correctOption: q.correctIndex,
      isCorrect,
    });
  });

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passRate = subject ? subject.passingPercentage : 50;
  const status = percentage >= passRate ? 'Pass' : 'Fail';

  const newResult = await Result.create({
    studentId: session.studentId,
    studentName: session.studentName,
    department: session.department,
    subject: session.subject,
    subjectCode: subject ? subject.code : 'UNKNOWN',
    subjectName: subject ? subject.name : 'Unknown Subject',
    score,
    total,
    percentage,
    passingPercentage: passRate,
    status,
    answers: answersDetail,
    submissionType: 'Auto_Expired',
  });

  session.isCompleted = true;
  await session.save();

  return newResult;
};

// Start or Resume Exam (Dynamic question count: supports any number >= 1)
const startExam = async (req, res) => {
  try {
    const { studentId, subjectId } = req.body;

    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Subject are required',
      });
    }

    const trimmedId = studentId.trim().toUpperCase();

    // 1. Verify student exists in database
    const student = await Student.findOne({ studentId: trimmedId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student ID not found in college records',
      });
    }

    // 2. Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Selected subject does not exist',
      });
    }

    // 3. Verify student department matches subject department
    if (student.department !== subject.department) {
      return res.status(403).json({
        success: false,
        message: `Student belongs to ${student.department} department and cannot take an exam for ${subject.department} department.`,
      });
    }

    // 4. Check one-attempt restriction: Has student already completed an exam for this subject?
    const existingResult = await Result.findOne({
      studentId: trimmedId,
      subject: subject._id,
    });

    if (existingResult) {
      return res.status(403).json({
        success: false,
        alreadyAttempted: true,
        resultId: existingResult._id,
        message: 'You have already taken the examination for this subject. Only one attempt is permitted.',
      });
    }

    // 5. Check if there is an active exam session
    const existingSession = await ExamSession.findOne({
      studentId: trimmedId,
      subject: subject._id,
      isCompleted: false,
    });

    const now = new Date();

    if (existingSession) {
      // Check if session has expired
      if (now >= existingSession.expiresAt) {
        // Time expired: finalize and record result
        const autoResult = await finalizeExpiredSession(existingSession);
        return res.status(403).json({
          success: false,
          expired: true,
          resultId: autoResult._id,
          message: 'Your 15-minute examination session has expired. Your attempt has been recorded.',
        });
      }

      // Session is still active: resume and preserve timer
      const remainingSeconds = Math.max(0, Math.floor((existingSession.expiresAt - now) / 1000));

      // Fetch questions in the same order
      const questions = await Question.find({
        _id: { $in: existingSession.selectedQuestions },
      }).select('_id text options');

      // Sort questions to preserve original random order
      const questionMap = new Map(questions.map((q) => [String(q._id), q]));
      const orderedQuestions = existingSession.selectedQuestions
        .map((id) => questionMap.get(String(id)))
        .filter(Boolean);

      return res.status(200).json({
        success: true,
        resumed: true,
        sessionId: existingSession._id,
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
          department: student.department,
        },
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code,
          passingPercentage: subject.passingPercentage,
        },
        totalQuestions: orderedQuestions.length,
        remainingSeconds,
        savedAnswers: existingSession.savedAnswers || [],
        questions: orderedQuestions,
      });
    }

    // 6. Check question bank size: Must have at least 1 valid question
    const availableQuestions = await Question.find({ subject: subject._id }).select('_id text options');
    if (!availableQuestions || availableQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This subject currently has zero questions in the bank. Please contact administrator.',
      });
    }

    // 7. Dynamic Question Count: Use all available valid questions and randomize their order
    const randomizedQuestions = [...availableQuestions];
    for (let i = randomizedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomizedQuestions[i], randomizedQuestions[j]] = [randomizedQuestions[j], randomizedQuestions[i]];
    }

    // 8. Create new session with 15-minute timer calculated on server
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 15 * 60 * 1000); // 15 minutes exact

    const newSession = await ExamSession.create({
      studentId: student.studentId,
      studentName: student.fullName,
      department: student.department,
      subject: subject._id,
      selectedQuestions: randomizedQuestions.map((q) => q._id),
      startedAt,
      expiresAt,
      isCompleted: false,
      savedAnswers: [],
    });

    return res.status(200).json({
      success: true,
      resumed: false,
      sessionId: newSession._id,
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        department: student.department,
      },
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        passingPercentage: subject.passingPercentage,
      },
      totalQuestions: randomizedQuestions.length,
      remainingSeconds: 15 * 60,
      savedAnswers: [],
      questions: randomizedQuestions,
    });
  } catch (error) {
    console.error('Start Exam Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while starting examination',
    });
  }
};

// Save answer incrementally during the exam
const saveAnswer = async (req, res) => {
  try {
    const { sessionId, studentId, questionId, selectedOption } = req.body;

    if (!sessionId || !questionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId and questionId are required',
      });
    }

    const session = await ExamSession.findById(sessionId);
    if (!session || session.isCompleted) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found',
      });
    }

    // Security check: verify session ownership
    if (studentId && session.studentId !== String(studentId).trim().toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this examination session.',
      });
    }

    // Check if time expired
    if (new Date() > session.expiresAt) {
      return res.status(403).json({
        success: false,
        expired: true,
        message: 'Exam session has expired',
      });
    }

    const qIndex = session.savedAnswers.findIndex(
      (ans) => String(ans.questionId) === String(questionId)
    );

    const sOption = selectedOption !== null && selectedOption !== undefined ? Number(selectedOption) : null;

    if (qIndex >= 0) {
      session.savedAnswers[qIndex].selectedOption = sOption;
    } else {
      session.savedAnswers.push({
        questionId,
        selectedOption: sOption,
      });
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Answer saved',
    });
  } catch (error) {
    console.error('Save Answer Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save answer',
    });
  }
};

// Submit Exam (Dynamic score calculation based on actual question count)
const submitExam = async (req, res) => {
  try {
    const { sessionId, studentId, answers } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required',
      });
    }

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found',
      });
    }

    // Security check: verify session ownership
    if (studentId && session.studentId !== String(studentId).trim().toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this examination session.',
      });
    }

    if (session.isCompleted) {
      const existingResult = await Result.findOne({
        studentId: session.studentId,
        subject: session.subject,
      });
      return res.status(200).json({
        success: true,
        message: 'Examination was already submitted',
        resultId: existingResult ? existingResult._id : null,
      });
    }

    // Check double attempt in results
    const alreadyDone = await Result.findOne({
      studentId: session.studentId,
      subject: session.subject,
    });
    if (alreadyDone) {
      session.isCompleted = true;
      await session.save();
      return res.status(403).json({
        success: false,
        message: 'An attempt has already been submitted for this examination',
        resultId: alreadyDone._id,
      });
    }

    const subject = await Subject.findById(session.subject);
    const questions = await Question.find({
      _id: { $in: session.selectedQuestions },
    });

    // Create lookup for submitted answers
    const answersMap = new Map();

    // First populate from savedAnswers in session
    if (Array.isArray(session.savedAnswers)) {
      session.savedAnswers.forEach((ans) => {
        answersMap.set(String(ans.questionId), ans.selectedOption);
      });
    }

    // Override with final submitted payload if provided
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        if (ans && ans.questionId) {
          answersMap.set(
            String(ans.questionId),
            ans.selectedOption !== null && ans.selectedOption !== undefined ? Number(ans.selectedOption) : null
          );
        }
      });
    }

    // Determine if submission is Manual or Auto_Expired
    const now = new Date();
    const isExpired = now > new Date(session.expiresAt.getTime() + 15000);
    const submissionType = isExpired ? 'Auto_Expired' : 'Manual';

    let score = 0;
    const total = session.selectedQuestions.length;
    const answersDetail = [];

    // Map questions strictly according to session.selectedQuestions order
    const questionsLookup = new Map(questions.map((q) => [String(q._id), q]));

    session.selectedQuestions.forEach((qId) => {
      const q = questionsLookup.get(String(qId));
      if (!q) return;

      const qIdStr = String(q._id);
      const studentSelected = answersMap.has(qIdStr) ? answersMap.get(qIdStr) : null;
      const isCorrect = studentSelected !== null && studentSelected === q.correctIndex;

      if (isCorrect) {
        score += 1;
      }

      answersDetail.push({
        questionId: q._id,
        questionText: q.text,
        options: q.options,
        selectedOption: studentSelected,
        correctOption: q.correctIndex,
        isCorrect,
      });
    });

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const passRate = subject ? subject.passingPercentage : 50;
    const status = percentage >= passRate ? 'Pass' : 'Fail';

    const result = await Result.create({
      studentId: session.studentId,
      studentName: session.studentName,
      department: session.department,
      subject: session.subject,
      subjectCode: subject ? subject.code : 'UNKNOWN',
      subjectName: subject ? subject.name : 'Unknown Subject',
      score,
      total,
      percentage,
      passingPercentage: passRate,
      status,
      answers: answersDetail,
      submissionType,
    });

    session.isCompleted = true;
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Examination submitted successfully',
      resultId: result._id,
      result: {
        _id: result._id,
        studentId: result.studentId,
        studentName: result.studentName,
        department: result.department,
        subjectCode: result.subjectCode,
        subjectName: result.subjectName,
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        passingPercentage: result.passingPercentage,
        status: result.status,
        submissionType: result.submissionType,
        answers: result.answers,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error('Submit Exam Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting examination',
    });
  }
};

// Get Result Details (with dynamic counts and studentId ownership verification)
const getResultById = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Result ID',
      });
    }

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    // Security check: if studentId is provided, verify ownership
    if (studentId && result.studentId !== String(studentId).trim().toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this result.',
      });
    }

    // Calculate dynamic counts
    const correctCount = result.answers.filter((a) => a.isCorrect === true).length;
    const incorrectCount = result.answers.filter((a) => a.selectedOption !== null && a.selectedOption !== undefined && a.isCorrect === false).length;
    const unansweredCount = result.answers.filter((a) => a.selectedOption === null || a.selectedOption === undefined).length;

    return res.status(200).json({
      success: true,
      result: {
        ...result.toObject(),
        correctCount,
        incorrectCount,
        unansweredCount,
      },
    });
  } catch (error) {
    console.error('Get Result By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve examination result',
    });
  }
};

module.exports = {
  startExam,
  saveAnswer,
  submitExam,
  getResultById,
};
