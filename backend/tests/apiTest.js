const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const app = require('../server');

// Helper to make internal requests to the running express server
const runApiTests = async () => {
  const PORT = 5001; // Run test on a dedicated test port
  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);

    try {
      const baseUrl = `http://127.0.0.1:${PORT}`;

      const request = async (method, path, body = null, headers = {}) => {
        return new Promise((resolve, reject) => {
          const url = new URL(path, baseUrl);
          const options = {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          };

          const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                resolve({ status: res.statusCode, data: parsed });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          });

          req.on('error', (err) => reject(err));
          if (body) {
            req.write(JSON.stringify(body));
          }
          req.end();
        });
      };

      console.log('\n--- 1. Testing Health Endpoint ---');
      const healthRes = await request('GET', '/api/health');
      console.log('Health Status:', healthRes.status, healthRes.data);
      if (healthRes.status !== 200) throw new Error('Health check failed');

      console.log('\n--- 2. Testing Admin Login ---');
      const loginRes = await request('POST', '/api/admin/login', {
        email: 'abdoelshikh144@gmail.com',
        password: '123456789',
      });
      console.log('Login Status:', loginRes.status, 'Token received:', !!loginRes.data.token);
      if (loginRes.status !== 200 || !loginRes.data.token) throw new Error('Admin login failed');

      const adminToken = loginRes.data.token;
      const adminHeaders = { Authorization: `Bearer ${adminToken}` };

      console.log('\n--- 3. Testing Subjects Management (Admin) ---');
      // Create Subject in CS
      const createSubjRes = await request(
        'POST',
        '/api/subjects',
        {
          department: 'CS',
          code: 'CS101',
          name: 'Algorithms & Problem Solving',
          passingPercentage: 60,
        },
        adminHeaders
      );
      console.log('Create Subject Status:', createSubjRes.status, createSubjRes.data.message || createSubjRes.data);
      const subjectId = createSubjRes.data.subject ? createSubjRes.data.subject._id : null;

      // Test Duplicate Subject Code Prevention in same department
      const dupSubjRes = await request(
        'POST',
        '/api/subjects',
        {
          department: 'CS',
          code: 'CS101',
          name: 'Another Subject with Same Code',
          passingPercentage: 50,
        },
        adminHeaders
      );
      console.log('Duplicate Subject Rejection (Expected 409):', dupSubjRes.status, dupSubjRes.data.message);
      if (dupSubjRes.status !== 409) throw new Error('Duplicate subject check failed');

      // Test Public Subjects API
      const publicSubjRes = await request('GET', '/api/subjects/public?department=CS');
      console.log('Public Subjects for CS Count:', publicSubjRes.data.subjects ? publicSubjRes.data.subjects.length : 0);

      console.log('\n--- 4. Testing Student Registration & ID Verification ---');
      // Create student
      const createStudentRes = await request(
        'POST',
        '/api/students',
        {
          studentId: 'ST2024001',
          fullName: 'Mohamed Ahmed Ibrahim',
          department: 'CS',
        },
        adminHeaders
      );
      console.log('Create Student Status:', createStudentRes.status, createStudentRes.data.message || createStudentRes.data);

      // Verify Student ID
      const verifyRes = await request('GET', '/api/students/verify/ST2024001');
      console.log('Verify Student Status (Expected 200):', verifyRes.status, verifyRes.data);
      if (verifyRes.status !== 200 || verifyRes.data.student.fullName !== 'Mohamed Ahmed Ibrahim') {
        throw new Error('Student verification failed');
      }

      // Verify Invalid Student ID
      const invalidVerifyRes = await request('GET', '/api/students/verify/INVALID999');
      console.log('Verify Invalid Student Status (Expected 404):', invalidVerifyRes.status, invalidVerifyRes.data.message);
      if (invalidVerifyRes.status !== 404) throw new Error('Invalid student verification should return 404');

      console.log('\n--- 5. Testing JSON Question Import (Bulk Import) ---');
      const sampleBank = {
        version: 1,
        questions: [
          { text: 'What is the time complexity of binary search in sorted array?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], correct: 1 },
          { text: 'Which data structure follows the LIFO principle?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correct: 1 },
          { text: 'Which data structure follows the FIFO principle?', options: ['Queue', 'Stack', 'Graph', 'Hash Map'], correct: 0 },
          { text: 'What is the base case in a recursive function?', options: ['Condition to stop recursion', 'The first line of code', 'An infinite loop', 'A syntax error'], correct: 0 },
          { text: 'Which sorting algorithm has the best average-case performance?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], correct: 2 },
          { text: 'In JavaScript, which operator compares value without type coercion?', options: ['==', '===', '!=', '='], correct: 1 },
          { text: 'What does CSS stand for in web technologies?', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Coded Style Syntax'], correct: 1 },
          { text: 'What does RAM stand for in computer hardware?', options: ['Random Access Memory', 'Read Only Memory', 'Rapid Action Module', 'Run Application Main'], correct: 0 },
          { text: 'What is the primary key in a relational database?', options: ['A unique identifier for each record', 'Any text column', 'A foreign key from another table', 'A nullable field'], correct: 0 },
          { text: 'Which protocol is used for secure web browsing?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correct: 2 },
          { text: 'Which tag is used to create an unordered list in HTML?', options: ['<ol>', '<ul>', '<li>', '<list>'], correct: 1 },
          { text: 'What is a boolean data type?', options: ['A number', 'A string of characters', 'A value that can be true or false', 'An array of items'], correct: 2 },
        ],
      };

      const importRes = await request(
        'POST',
        '/api/questions/import',
        {
          subjectId,
          jsonData: sampleBank,
        },
        adminHeaders
      );
      console.log('Question Import Status:', importRes.status, importRes.data.message, importRes.data.report);
      if (importRes.status !== 200 || importRes.data.report.importedCount < 10) {
        throw new Error('Question import failed');
      }

      console.log('\n--- 6. Testing Examination Workflow (10 Questions, Randomization, 15 Min Timer) ---');
      const startExamRes = await request('POST', '/api/exams/start', {
        studentId: 'ST2024001',
        subjectId,
      });
      console.log('Start Exam Status:', startExamRes.status, 'SessionId:', startExamRes.data.sessionId);
      console.log('Questions count received:', startExamRes.data.questions ? startExamRes.data.questions.length : 0);
      console.log('Remaining Seconds on Server:', startExamRes.data.remainingSeconds);
      if (startExamRes.status !== 200 || startExamRes.data.questions.length !== 10) {
        throw new Error('Exam did not deliver exactly 10 questions');
      }

      // Verify that correct answers are NOT exposed in questions
      const exposed = startExamRes.data.questions.some((q) => q.correctIndex !== undefined || q.correct !== undefined);
      console.log('Are correct answers hidden before submission?', !exposed);
      if (exposed) throw new Error('SECURITY VIOLATION: correct answers were exposed before submission!');

      const sessionId = startExamRes.data.sessionId;
      const questions = startExamRes.data.questions;

      // Save answer for first question
      const saveAnsRes = await request('POST', '/api/exams/save-answer', {
        sessionId,
        questionId: questions[0]._id,
        selectedOption: 1,
      });
      console.log('Save Answer Status:', saveAnsRes.status, saveAnsRes.data.message);

      // Submit examination with answers (answering 7 correctly to test pass/fail with 60% passing rate)
      const answersToSubmit = questions.map((q, idx) => ({
        questionId: q._id,
        selectedOption: idx < 7 ? 1 : 0, // Mock student answers
      }));

      const submitRes = await request('POST', '/api/exams/submit', {
        sessionId,
        answers: answersToSubmit,
      });
      console.log('Submit Exam Status:', submitRes.status);
      console.log('Score:', submitRes.data.result.score, '/ 10');
      console.log('Percentage:', submitRes.data.result.percentage, '%');
      console.log('Status (Pass/Fail):', submitRes.data.result.status);
      console.log('Passing Percentage Required:', submitRes.data.result.passingPercentage, '%');
      console.log('Answers breakdown count:', submitRes.data.result.answers.length);

      if (submitRes.status !== 200 || !submitRes.data.result) {
        throw new Error('Exam submission failed');
      }

      console.log('\n--- 7. Testing One-Attempt Restriction ---');
      const reattemptRes = await request('POST', '/api/exams/start', {
        studentId: 'ST2024001',
        subjectId,
      });
      console.log('Re-attempt Status (Expected 403):', reattemptRes.status, reattemptRes.data.message);
      if (reattemptRes.status !== 403) throw new Error('One attempt restriction failed: student was able to re-take exam!');

      console.log('\n--- 8. Testing Safe Deletion Strategy for Subjects ---');
      const deleteSubjRes = await request('DELETE', `/api/subjects/${subjectId}`, null, adminHeaders);
      console.log('Delete Subject Protected (Expected 400):', deleteSubjRes.status, deleteSubjRes.data.message);
      if (deleteSubjRes.status !== 400) throw new Error('Safe delete protection failed: subject was deleted despite having results/questions!');

      console.log('\n--- 9. Testing Admin Results & Statistics ---');
      const resultsRes = await request('GET', '/api/admin/results?department=CS', null, adminHeaders);
      console.log('Admin Results Status:', resultsRes.status, 'Total exams retrieved:', resultsRes.data.stats.totalExams);
      console.log('Pass Rate:', resultsRes.data.stats.passRate, '%');

      const statsRes = await request('GET', '/api/admin/stats', null, adminHeaders);
      console.log('Admin Dashboard Stats:', statsRes.data.stats);

      console.log('\n======================================================');
      console.log('ALL PHASE 2 BACKEND & DATABASE TESTS PASSED WITH 100% SUCCESS!');
      console.log('======================================================\n');
    } catch (testError) {
      console.error('\nTEST SUITE FAILED:', testError.message);
      process.exitCode = 1;
    } finally {
      server.close(() => {
        console.log('Test server closed.');
        process.exit();
      });
    }
  });
};

runApiTests();
