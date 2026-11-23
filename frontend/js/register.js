// Student Registration and Validation Logic
// Connects index.html to backend APIs with Department-based subject organization

document.addEventListener('DOMContentLoaded', () => {
  const studentIdInput = document.getElementById('studentIdInput');
  const verifyBtn = document.getElementById('verifyBtn');
  const subjectSelect = document.getElementById('subjectSelect');
  const startExamBtn = document.getElementById('startExamBtn');
  const alertBox = document.getElementById('alertBox');
  const verifiedBanner = document.getElementById('studentVerifiedBanner');
  const verifiedStudentName = document.getElementById('verifiedStudentName');
  const verifiedStudentDept = document.getElementById('verifiedStudentDept');
  const registrationForm = document.getElementById('registrationForm');
  const deptTabs = document.querySelectorAll('.dept-tab-btn');
  const selectedDepartmentVal = document.getElementById('selectedDepartmentVal');
  const deptLockNotice = document.getElementById('deptLockNotice');

  let verifiedStudent = null;

  function showAlert(msg, isError = true) {
    alertBox.textContent = msg;
    alertBox.className = isError ? 'alert alert-danger' : 'alert alert-success';
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  // Set active department tab
  function setActiveDeptTab(dept) {
    selectedDepartmentVal.value = dept;
    deptTabs.forEach((btn) => {
      const match = btn.getAttribute('data-dept') === dept;
      btn.classList.toggle('btn-primary', match);
      btn.classList.toggle('btn-secondary', !match);
    });
  }

  // Load subjects dynamically from MongoDB based on selected department
  async function loadSubjects(department) {
    if (!department) {
      subjectSelect.innerHTML = `<option value="">${t('selectSubjectOption')}</option>`;
      subjectSelect.disabled = true;
      startExamBtn.disabled = true;
      return;
    }

    try {
      subjectSelect.disabled = true;
      subjectSelect.innerHTML = `<option value="">${t('loading')}</option>`;

      const res = await fetch(`/api/subjects/public?department=${encodeURIComponent(department)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load subjects');
      }

      const subjects = data.subjects || [];
      if (subjects.length === 0) {
        subjectSelect.innerHTML = `<option value="">${t('noSubjectsAvailable')}</option>`;
        subjectSelect.disabled = true;
        startExamBtn.disabled = true;
        return;
      }

      let optionsHtml = `<option value="">${t('selectSubjectOption')}</option>`;
      subjects.forEach((subj) => {
        optionsHtml += `<option value="${subj._id}">${subj.code} - ${subj.name}</option>`;
      });

      subjectSelect.innerHTML = optionsHtml;
      subjectSelect.disabled = false;
      checkFormReady();
    } catch (err) {
      console.error('Load Subjects Error:', err);
      showAlert(err.message);
      subjectSelect.disabled = true;
    }
  }

  // Department Tab Click Handler (Before Verification)
  deptTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (verifiedStudent) {
        // Restricted to verified department
        return;
      }
      const dept = btn.getAttribute('data-dept');
      setActiveDeptTab(dept);
      loadSubjects(dept);
    });
  });

  // Verify Student ID with MongoDB
  async function verifyStudentId() {
    hideAlert();
    const studentId = studentIdInput.value.trim().toUpperCase();

    if (!studentId) {
      showAlert(t('idRequired'));
      return;
    }

    try {
      verifyBtn.disabled = true;
      verifyBtn.textContent = t('verifyingStudent');

      const res = await fetch(`/api/students/verify/${encodeURIComponent(studentId)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        verifiedStudent = null;
        verifiedBanner.classList.remove('active');
        deptLockNotice.style.display = 'none';

        // Unlock department tabs
        deptTabs.forEach((btn) => {
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1';
        });

        subjectSelect.innerHTML = `<option value="">${t('selectSubjectOption')}</option>`;
        subjectSelect.disabled = true;
        startExamBtn.disabled = true;
        showAlert(data.message || t('idNotFound'));
        return;
      }

      // Verified successfully
      verifiedStudent = data.student;
      verifiedStudentName.textContent = verifiedStudent.fullName;
      verifiedStudentDept.textContent = verifiedStudent.department;
      verifiedBanner.classList.add('active');

      // Lock department to student's verified department
      setActiveDeptTab(verifiedStudent.department);
      deptLockNotice.style.display = 'block';

      deptTabs.forEach((btn) => {
        const isStudentDept = btn.getAttribute('data-dept') === verifiedStudent.department;
        if (!isStudentDept) {
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '0.4';
        } else {
          btn.style.pointerEvents = 'none';
          btn.style.opacity = '1';
        }
      });

      // Load subjects for student's department
      await loadSubjects(verifiedStudent.department);
    } catch (err) {
      console.error('Verify Student Error:', err);
      showAlert('Network error while verifying student ID. Please ensure server is running.');
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = t('verifyIdBtn');
    }
  }

  function checkFormReady() {
    const isReady = verifiedStudent && subjectSelect.value;
    startExamBtn.disabled = !isReady;
  }

  // Event Listeners
  verifyBtn.addEventListener('click', verifyStudentId);

  studentIdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyStudentId();
    }
  });

  subjectSelect.addEventListener('change', checkFormReady);

  // Form submission: Start Exam
  registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    if (!verifiedStudent) {
      showAlert(t('idRequired'));
      return;
    }

    const subjectId = subjectSelect.value;
    if (!subjectId) {
      showAlert(t('selectSubjectRequired'));
      return;
    }

    try {
      startExamBtn.disabled = true;
      startExamBtn.textContent = t('loading');

      const payload = {
        studentId: verifiedStudent.studentId,
        subjectId: subjectId,
      };

      const res = await fetch('/api/exams/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // If already attempted or session expired
        if (data.alreadyAttempted && data.resultId) {
          showAlert(data.message);
          setTimeout(() => {
            window.location.href = `result.html?resultId=${data.resultId}&studentId=${encodeURIComponent(verifiedStudent.studentId)}`;
          }, 2500);
          return;
        }

        if (data.expired && data.resultId) {
          showAlert(data.message);
          setTimeout(() => {
            window.location.href = `result.html?resultId=${data.resultId}&studentId=${encodeURIComponent(verifiedStudent.studentId)}`;
          }, 2500);
          return;
        }

        throw new Error(data.message || 'Failed to start examination');
      }

      // Save session details to sessionStorage
      sessionStorage.setItem('current_exam_session', JSON.stringify({
        sessionId: data.sessionId,
        studentId: data.student.studentId,
        studentName: data.student.fullName,
        department: data.student.department,
        subjectId: data.subject.id,
        subjectName: data.subject.name,
        subjectCode: data.subject.code,
        passingPercentage: data.subject.passingPercentage,
        totalQuestions: data.totalQuestions || (data.questions ? data.questions.length : 0),
        remainingSeconds: data.remainingSeconds,
        questions: data.questions,
        savedAnswers: data.savedAnswers || [],
      }));

      // Redirect to exam page
      window.location.href = 'exam.html';
    } catch (err) {
      console.error('Start Exam Submission Error:', err);
      showAlert(err.message);
      startExamBtn.disabled = false;
      startExamBtn.textContent = t('startExamBtn');
    }
  });

  // Re-load subjects if language switched
  window.addEventListener('app_language_changed', () => {
    if (selectedDepartmentVal.value) {
      loadSubjects(selectedDepartmentVal.value);
    }
  });
});
