// Admin Dashboard Controller Logic
// Handles Department Filters, Bilingual Question Entry, JSON Bulk Import,
// Clean Manual Login, and Automatic Logout upon leaving portal

document.addEventListener('DOMContentLoaded', () => {
  // Use sessionStorage so closing browser tab automatically ends admin session
  let adminToken = sessionStorage.getItem('admin_token') || null;
  let cachedSubjects = [];
  let isInternalAction = false;

  // DOM Elements - Auth & Layout
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminEmailInput = document.getElementById('adminEmail');
  const adminPasswordInput = document.getElementById('adminPassword');
  const adminEmailDisplay = document.getElementById('adminEmailDisplay');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const leaveToStudentPortalLink = document.getElementById('leaveToStudentPortalLink');
  const adminAlertBox = document.getElementById('adminAlertBox');

  // DOM Elements - Subjects
  const filterSubjectDept = document.getElementById('filterSubjectDept');
  const subjectsTableBody = document.getElementById('subjectsTableBody');
  const subjectModal = document.getElementById('subjectModal');
  const subjectForm = document.getElementById('subjectForm');
  const openAddSubjectModalBtn = document.getElementById('openAddSubjectModalBtn');
  const editSubjectId = document.getElementById('editSubjectId');
  const subDepartment = document.getElementById('subDepartment');
  const subCode = document.getElementById('subCode');
  const subName = document.getElementById('subName');
  const subPassingPercentage = document.getElementById('subPassingPercentage');
  const subjectModalTitle = document.getElementById('subjectModalTitle');

  // DOM Elements - Questions
  const questionDeptFilter = document.getElementById('questionDeptFilter');
  const questionSubjectFilter = document.getElementById('questionSubjectFilter');
  const questionsTableBody = document.getElementById('questionsTableBody');
  const openAddQuestionModalBtn = document.getElementById('openAddQuestionModalBtn');
  const questionModal = document.getElementById('questionModal');
  const manualQuestionForm = document.getElementById('manualQuestionForm');
  const manualQSubject = document.getElementById('manualQSubject');
  const openImportJsonModalBtn = document.getElementById('openImportJsonModalBtn');
  const importJsonModal = document.getElementById('importJsonModal');
  const importJsonForm = document.getElementById('importJsonForm');
  const importDeptSelect = document.getElementById('importDeptSelect');
  const importSubjectSelect = document.getElementById('importSubjectSelect');
  const jsonFileInput = document.getElementById('jsonFileInput');
  const jsonTextArea = document.getElementById('jsonTextArea');
  const importReportBox = document.getElementById('importReportBox');
  const repTotal = document.getElementById('repTotal');
  const repSuccess = document.getElementById('repSuccess');
  const repFailed = document.getElementById('repFailed');
  const repFailedDetails = document.getElementById('repFailedDetails');

  // DOM Elements - Results
  const resultsTableBody = document.getElementById('resultsTableBody');
  const statTotalExamsVal = document.getElementById('statTotalExamsVal');
  const statPassedExamsVal = document.getElementById('statPassedExamsVal');
  const statFailedExamsVal = document.getElementById('statFailedExamsVal');
  const statPassRateVal = document.getElementById('statPassRateVal');
  const filterResultDept = document.getElementById('filterResultDept');
  const filterResultSubject = document.getElementById('filterResultSubject');
  const filterResultStatus = document.getElementById('filterResultStatus');
  const filterResultSearch = document.getElementById('filterResultSearch');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  // DOM Elements - Students
  const studentsTableBody = document.getElementById('studentsTableBody');
  const openAddStudentModalBtn = document.getElementById('openAddStudentModalBtn');
  const studentModal = document.getElementById('studentModal');
  const addStudentForm = document.getElementById('addStudentForm');

  // Helper: Show Alert
  function showAlert(msg, isError = true) {
    adminAlertBox.textContent = msg;
    adminAlertBox.className = isError ? 'alert alert-danger' : 'alert alert-success';
    adminAlertBox.style.display = 'block';
    setTimeout(() => {
      adminAlertBox.style.display = 'none';
    }, 5000);
  }

  // Helper: Authenticated Fetch
  async function authFetch(url, options = {}) {
    const headers = options.headers || {};
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    const finalOptions = {
      ...options,
      headers,
    };

    const res = await fetch(url, finalOptions);

    if (res.status === 401) {
      logoutAdmin();
      throw new Error('Session expired. Please log in again.');
    }

    return res;
  }

  // Close modals listener
  document.querySelectorAll('.close-modal-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('active'));
    });
  });

  // 1. Authentication Handlers
  async function checkAuth() {
    if (!adminToken) {
      showLoginView();
      return;
    }

    try {
      const res = await authFetch('/api/admin/me');
      const data = await res.json();

      if (res.ok && data.success) {
        showDashboardView(data.admin.email);
        loadInitialDashboardData();
      } else {
        showLoginView();
      }
    } catch (err) {
      showLoginView();
    }
  }

  function showLoginView() {
    adminLoginSection.style.display = 'block';
    adminDashboardSection.style.display = 'none';
    adminEmailDisplay.style.display = 'none';
    adminLogoutBtn.style.display = 'none';

    // Clear credential fields so they are never pre-populated
    adminEmailInput.value = '';
    adminPasswordInput.value = '';
  }

  function showDashboardView(email) {
    adminLoginSection.style.display = 'none';
    adminDashboardSection.style.display = 'block';
    adminEmailDisplay.textContent = email;
    adminEmailDisplay.style.display = 'inline-block';
    adminLogoutBtn.style.display = 'inline-block';
  }

  async function loginAdmin(email, password) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      adminToken = data.token;
      sessionStorage.setItem('admin_token', adminToken);
      showDashboardView(data.admin.email);
      loadInitialDashboardData();
      showAlert('Logged in successfully', false);
    } catch (err) {
      showAlert(err.message);
    }
  }

  async function logoutAdmin() {
    try {
      if (adminToken) {
        await authFetch('/api/admin/logout', { method: 'POST' });
      }
    } catch (e) {
      // Ignore
    } finally {
      adminToken = null;
      sessionStorage.removeItem('admin_token');
      showLoginView();
    }
  }

  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = adminEmailInput.value.trim();
    const password = adminPasswordInput.value;
    if (email && password) {
      loginAdmin(email, password);
    }
  });

  adminLogoutBtn.addEventListener('click', logoutAdmin);

  // Automatic Logout when intentionally leaving Admin Portal to Student Portal
  leaveToStudentPortalLink.addEventListener('click', async (e) => {
    if (adminToken) {
      e.preventDefault();
      await logoutAdmin();
      window.location.href = 'index.html';
    }
  });

  // Browser lifecycle: terminate session on window close/navigation away
  window.addEventListener('pagehide', () => {
    if (adminToken && !isInternalAction) {
      // Send beacon to revoke server session on tab close
      navigator.sendBeacon('/api/admin/logout');
    }
  });

  // 2. Tab Navigation (Internal switching does not terminate session)
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      isInternalAction = true;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.getAttribute('data-tab'));
      if (targetPane) targetPane.classList.add('active');
      isInternalAction = false;
    });
  });

  // 3. Initial Dashboard Data Loading
  async function loadInitialDashboardData() {
    await loadSubjects();
    await loadQuestions();
    await loadResults();
    await loadStudents();
  }

  // ================= TAB 1: SUBJECTS =================
  async function loadSubjects(departmentFilter = '') {
    try {
      const url = departmentFilter
        ? `/api/subjects?department=${encodeURIComponent(departmentFilter)}`
        : '/api/subjects';

      const res = await authFetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);

      cachedSubjects = data.subjects || [];
      renderSubjectsTable(cachedSubjects);
      updateSubjectDropdowns();
    } catch (err) {
      showAlert(`Error loading subjects: ${err.message}`);
    }
  }

  function renderSubjectsTable(subjects) {
    subjectsTableBody.innerHTML = '';
    if (subjects.length === 0) {
      subjectsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No subjects found for the selected department.</td></tr>`;
      return;
    }

    subjects.forEach((subj) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${subj.code}</strong></td>
        <td>${subj.name}</td>
        <td><span class="badge badge-info">${subj.department}</span></td>
        <td>${subj.passingPercentage}%</td>
        <td>${subj.questionCount || 0}</td>
        <td>${subj.resultCount || 0}</td>
        <td>
          <button type="button" class="btn btn-secondary edit-subj-btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; margin-right: 0.35rem;" data-id="${subj._id}">
            ${t('edit')}
          </button>
          <button type="button" class="btn btn-danger delete-subj-btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" data-id="${subj._id}" data-name="${subj.name}">
            ${t('delete')}
          </button>
        </td>
      `;

      tr.querySelector('.edit-subj-btn').addEventListener('click', () => {
        openEditSubjectModal(subj);
      });

      tr.querySelector('.delete-subj-btn').addEventListener('click', () => {
        deleteSubject(subj._id, subj.name);
      });

      subjectsTableBody.appendChild(tr);
    });
  }

  // Department filter for subjects table
  filterSubjectDept.addEventListener('change', () => {
    loadSubjects(filterSubjectDept.value);
  });

  function updateSubjectDropdowns() {
    // Populate manual question subject selector
    if (manualQSubject) {
      manualQSubject.innerHTML = `<option value="">-- Select Subject --</option>`;
      cachedSubjects.forEach((s) => {
        manualQSubject.innerHTML += `<option value="${s._id}">${s.code} - ${s.name} (${s.department})</option>`;
      });
    }

    // Populate question tab filter
    updateQuestionSubjectFilter();

    // Populate results subject filter
    if (filterResultSubject) {
      filterResultSubject.innerHTML = `<option value="">${t('allSubjects')}</option>`;
      cachedSubjects.forEach((s) => {
        filterResultSubject.innerHTML += `<option value="${s._id}">${s.code} - ${s.name} (${s.department})</option>`;
      });
    }
  }

  openAddSubjectModalBtn.addEventListener('click', () => {
    editSubjectId.value = '';
    subjectModalTitle.textContent = t('addNewSubjectTitle');
    subDepartment.value = 'CS';
    subCode.value = '';
    subName.value = '';
    subPassingPercentage.value = '50';
    subjectModal.classList.add('active');
  });

  function openEditSubjectModal(subj) {
    editSubjectId.value = subj._id;
    subjectModalTitle.textContent = t('editSubjectTitle');
    subDepartment.value = subj.department;
    subCode.value = subj.code;
    subName.value = subj.name;
    subPassingPercentage.value = subj.passingPercentage;
    subjectModal.classList.add('active');
  }

  subjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editSubjectId.value;
    const payload = {
      department: subDepartment.value,
      code: subCode.value.trim().toUpperCase(),
      name: subName.value.trim(),
      passingPercentage: Number(subPassingPercentage.value),
    };

    try {
      const url = id ? `/api/subjects/${id}` : '/api/subjects';
      const method = id ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      subjectModal.classList.remove('active');
      showAlert(data.message, false);
      loadSubjects(filterSubjectDept.value);
    } catch (err) {
      showAlert(err.message);
    }
  });

  async function deleteSubject(id, name) {
    if (!confirm(`${t('deleteSubjectConfirm')} (${name})`)) return;

    try {
      const res = await authFetch(`/api/subjects/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message);
      }

      showAlert(data.message, false);
      loadSubjects(filterSubjectDept.value);
    } catch (err) {
      showAlert(err.message);
    }
  }

  // ================= TAB 2: QUESTIONS =================
  function updateQuestionSubjectFilter() {
    const selectedDept = questionDeptFilter ? questionDeptFilter.value : '';
    const filteredSubjects = selectedDept
      ? cachedSubjects.filter((s) => s.department === selectedDept)
      : cachedSubjects;

    questionSubjectFilter.innerHTML = `<option value="">${t('allSubjects')}</option>`;
    filteredSubjects.forEach((s) => {
      questionSubjectFilter.innerHTML += `<option value="${s._id}">${s.code} - ${s.name} (${s.department})</option>`;
    });
  }

  if (questionDeptFilter) {
    questionDeptFilter.addEventListener('change', () => {
      updateQuestionSubjectFilter();
      loadQuestions();
    });
  }

  async function loadQuestions() {
    const dept = questionDeptFilter ? questionDeptFilter.value : '';
    const subjectId = questionSubjectFilter ? questionSubjectFilter.value : '';

    const queryParams = new URLSearchParams();
    if (subjectId) {
      queryParams.set('subjectId', subjectId);
    } else if (dept) {
      queryParams.set('department', dept);
    }

    try {
      const url = `/api/questions?${queryParams.toString()}`;
      const res = await authFetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);
      renderQuestionsTable(data.questions || []);
    } catch (err) {
      showAlert(`Error loading questions: ${err.message}`);
    }
  }

  function renderQuestionsTable(questions) {
    questionsTableBody.innerHTML = '';
    if (questions.length === 0) {
      questionsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No questions found for the selected department/subject.</td></tr>`;
      return;
    }

    const lang = getLang();

    questions.forEach((q) => {
      const tr = document.createElement('tr');
      const subjText = q.subject ? `${q.subject.code} (${q.subject.name})` : '-';
      const localizedQText = getLocalizedText(q.text, lang);
      const localizedOptions = getLocalizedOptions(q.options, lang);
      const correctOptText = localizedOptions[q.correctIndex] ? `${localizedOptions[q.correctIndex]} (${q.correctIndex})` : `Index ${q.correctIndex}`;

      tr.innerHTML = `
        <td><strong>${localizedQText}</strong></td>
        <td>${subjText}</td>
        <td><span class="badge badge-success">${correctOptText}</span></td>
        <td>
          <button type="button" class="btn btn-danger delete-q-btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" data-id="${q._id}">
            ${t('delete')}
          </button>
        </td>
      `;

      tr.querySelector('.delete-q-btn').addEventListener('click', () => {
        deleteQuestion(q._id);
      });

      questionsTableBody.appendChild(tr);
    });
  }

  questionSubjectFilter.addEventListener('change', loadQuestions);

  // Manual Question Creation (Bilingual)
  openAddQuestionModalBtn.addEventListener('click', () => {
    manualQuestionForm.reset();
    if (questionSubjectFilter.value) {
      manualQSubject.value = questionSubjectFilter.value;
    }
    questionModal.classList.add('active');
  });

  manualQuestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      subjectId: manualQSubject.value,
      text_ar: document.getElementById('manualQTextAr').value.trim(),
      text_en: document.getElementById('manualQTextEn').value.trim(),
      options_ar: [
        document.getElementById('manualOptAr0').value.trim(),
        document.getElementById('manualOptAr1').value.trim(),
        document.getElementById('manualOptAr2').value.trim(),
        document.getElementById('manualOptAr3').value.trim(),
      ],
      options_en: [
        document.getElementById('manualOptEn0').value.trim(),
        document.getElementById('manualOptEn1').value.trim(),
        document.getElementById('manualOptEn2').value.trim(),
        document.getElementById('manualOptEn3').value.trim(),
      ],
      correctIndex: Number(document.getElementById('manualQCorrectIndex').value),
    };

    try {
      const res = await authFetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      questionModal.classList.remove('active');
      showAlert(data.message, false);
      loadQuestions();
      loadSubjects(filterSubjectDept.value);
    } catch (err) {
      showAlert(err.message);
    }
  });

  async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const res = await authFetch(`/api/questions/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);
      showAlert(data.message, false);
      loadQuestions();
      loadSubjects(filterSubjectDept.value);
    } catch (err) {
      showAlert(err.message);
    }
  }

  // Bulk JSON Import with Department Filter
  openImportJsonModalBtn.addEventListener('click', () => {
    importJsonForm.reset();
    importReportBox.style.display = 'none';
    importDeptSelect.value = '';
    importSubjectSelect.innerHTML = `<option value="">-- اختر المادة --</option>`;
    importJsonModal.classList.add('active');
  });

  importDeptSelect.addEventListener('change', () => {
    const dept = importDeptSelect.value;
    const filtered = dept ? cachedSubjects.filter((s) => s.department === dept) : cachedSubjects;
    importSubjectSelect.innerHTML = `<option value="">-- اختر المادة --</option>`;
    filtered.forEach((s) => {
      importSubjectSelect.innerHTML += `<option value="${s._id}">${s.code} - ${s.name}</option>`;
    });
  });

  importJsonForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subjectId = importSubjectSelect.value;
    if (!subjectId) {
      alert('Please select a subject for the imported questions.');
      return;
    }

    const file = jsonFileInput.files[0];
    const rawText = jsonTextArea.value.trim();

    if (!file && !rawText) {
      alert('Please either choose a JSON file or paste JSON content.');
      return;
    }

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('subjectId', subjectId);
        formData.append('file', file);

        res = await authFetch('/api/questions/import', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await authFetch('/api/questions/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId,
            jsonData: rawText,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const rep = data.report || {};
      repTotal.textContent = rep.totalReceived || 0;
      repSuccess.textContent = rep.importedCount || 0;
      repFailed.textContent = rep.failedCount || 0;

      if (rep.failedRecords && rep.failedRecords.length > 0) {
        repFailedDetails.style.display = 'block';
        repFailedDetails.innerHTML = '';
        rep.failedRecords.forEach((f) => {
          repFailedDetails.innerHTML += `<div class="report-failed-item">Item #${f.index}: ${f.error}</div>`;
        });
      } else {
        repFailedDetails.style.display = 'none';
      }

      importReportBox.style.display = 'block';
      loadQuestions();
      loadSubjects(filterSubjectDept.value);
    } catch (err) {
      alert(`Import Error: ${err.message}`);
    }
  });

  // ================= TAB 3: RESULTS & ANALYTICS =================
  async function loadResults() {
    const dept = filterResultDept.value;
    const subj = filterResultSubject.value;
    const status = filterResultStatus.value;
    const search = filterResultSearch.value.trim();

    const queryParams = new URLSearchParams();
    if (dept) queryParams.set('department', dept);
    if (subj) queryParams.set('subjectId', subj);
    if (status) queryParams.set('status', status);
    if (search) queryParams.set('search', search);

    try {
      const res = await authFetch(`/api/admin/results?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);

      const stats = data.stats || {};
      statTotalExamsVal.textContent = stats.totalExams || 0;
      statPassedExamsVal.textContent = stats.passedCount || 0;
      statFailedExamsVal.textContent = stats.failedCount || 0;
      statPassRateVal.textContent = `${stats.passRate || 0}%`;

      renderResultsTable(data.results || []);
    } catch (err) {
      showAlert(`Error loading results: ${err.message}`);
    }
  }

  function renderResultsTable(results) {
    resultsTableBody.innerHTML = '';
    if (results.length === 0) {
      resultsTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">No examination results match the selected filters.</td></tr>`;
      return;
    }

    results.forEach((r) => {
      const tr = document.createElement('tr');
      const isPass = r.status === 'Pass';
      const statusBadge = isPass ? '<span class="badge badge-success">Pass</span>' : '<span class="badge badge-danger">Fail</span>';
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString() : '-';

      tr.innerHTML = `
        <td><strong>${r.studentId}</strong></td>
        <td>${r.studentName}</td>
        <td><span class="badge badge-info">${r.department}</span></td>
        <td>${r.subjectCode} - ${r.subjectName}</td>
        <td><strong>${r.score}</strong> / ${r.total}</td>
        <td>${r.percentage}%</td>
        <td>${statusBadge}</td>
        <td><span style="font-size: 0.8rem; color: var(--text-muted);">${r.submissionType || 'Manual'}</span></td>
        <td style="font-size: 0.8rem;">${dateStr}</td>
        <td>
          <a href="result.html?resultId=${r._id}&studentId=${encodeURIComponent(r.studentId)}" target="_blank" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
            عرض النتيجة
          </a>
        </td>
      `;

      resultsTableBody.appendChild(tr);
    });
  }

  filterResultDept.addEventListener('change', () => {
    // Dynamically filter subjects in Results tab
    const dept = filterResultDept.value;
    const filtered = dept ? cachedSubjects.filter((s) => s.department === dept) : cachedSubjects;
    filterResultSubject.innerHTML = `<option value="">${t('allSubjects')}</option>`;
    filtered.forEach((s) => {
      filterResultSubject.innerHTML += `<option value="${s._id}">${s.code} - ${s.name} (${s.department})</option>`;
    });
    loadResults();
  });

  filterResultSubject.addEventListener('change', loadResults);
  filterResultStatus.addEventListener('change', loadResults);

  let searchTimeout = null;
  filterResultSearch.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadResults, 300);
  });

  resetFiltersBtn.addEventListener('click', () => {
    filterResultDept.value = '';
    filterResultSubject.value = '';
    filterResultStatus.value = '';
    filterResultSearch.value = '';
    loadResults();
  });

  // ================= TAB 4: STUDENTS =================
  async function loadStudents() {
    try {
      const res = await authFetch('/api/students');
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);
      renderStudentsTable(data.students || []);
    } catch (err) {
      showAlert(`Error loading students: ${err.message}`);
    }
  }

  function renderStudentsTable(students) {
    studentsTableBody.innerHTML = '';
    if (students.length === 0) {
      studentsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No student records found. Click "Add Student Record" to add one.</td></tr>`;
      return;
    }

    students.forEach((s) => {
      const tr = document.createElement('tr');
      const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-';

      tr.innerHTML = `
        <td><strong>${s.studentId}</strong></td>
        <td>${s.fullName}</td>
        <td><span class="badge badge-info">${s.department}</span></td>
        <td style="font-size: 0.85rem;">${dateStr}</td>
      `;

      studentsTableBody.appendChild(tr);
    });
  }

  openAddStudentModalBtn.addEventListener('click', () => {
    addStudentForm.reset();
    studentModal.classList.add('active');
  });

  addStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      studentId: document.getElementById('newStudentId').value.trim().toUpperCase(),
      fullName: document.getElementById('newStudentFullName').value.trim(),
      department: document.getElementById('newStudentDept').value,
    };

    try {
      const res = await authFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      studentModal.classList.remove('active');
      showAlert(data.message, false);
      loadStudents();
    } catch (err) {
      showAlert(err.message);
    }
  });

  // Re-render questions table if language switched while on questions tab
  window.addEventListener('app_language_changed', () => {
    loadQuestions();
  });

  // Start initialization
  checkAuth();
});
