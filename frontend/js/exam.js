// Examination Execution Logic
// Handles Dynamic Question Count, Bilingual Question/Options Rendering,
// Answer Selection, Incremental Auto-Save, Timer, and Submission

document.addEventListener('DOMContentLoaded', () => {
  const sessionRaw = sessionStorage.getItem('current_exam_session');

  if (!sessionRaw) {
    alert('No active exam session found. Redirecting to registration page.');
    window.location.href = 'index.html';
    return;
  }

  const session = JSON.parse(sessionRaw);
  const questions = session.questions || [];

  if (questions.length === 0) {
    alert('Invalid exam session: no questions found.');
    window.location.href = 'index.html';
    return;
  }

  // DOM Elements
  const examStudentName = document.getElementById('examStudentName');
  const examStudentId = document.getElementById('examStudentId');
  const examDepartment = document.getElementById('examDepartment');
  const examSubjectName = document.getElementById('examSubjectName');
  const examSubjectCode = document.getElementById('examSubjectCode');
  const timerWidget = document.getElementById('timerWidget');
  const timerDigits = document.getElementById('timerDigits');
  const questionNumberBadge = document.getElementById('questionNumberBadge');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');
  const prevQuestionBtn = document.getElementById('prevQuestionBtn');
  const nextQuestionBtn = document.getElementById('nextQuestionBtn');
  const submitExamBtn = document.getElementById('submitExamBtn');
  const paletteGrid = document.getElementById('paletteGrid');
  const confirmSubmitModal = document.getElementById('confirmSubmitModal');
  const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
  const confirmFinalSubmitBtn = document.getElementById('confirmFinalSubmitBtn');

  // Populate Meta Info
  examStudentName.textContent = session.studentName;
  examStudentId.textContent = session.studentId;
  examDepartment.textContent = session.department;
  examSubjectName.textContent = session.subjectName;
  examSubjectCode.textContent = session.subjectCode;

  let currentIndex = 0;
  const answersMap = new Map(); // questionId -> selectedOption index (0, 1, 2, 3)
  let isSubmitting = false;

  // Prepopulate saved answers if resuming
  if (Array.isArray(session.savedAnswers)) {
    session.savedAnswers.forEach((ans) => {
      if (ans && ans.questionId && ans.selectedOption !== null && ans.selectedOption !== undefined) {
        answersMap.set(String(ans.questionId), Number(ans.selectedOption));
      }
    });
  }

  // 1. Countdown Timer Logic (Server Synchronized)
  let remainingSeconds = Math.max(0, Number(session.remainingSeconds) || 900);

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  timerDigits.textContent = formatTime(remainingSeconds);

  const timerInterval = setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 60) {
      timerWidget.classList.add('warning');
    }

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerDigits.textContent = '00:00';
      handleAutoSubmitOnTimeout();
      return;
    }

    timerDigits.textContent = formatTime(remainingSeconds);
  }, 1000);

  // 2. Incremental Auto-Save to Backend
  async function saveAnswerToServer(questionId, selectedOption) {
    try {
      await fetch('/api/exams/save-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          studentId: session.studentId,
          questionId,
          selectedOption,
        }),
      });
    } catch (err) {
      console.warn('Incremental auto-save network warning:', err.message);
    }
  }

  // 3. Question Palette Initialization (Dynamic based on actual questions.length)
  function initQuestionPalette() {
    paletteGrid.innerHTML = '';
    questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn';
      btn.textContent = String(idx + 1);
      btn.setAttribute('aria-label', `Go to question ${idx + 1}`);

      btn.addEventListener('click', () => {
        goToQuestion(idx);
      });

      paletteGrid.appendChild(btn);
    });
    updatePaletteState();
  }

  function updatePaletteState() {
    const buttons = paletteGrid.querySelectorAll('.palette-btn');
    buttons.forEach((btn, idx) => {
      const q = questions[idx];
      const isAnswered = answersMap.has(String(q._id));
      const isCurrent = idx === currentIndex;

      btn.classList.toggle('answered', isAnswered);
      btn.classList.toggle('active', isCurrent);
    });
  }

  // 4. Render Active Question with Bilingual Support
  function renderQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;

    const currentQ = questions[currentIndex];
    const qIdStr = String(currentQ._id);
    const selectedOption = answersMap.has(qIdStr) ? answersMap.get(qIdStr) : null;
    const lang = getLang();

    // Dynamic Badge: Question X of Total
    questionNumberBadge.textContent = `${t('questionCount')} ${currentIndex + 1} ${t('ofTotal')} ${questions.length}`;

    // Bilingual Question Text (Supports Version 2 object and Version 1 string fallback)
    questionText.textContent = getLocalizedText(currentQ.text, lang);

    // Bilingual Options List
    const localizedOptions = getLocalizedOptions(currentQ.options, lang);
    optionsContainer.innerHTML = '';

    localizedOptions.forEach((optText, optIdx) => {
      const optItem = document.createElement('div');
      const isSelected = selectedOption === optIdx;
      optItem.className = isSelected ? 'option-item selected' : 'option-item';

      const radio = document.createElement('div');
      radio.className = 'option-radio';

      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = optText;

      optItem.appendChild(radio);
      optItem.appendChild(text);

      optItem.addEventListener('click', () => {
        answersMap.set(qIdStr, optIdx);
        renderQuestion(currentIndex);
        updatePaletteState();
        saveAnswerToServer(currentQ._id, optIdx);
      });

      optionsContainer.appendChild(optItem);
    });

    // Update Navigation Buttons State
    prevQuestionBtn.disabled = currentIndex === 0;
    nextQuestionBtn.disabled = currentIndex === questions.length - 1;

    updatePaletteState();
  }

  function goToQuestion(index) {
    renderQuestion(index);
  }

  // Prev & Next Listeners
  prevQuestionBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      renderQuestion(currentIndex - 1);
    }
  });

  nextQuestionBtn.addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      renderQuestion(currentIndex + 1);
    }
  });

  // Re-render current question immediately when language toggle button is clicked
  window.addEventListener('app_language_changed', () => {
    renderQuestion(currentIndex);
  });

  // 5. Submit Examination Workflow
  submitExamBtn.addEventListener('click', () => {
    confirmSubmitModal.classList.add('active');
  });

  cancelSubmitBtn.addEventListener('click', () => {
    confirmSubmitModal.classList.remove('active');
  });

  confirmFinalSubmitBtn.addEventListener('click', () => {
    confirmSubmitModal.classList.remove('active');
    submitFinalExam(false);
  });

  function handleAutoSubmitOnTimeout() {
    if (isSubmitting) return;
    alert(t('timeExpiredMsg'));
    submitFinalExam(true);
  }

  async function submitFinalExam(isTimeout = false) {
    if (isSubmitting) return;
    isSubmitting = true;

    clearInterval(timerInterval);
    submitExamBtn.disabled = true;
    submitExamBtn.textContent = t('loading');

    // Build answers payload
    const submittedAnswers = questions.map((q) => ({
      questionId: q._id,
      selectedOption: answersMap.has(String(q._id)) ? answersMap.get(String(q._id)) : null,
    }));

    try {
      const res = await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          studentId: session.studentId,
          answers: submittedAnswers,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit examination');
      }

      // Clear session from storage
      sessionStorage.removeItem('current_exam_session');

      // Redirect to Result Review page
      window.location.href = `result.html?resultId=${data.resultId}&studentId=${encodeURIComponent(session.studentId)}`;
    } catch (err) {
      console.error('Submit Exam Error:', err);
      alert(`Submission error: ${err.message}. Please contact administrator.`);
      isSubmitting = false;
      submitExamBtn.disabled = false;
      submitExamBtn.textContent = t('submitExamBtn');
    }
  }

  // Warn on page unload
  window.addEventListener('beforeunload', (e) => {
    if (!isSubmitting) {
      e.preventDefault();
      e.returnValue = t('leaveWarning');
    }
  });

  // Initialize
  initQuestionPalette();
  renderQuestion(0);
});
