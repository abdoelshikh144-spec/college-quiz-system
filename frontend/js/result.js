// Result Presentation and Comprehensive Answers Review Logic
// Handles Dynamic Question Counts, Bilingual Question/Options Rendering, and Language Switching

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const resultId = params.get('resultId');
  const studentId = params.get('studentId') || '';

  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultContent = document.getElementById('resultContent');

  let currentResultData = null;

  if (!resultId) {
    loadingIndicator.textContent = 'No examination result ID provided. Please return to the home page.';
    loadingIndicator.className = 'alert alert-danger';
    return;
  }

  function renderAnswersReview(answersList, lang) {
    const answersContainer = document.getElementById('answersReviewContainer');
    answersContainer.innerHTML = '';

    answersList.forEach((item, index) => {
      const qNum = index + 1;
      const isCorrect = item.isCorrect === true;

      const card = document.createElement('div');
      card.className = `review-card ${isCorrect ? 'correct' : 'incorrect'}`;

      // Card Header
      const headerDiv = document.createElement('div');
      headerDiv.className = 'review-header';

      const qTitle = document.createElement('span');
      qTitle.style.fontWeight = '700';
      qTitle.style.fontSize = '1.05rem';
      qTitle.style.color = 'var(--primary-dark)';
      qTitle.textContent = `${t('questionCount')} ${qNum} ${t('ofTotal')} ${answersList.length}`;

      const badge = document.createElement('span');
      badge.className = isCorrect ? 'badge badge-success' : 'badge badge-danger';
      badge.textContent = isCorrect ? t('answerCorrectBadge') : t('answerWrongBadge');

      headerDiv.appendChild(qTitle);
      headerDiv.appendChild(badge);
      card.appendChild(headerDiv);

      // Question Text (Bilingual with fallback)
      const qText = document.createElement('div');
      qText.style.fontSize = '1.1rem';
      qText.style.fontWeight = '600';
      qText.style.marginBottom = '1.25rem';
      qText.style.color = 'var(--primary-navy)';
      qText.textContent = getLocalizedText(item.questionText, lang);
      card.appendChild(qText);

      // Options List (Bilingual with fallback)
      const optionsBox = document.createElement('div');
      optionsBox.style.display = 'flex';
      optionsBox.style.flexDirection = 'column';
      optionsBox.style.gap = '0.5rem';

      const studentSelected = item.selectedOption;
      const correctOpt = item.correctOption;
      const localizedOptions = getLocalizedOptions(item.options, lang);

      localizedOptions.forEach((optText, optIdx) => {
        const optRow = document.createElement('div');
        optRow.className = 'review-option';

        const isThisCorrect = optIdx === correctOpt;
        const isThisStudentChoice = optIdx === studentSelected;

        let labelSuffix = '';

        if (isThisCorrect && isThisStudentChoice) {
          optRow.className = 'review-option is-correct';
          labelSuffix = ` [${t('yourAnswer')} ${t('answerCorrectBadge')}]`;
        } else if (isThisCorrect) {
          optRow.className = 'review-option is-correct';
          labelSuffix = ` [${t('correctAnswer')}]`;
        } else if (isThisStudentChoice) {
          optRow.className = 'review-option is-wrong-selection';
          labelSuffix = ` [${t('yourAnswer')} ${t('answerWrongBadge')}]`;
        }

        optRow.textContent = `${String.fromCharCode(65 + optIdx)}. ${optText}${labelSuffix}`;
        optionsBox.appendChild(optRow);
      });

      card.appendChild(optionsBox);

      // Unanswered note if applicable
      if (studentSelected === null || studentSelected === undefined) {
        const unansweredNote = document.createElement('div');
        unansweredNote.style.color = 'var(--danger-color)';
        unansweredNote.style.fontSize = '0.85rem';
        unansweredNote.style.fontWeight = '600';
        unansweredNote.style.marginTop = '0.75rem';
        unansweredNote.textContent = t('unansweredQuestion');
        card.appendChild(unansweredNote);
      }

      answersContainer.appendChild(card);
    });
  }

  function displayFullResult(result) {
    currentResultData = result;
    const lang = getLang();

    // Render Student & Subject Details
    document.getElementById('resStudentName').textContent = result.studentName;
    document.getElementById('resStudentId').textContent = result.studentId;
    document.getElementById('resDepartment').textContent = result.department;
    document.getElementById('resSubject').textContent = `${result.subjectCode} - ${result.subjectName}`;

    // Render Dynamic Score & Metrics (Depends on actual question count)
    const scoreVal = document.getElementById('resScore');
    scoreVal.textContent = `${result.score} / ${result.total}`;

    const percentageVal = document.getElementById('resPercentage');
    percentageVal.textContent = `${result.percentage}%`;

    const passRateVal = document.getElementById('resPassRate');
    passRateVal.textContent = `${result.passingPercentage}%`;

    // Dynamic Counts
    const answersList = result.answers || [];
    const correctCount = result.correctCount !== undefined
      ? result.correctCount
      : answersList.filter((a) => a.isCorrect === true).length;

    const incorrectCount = result.incorrectCount !== undefined
      ? result.incorrectCount
      : answersList.filter((a) => a.selectedOption !== null && a.selectedOption !== undefined && a.isCorrect === false).length;

    const unansweredCount = result.unansweredCount !== undefined
      ? result.unansweredCount
      : answersList.filter((a) => a.selectedOption === null || a.selectedOption === undefined).length;

    document.getElementById('resTotalCount').textContent = String(result.total);
    document.getElementById('resCorrectCount').textContent = String(correctCount);
    document.getElementById('resIncorrectCount').textContent = String(incorrectCount);
    document.getElementById('resUnansweredCount').textContent = String(unansweredCount);

    // Status Badge & Styling
    const statusBadgeContainer = document.getElementById('resultStatusBadge');
    const isPass = result.status === 'Pass';

    if (isPass) {
      statusBadgeContainer.innerHTML = `<span class="badge badge-success" style="font-size: 1.1rem; padding: 0.5rem 1.25rem;">${t('passStatus')}</span>`;
      scoreVal.parentElement.classList.add('highlight-pass');
      scoreVal.parentElement.classList.remove('highlight-fail');
    } else {
      statusBadgeContainer.innerHTML = `<span class="badge badge-danger" style="font-size: 1.1rem; padding: 0.5rem 1.25rem;">${t('failStatus')}</span>`;
      scoreVal.parentElement.classList.add('highlight-fail');
      scoreVal.parentElement.classList.remove('highlight-pass');
    }

    // Submission Type
    const submissionTypeEl = document.getElementById('resSubmissionType');
    const isAutoExpired = result.submissionType === 'Auto_Expired';
    submissionTypeEl.textContent = isAutoExpired ? t('autoExpiredSubmission') : t('manualSubmission');

    // Render Answers Review
    renderAnswersReview(answersList, lang);

    loadingIndicator.style.display = 'none';
    resultContent.style.display = 'block';
  }

  try {
    const url = `/api/exams/result/${encodeURIComponent(resultId)}?studentId=${encodeURIComponent(studentId)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to retrieve examination result');
    }

    displayFullResult(data.result);
  } catch (err) {
    console.error('Result Page Error:', err);
    loadingIndicator.textContent = `Error: ${err.message}`;
    loadingIndicator.className = 'alert alert-danger';
  }

  // Language Change Listener: Re-render with new language
  window.addEventListener('app_language_changed', (e) => {
    if (currentResultData) {
      displayFullResult(currentResultData);
    }
  });
});
