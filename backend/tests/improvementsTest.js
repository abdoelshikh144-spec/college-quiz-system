const http = require('http');
const app = require('../server');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const Result = require('../models/Result');
const AdminSession = require('../models/AdminSession');

const runImprovementsTestSuite = async () => {
  const PORT = 5003;
  const server = app.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`RUNNING MAJOR IMPROVEMENTS & REGRESSION TEST SUITE (PORT ${PORT})`);
    console.log(`======================================================\n`);

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

    try {
      // 1. Admin Authentication Tests
      console.log('--- 1. Testing Admin Login & Auth Protection ---');
      const badLogin = await request('POST', '/api/admin/login', {
        email: 'abdoelshikh144@gmail.com',
        password: 'wrong_password',
      });
      console.log('Failed Login Test (Expected 401):', badLogin.status, badLogin.data.message);
      if (badLogin.status !== 401) throw new Error('Failed login should return 401');

      const goodLogin = await request('POST', '/api/admin/login', {
        email: 'abdoelshikh144@gmail.com',
        password: '123456789',
      });
      console.log('Successful Login Test (Expected 200):', goodLogin.status, 'Token received:', !!goodLogin.data.token);
      if (goodLogin.status !== 200 || !goodLogin.data.token) throw new Error('Admin login failed');

      const adminToken = goodLogin.data.token;
      const adminHeaders = { Authorization: `Bearer ${adminToken}` };

      // 2. Department-based Subject Organization Tests
      console.log('\n--- 2. Testing Department-Based Subject Organization ---');
      const timeStamp = Date.now();
      // Create subjects in CS, IS, and Management
      const csSubjRes = await request('POST', '/api/subjects', {
        department: 'CS',
        code: `CS_${timeStamp}`,
        name: 'Computer Science Testing Subject',
        passingPercentage: 60,
      }, adminHeaders);

      const isSubjRes = await request('POST', '/api/subjects', {
        department: 'IS',
        code: `IS_${timeStamp}`,
        name: 'Information Systems Testing Subject',
        passingPercentage: 50,
      }, adminHeaders);

      const mgmtSubjRes = await request('POST', '/api/subjects', {
        department: 'Management',
        code: `MG_${timeStamp}`,
        name: 'Management Testing Subject',
        passingPercentage: 55,
      }, adminHeaders);

      const csSubjectId = csSubjRes.data.subject._id;
      const isSubjectId = isSubjRes.data.subject._id;

      // Filter admin subjects by department
      const csFilterRes = await request('GET', '/api/subjects?department=CS', null, adminHeaders);
      const allCs = csFilterRes.data.subjects.every((s) => s.department === 'CS');
      console.log('CS Department Filter returns only CS subjects:', allCs, `Count: ${csFilterRes.data.subjects.length}`);
      if (!allCs) throw new Error('Department filter leaked non-CS subjects');

      const isFilterRes = await request('GET', '/api/subjects?department=IS', null, adminHeaders);
      const allIs = isFilterRes.data.subjects.every((s) => s.department === 'IS');
      console.log('IS Department Filter returns only IS subjects:', allIs, `Count: ${isFilterRes.data.subjects.length}`);
      if (!allIs) throw new Error('Department filter leaked non-IS subjects');

      // 3. Complete Bilingual Question Import & Version Compatibility
      console.log('\n--- 3. Testing Complete Bilingual Question System ---');

      // Test Version 2 Bilingual JSON import (3 questions)
      const v2BilingualJson = {
        version: 2,
        questions: [
          {
            text: {
              ar: 'ما هو التعقيد الزمني للبحث الثنائي؟',
              en: 'What is the time complexity of binary search?'
            },
            options: {
              ar: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
              en: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)']
            },
            correct: 1
          },
          {
            text: {
              ar: 'أي هيكل بيانات يعتمد مبدأ LIFO؟',
              en: 'Which data structure follows LIFO?'
            },
            options: {
              ar: ['طابور (Queue)', 'مكدس (Stack)', 'شجرة (Tree)', 'مصفوفة (Array)'],
              en: ['Queue', 'Stack', 'Tree', 'Array']
            },
            correct: 1
          },
          {
            text: {
              ar: 'ما هو دور المفتاح الأساسي في قواعد البيانات؟',
              en: 'What is the role of a primary key in database?'
            },
            options: {
              ar: ['الفرادة وعدم التكرار', 'التكرار', 'التشفير', 'المؤشر فقط'],
              en: ['Uniqueness', 'Redundancy', 'Encryption', 'Pointer only']
            },
            correct: 0
          }
        ]
      };

      const importV2Res = await request('POST', '/api/questions/import', {
        subjectId: csSubjectId,
        jsonData: v2BilingualJson,
      }, adminHeaders);
      console.log('Version 2 Bilingual Import Status:', importV2Res.status, 'Imported:', importV2Res.data.report.importedCount);
      if (importV2Res.status !== 200 || importV2Res.data.report.importedCount !== 3) {
        throw new Error('Version 2 bilingual import failed');
      }

      // Test Version 1 Legacy format import backward compatibility (2 questions into IS subject)
      const v1LegacyJson = {
        version: 1,
        questions: [
          {
            text: 'Legacy Question 1 text',
            options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
            correct: 2
          },
          {
            text: 'Legacy Question 2 text',
            options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
            correct: 0
          }
        ]
      };

      const importV1Res = await request('POST', '/api/questions/import', {
        subjectId: isSubjectId,
        jsonData: v1LegacyJson,
      }, adminHeaders);
      console.log('Version 1 Legacy Import Status:', importV1Res.status, 'Imported:', importV1Res.data.report.importedCount);
      if (importV1Res.status !== 200 || importV1Res.data.report.importedCount !== 2) {
        throw new Error('Version 1 legacy import backward compatibility failed');
      }

      // 4. Dynamic Question Count Tests (3 questions exam on CS subject)
      console.log('\n--- 4. Testing Dynamic Question Count (3 Questions) ---');
      // Create student in CS
      const studentId1 = `ST_DYN_${Date.now()}`;
      await request('POST', '/api/students', {
        studentId: studentId1,
        fullName: 'Dynamic Test Student 1',
        department: 'CS',
      }, adminHeaders);

      const start3QRes = await request('POST', '/api/exams/start', {
        studentId: studentId1,
        subjectId: csSubjectId,
      });
      console.log('Start 3-Question Exam Status:', start3QRes.status);
      console.log('Actual questions delivered count:', start3QRes.data.questions ? start3QRes.data.questions.length : 0);
      if (start3QRes.status !== 200 || start3QRes.data.questions.length !== 3) {
        throw new Error('Dynamic exam did not deliver exact 3 available questions');
      }

      // Verify questions contain bilingual objects
      const isBilingual = typeof start3QRes.data.questions[0].text === 'object' && !!start3QRes.data.questions[0].text.ar;
      console.log('Bilingual structure present in exam payload:', isBilingual);
      if (!isBilingual) throw new Error('Bilingual structure missing in question payload');

      // Submit 3-question exam (fetch actual questions from DB to answer exactly 2 correctly)
      const qDocs = await Question.find({ _id: { $in: start3QRes.data.questions.map((q) => q._id) } });
      const qDocMap = new Map(qDocs.map((q) => [String(q._id), q.correctIndex]));

      const submittedAnswers = start3QRes.data.questions.map((q, idx) => {
        const correct = qDocMap.get(String(q._id));
        // Make first 2 answers correct, 3rd answer incorrect
        const selected = idx < 2 ? correct : (correct === 0 ? 1 : 0);
        return { questionId: q._id, selectedOption: selected };
      });

      const sessionId3Q = start3QRes.data.sessionId;
      const submit3QRes = await request('POST', '/api/exams/submit', {
        sessionId: sessionId3Q,
        studentId: studentId1,
        answers: submittedAnswers,
      });
      console.log('Submit 3-Question Exam Score:', `${submit3QRes.data.result.score} / ${submit3QRes.data.result.total}`);
      console.log('Percentage:', `${submit3QRes.data.result.percentage}%`);
      console.log('Status (Pass/Fail):', submit3QRes.data.result.status);
      if (submit3QRes.data.result.score !== 2 || submit3QRes.data.result.total !== 3 || submit3QRes.data.result.percentage !== 67) {
        throw new Error(`Score calculation for 3 questions failed: score=${submit3QRes.data.result.score}, total=${submit3QRes.data.result.total}`);
      }

      // Test Result API dynamic breakdown counts
      const getResultRes = await request('GET', `/api/exams/result/${submit3QRes.data.result._id}?studentId=${studentId1}`);
      console.log('Dynamic Breakdown from API:', {
        total: getResultRes.data.result.total,
        correctCount: getResultRes.data.result.correctCount,
        incorrectCount: getResultRes.data.result.incorrectCount,
        unansweredCount: getResultRes.data.result.unansweredCount,
      });
      if (getResultRes.data.result.correctCount !== 2 || getResultRes.data.result.incorrectCount !== 1 || getResultRes.data.result.unansweredCount !== 0) {
        throw new Error('Dynamic breakdown counts calculation failed');
      }

      // 5. Dynamic Question Count Tests (5 questions exam)
      console.log('\n--- 5. Testing Dynamic Question Count (5 Questions) ---');
      // Add 2 more questions to make total 5
      await request('POST', '/api/questions/import', {
        subjectId: csSubjectId,
        jsonData: {
          version: 2,
          questions: [
            { text: { ar: 'سؤال 4', en: 'Question 4' }, options: { ar: ['أ', 'ب', 'ج', 'د'], en: ['A', 'B', 'C', 'D'] }, correct: 0 },
            { text: { ar: 'سؤال 5', en: 'Question 5' }, options: { ar: ['أ', 'ب', 'ج', 'د'], en: ['A', 'B', 'C', 'D'] }, correct: 2 },
          ]
        }
      }, adminHeaders);

      const studentId2 = `ST_DYN5_${Date.now()}`;
      await request('POST', '/api/students', {
        studentId: studentId2,
        fullName: 'Dynamic Test Student 2',
        department: 'CS',
      }, adminHeaders);

      const start5QRes = await request('POST', '/api/exams/start', {
        studentId: studentId2,
        subjectId: csSubjectId,
      });
      console.log('Start 5-Question Exam Count:', start5QRes.data.questions.length);
      if (start5QRes.data.questions.length !== 5) throw new Error('Expected exactly 5 questions');

      const submit5QRes = await request('POST', '/api/exams/submit', {
        sessionId: start5QRes.data.sessionId,
        studentId: studentId2,
        answers: start5QRes.data.questions.map((q, idx) => ({ questionId: q._id, selectedOption: 0 })),
      });
      console.log('5-Question Exam Result Total:', submit5QRes.data.result.total, 'Score:', submit5QRes.data.result.score);
      if (submit5QRes.data.result.total !== 5) throw new Error('Expected result total to be 5');

      // 6. Test 0 Questions Error Prevention
      console.log('\n--- 6. Testing 0 Questions Error Prevention ---');
      const emptySubjectRes = await request('POST', '/api/subjects', {
        department: 'Management',
        code: `MG_EMPTY_${Date.now()}`,
        name: 'Empty Questions Subject',
        passingPercentage: 50,
      }, adminHeaders);
      const emptySubjId = emptySubjectRes.data.subject._id;

      const studentIdMgmt = `ST_MGMT_${Date.now()}`;
      await request('POST', '/api/students', {
        studentId: studentIdMgmt,
        fullName: 'Management Student',
        department: 'Management',
      }, adminHeaders);

      const emptyExamRes = await request('POST', '/api/exams/start', {
        studentId: studentIdMgmt,
        subjectId: emptySubjId,
      });
      console.log('Start Exam on Empty Bank (Expected 400):', emptyExamRes.status, emptyExamRes.data.message);
      if (emptyExamRes.status !== 400) throw new Error('Exam on 0 questions should return 400 Bad Request');

      // 7. Testing Automatic Logout / Revocation
      console.log('\n--- 7. Testing Admin Logout / Session Revocation ---');
      const logoutRes = await request('POST', '/api/admin/logout', null, adminHeaders);
      console.log('Logout Status (Expected 200):', logoutRes.status, logoutRes.data.message);

      // Verify that revoked token cannot access protected route
      const accessAfterLogout = await request('GET', '/api/admin/me', null, adminHeaders);
      console.log('Access Protected Route with Revoked Token (Expected 401):', accessAfterLogout.status, accessAfterLogout.data.message);
      if (accessAfterLogout.status !== 401) throw new Error('Revoked session should be denied with 401');

      console.log('\n======================================================');
      console.log('ALL FOUR MAJOR IMPROVEMENTS & REGRESSION TESTS PASSED (100%)!');
      console.log('======================================================\n');
    } catch (testErr) {
      console.error('\nTEST SUITE FAILED:', testErr.message);
      process.exitCode = 1;
    } finally {
      server.close(() => {
        console.log('Test server closed.');
        process.exit();
      });
    }
  });
};

runImprovementsTestSuite();
