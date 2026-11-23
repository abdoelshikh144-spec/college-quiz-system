// Internationalization (i18n) Module
// Bilingual support: Arabic (AR) and English (EN)
// No emojis used anywhere in texts or labels

const translations = {
  ar: {
    // General
    systemTitle: 'منظومة الامتحانات الجامعية الإلكترونية',
    collegeName: 'كلية الحاسبات والمعلومات وإدارة الأعمال',
    languageName: 'English',
    switchLang: 'English',
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    confirm: 'تأكيد',
    close: 'إغلاق',
    actions: 'الإجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    backToHome: 'العودة للصفحة الرئيسية',
    adminPortal: 'بوابة الإدارة',
    studentPortal: 'بوابة الطلاب',

    // Student Registration (index.html)
    registrationTitle: 'تسجيل دخول الامتحان الجامعي',
    registrationSubtitle: 'يرجى إدخال كود الطالب واختيار القسم والمادة للبدء في الاختبار الأكاديمي',
    studentIdLabel: 'كود الطالب (Student ID)',
    studentIdPlaceholder: 'أدخل كود الطالب مثلا: ST2024001',
    verifyIdBtn: 'تحقق من الكود',
    verifyingStudent: 'جاري التحقق من كود الطالب...',
    studentNameLabel: 'اسم الطالب المعتمد',
    registeredDeptLabel: 'القسم المقيد به',
    selectDepartment: 'اختر القسم الدراسي',
    selectDepartmentOption: '-- اختر القسم --',
    departmentBannerTitle: 'الأقسام الأكاديمية',
    deptCS: 'علوم الحاسب (Computer Science - CS)',
    deptIS: 'نظم المعلومات (Information Systems - IS)',
    deptManagement: 'إدارة الأعمال (Management)',
    selectSubject: 'اختر المادة الدراسية',
    selectSubjectOption: '-- اختر المادة --',
    noSubjectsAvailable: 'لا توجد مواد مسجلة لهذا القسم حاليا',
    startExamBtn: 'بدء الامتحان',
    idRequired: 'يرجى إدخال كود الطالب أولا',
    idNotFound: 'كود الطالب غير موجود في سجلات الكلية. يرجى مراجعة إدارة شؤون الطلاب.',
    selectDeptFirst: 'يرجى اختيار القسم الدراسي لعرض المواد',
    selectSubjectRequired: 'يرجى اختيار المادة المراد أداء امتحانها',
    examRulesNotice: 'تنبيه أكاديمي: مدة الامتحان 15 دقيقة بالضبط. سيتم عرض جميع الأسئلة الصالحة المتاحة للمادة بترتيب عشوائي. المحاولة مسموحة مرة واحدة فقط لكل مادة.',
    restrictedDeptNotice: 'تم تثبيت القسم بناء على بيانات الطالب المعتمدة في سجلات الكلية',

    // Examination (exam.html)
    examTitle: 'جلسة الامتحان الأكاديمي',
    studentInfo: 'بيانات الطالب',
    subjectInfo: 'المادة',
    departmentInfo: 'القسم',
    timeRemaining: 'الوقت المتبقي',
    questionCount: 'السؤال',
    ofTotal: 'من إجمالي',
    prevQuestion: 'السابق',
    nextQuestion: 'التالي',
    submitExamBtn: 'تسليم الامتحان',
    questionPalette: 'قائمة الأسئلة',
    answered: 'تمت الإجابة',
    unanswered: 'لم يتم الإجابة',
    confirmSubmitTitle: 'تأكيد تسليم الامتحان',
    confirmSubmitMsg: 'هل أنت متأكد من رغبتك في إنهاء الامتحان وتسليم الإجابات؟ لن يمكنك الرجوع إلى الأسئلة مرة أخرى.',
    confirmSubmitYes: 'نعم، تسليم نهائي',
    confirmSubmitNo: 'متابعة الامتحان',
    timeExpiredTitle: 'انتهى الوقت المحدد',
    timeExpiredMsg: 'انتهت مدة الامتحان (15 دقيقة). جاري تسليم الإجابات المختارة تلقائيا واحتساب النتيجة...',
    leaveWarning: 'تنبيه: الامتحان قيد التشغيل. إذا غادرت الصفحة لن يتوقف العداد الزمني.',

    // Result (result.html)
    resultTitle: 'نتيجة التقييم الأكاديمي',
    resultSubtitle: 'تفاصيل النتيجة والمراجعة الشاملة للأسئلة والإجابات',
    finalScore: 'الدرجة النهائية',
    percentage: 'النسبة المئوية',
    requiredPassRate: 'نسبة النجاح المطلوبة',
    evaluationStatus: 'حالة النتيجة',
    passStatus: 'ناجح (Pass)',
    failStatus: 'راسب (Fail)',
    submissionMethod: 'طريقة التسليم',
    manualSubmission: 'تسليم يدوي بواسطة الطالب',
    autoExpiredSubmission: 'تسليم تلقائي لانتهاء الوقت',
    reviewAnswersTitle: 'مراجعة الإجابات التفصيلية',
    yourAnswer: 'إجابتك المختارة:',
    correctAnswer: 'الإجابة الصحيحة المعتمدة:',
    unansweredQuestion: 'لم تقم باختيار إجابة لهذا السؤال',
    answerCorrectBadge: 'إجابة صحيحة',
    answerWrongBadge: 'إجابة خاطئة',
    totalQuestionsCount: 'إجمالي الأسئلة',
    correctCountLabel: 'إجابات صحيحة',
    incorrectCountLabel: 'إجابات خاطئة',
    unansweredCountLabel: 'غير مجاب',

    // Admin (admin.html)
    adminLoginTitle: 'تسجيل دخول المشرف الأكاديمي',
    adminLoginSubtitle: 'لوحة إدارة وتكوين منظومة الامتحانات',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'admin@college.edu',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    loginBtn: 'تسجيل الدخول',
    logoutBtn: 'تسجيل الخروج',
    navSubjects: 'إدارة المواد',
    navQuestions: 'بنك الأسئلة',
    navResults: 'نتائج الامتحانات',
    navStudents: 'سجل الطلاب',

    // Admin Subjects Tab
    subjectsTitle: 'إدارة المواد الدراسية',
    addSubjectBtn: 'إضافة مادة جديدة',
    filterAllDepartments: 'جميع الأقسام',
    subjectCodeCol: 'كود المادة',
    subjectNameCol: 'اسم المادة',
    departmentCol: 'القسم',
    passingRateCol: 'نسبة النجاح (%)',
    questionsCountCol: 'عدد الأسئلة',
    resultsCountCol: 'عدد الامتحانات',
    addNewSubjectTitle: 'إضافة مادة أكاديمية جديدة',
    editSubjectTitle: 'تعديل بيانات المادة',
    subjectCodeLabel: 'كود المادة (مثل: CS101)',
    subjectNameLabel: 'اسم المادة الكامل',
    passingPercentageLabel: 'نسبة النجاح المطلوبة (1 - 100%)',
    saveSubjectBtn: 'حفظ المادة',
    deleteSubjectConfirm: 'هل أنت متأكد من حذف هذه المادة؟',

    // Admin Questions Tab
    questionsTitle: 'إدارة بنك الأسئلة',
    filterBySubject: 'المادة:',
    filterByDept: 'القسم:',
    allSubjects: 'جميع المواد',
    addQuestionManualBtn: 'إضافة سؤال يدويا',
    importJsonBtn: 'استيراد أسئلة (JSON)',
    questionTextLabel: 'نص السؤال',
    questionTextArLabel: 'نص السؤال بالعربية',
    questionTextEnLabel: 'نص السؤال بالإنجليزية',
    optionsLabel: 'خيارات الإجابة الأربعة',
    optionsArLabel: 'الخيارات الأربعة بالعربية',
    optionsEnLabel: 'الخيارات الأربعة بالإنجليزية',
    option1Label: 'الخيار الأول (مؤشر 0)',
    option2Label: 'الخيار الثاني (مؤشر 1)',
    option3Label: 'الخيار الثالث (مؤشر 2)',
    option4Label: 'الخيار الرابع (مؤشر 3)',
    correctOptionLabel: 'تحديد الإجابة الصحيحة',
    saveQuestionBtn: 'حفظ السؤال',
    importJsonTitle: 'استيراد الأسئلة مجمعة عبر ملف JSON',
    selectSubjectForImport: 'اختر المادة المراد استيراد الأسئلة إليها:',
    jsonUploadFileLabel: 'اختيار ملف JSON من الجهاز:',
    jsonPasteLabel: 'أو لصق محتوى JSON مباشرة:',
    executeImportBtn: 'بدء الاستيراد',
    importReportTitle: 'تقرير استيراد الأسئلة',
    totalProcessed: 'إجمالي السجلات:',
    totalSuccess: 'تم بنجاح:',
    totalFailed: 'السجلات غير المقبولة:',
    bilingualNote: 'يدعم النظام بنية الأسئلة ثنائية اللغة (Version 2) مع الحفاظ على التوافق مع (Version 1).',

    // Admin Results Tab
    resultsTitle: 'سجل نتائج امتحانات الطلاب',
    statTotalExams: 'إجمالي الامتحانات',
    statPassedExams: 'الطلاب الناجحون',
    statFailedExams: 'الطلاب الراسبون',
    statPassRate: 'نسبة النجاح الإجمالية',
    filterDeptLabel: 'القسم:',
    filterSubjectLabel: 'المادة:',
    filterStatusLabel: 'النتيجة:',
    allStatuses: 'الكل',
    passOnly: 'ناجح فقط',
    failOnly: 'راسب فقط',
    searchStudentPlaceholder: 'بحث بكود الطالب، الاسم، أو المادة...',
    resetFiltersBtn: 'إعادة ضبط الفلاتر',
    colStudentId: 'كود الطالب',
    colStudentName: 'اسم الطالب',
    colScore: 'الدرجة الفعلية',
    colPercentage: 'النسبة',
    colStatus: 'الحالة',
    colType: 'نوع التسليم',

    // Admin Students Tab
    studentsTitle: 'سجل طلاب الكلية المعتمدين',
    addStudentBtn: 'إضافة طالب معتمد',
    studentFullNameLabel: 'الاسم الكامل للطالب',
    saveStudentBtn: 'تسجيل الطالب',
  },

  en: {
    // General
    systemTitle: 'College Online Examination System',
    collegeName: 'Faculty of Computer Science and Management Systems',
    languageName: 'العربية',
    switchLang: 'العربية',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    close: 'Close',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    backToHome: 'Back to Home',
    adminPortal: 'Admin Portal',
    studentPortal: 'Student Portal',

    // Student Registration (index.html)
    registrationTitle: 'College Exam Registration',
    registrationSubtitle: 'Please enter your Student ID, select department and subject to begin the academic examination',
    studentIdLabel: 'Student ID',
    studentIdPlaceholder: 'Enter Student ID e.g. ST2024001',
    verifyIdBtn: 'Verify ID',
    verifyingStudent: 'Verifying student ID...',
    studentNameLabel: 'Verified Student Name',
    registeredDeptLabel: 'Registered Department',
    selectDepartment: 'Select Academic Department',
    selectDepartmentOption: '-- Select Department --',
    departmentBannerTitle: 'Academic Departments',
    deptCS: 'Computer Science (CS)',
    deptIS: 'Information Systems (IS)',
    deptManagement: 'Management',
    selectSubject: 'Select Subject',
    selectSubjectOption: '-- Select Subject --',
    noSubjectsAvailable: 'No subjects currently registered for this department',
    startExamBtn: 'Start Examination',
    idRequired: 'Please enter your Student ID first',
    idNotFound: 'Student ID was not found in college records. Please verify with student affairs.',
    selectDeptFirst: 'Please select a department to load its subjects',
    selectSubjectRequired: 'Please select a subject to take the examination',
    examRulesNotice: 'Academic Notice: Exam duration is exactly 15 minutes. All valid available questions for the subject will be displayed in randomized order. Only one attempt is permitted per subject.',
    restrictedDeptNotice: 'Department locked according to verified student records',

    // Examination (exam.html)
    examTitle: 'Academic Examination Session',
    studentInfo: 'Student Information',
    subjectInfo: 'Subject',
    departmentInfo: 'Department',
    timeRemaining: 'Time Remaining',
    questionCount: 'Question',
    ofTotal: 'of total',
    prevQuestion: 'Previous',
    nextQuestion: 'Next',
    submitExamBtn: 'Submit Examination',
    questionPalette: 'Questions Palette',
    answered: 'Answered',
    unanswered: 'Unanswered',
    confirmSubmitTitle: 'Confirm Exam Submission',
    confirmSubmitMsg: 'Are you sure you want to finish and submit your examination? You will not be able to change your answers.',
    confirmSubmitYes: 'Yes, Submit Final Exam',
    confirmSubmitNo: 'Continue Exam',
    timeExpiredTitle: 'Time Expired',
    timeExpiredMsg: 'The 15-minute examination time has expired. Submitting your selected answers automatically...',
    leaveWarning: 'Warning: Examination is in progress. Leaving this page will not pause the timer.',

    // Result (result.html)
    resultTitle: 'Academic Evaluation Result',
    resultSubtitle: 'Examination performance summary and comprehensive question review',
    finalScore: 'Final Score',
    percentage: 'Percentage',
    requiredPassRate: 'Required Passing Rate',
    evaluationStatus: 'Evaluation Status',
    passStatus: 'Pass',
    failStatus: 'Fail',
    submissionMethod: 'Submission Method',
    manualSubmission: 'Manual Submission by Student',
    autoExpiredSubmission: 'Automatic Submission (Time Expired)',
    reviewAnswersTitle: 'Detailed Answers Review',
    yourAnswer: 'Your Selected Answer:',
    correctAnswer: 'Official Correct Answer:',
    unansweredQuestion: 'No answer was selected for this question',
    answerCorrectBadge: 'Correct Answer',
    answerWrongBadge: 'Incorrect Answer',
    totalQuestionsCount: 'Total Questions',
    correctCountLabel: 'Correct Answers',
    incorrectCountLabel: 'Incorrect Answers',
    unansweredCountLabel: 'Unanswered',

    // Admin (admin.html)
    adminLoginTitle: 'Academic Administrator Login',
    adminLoginSubtitle: 'Examination System Management and Configuration Dashboard',
    emailLabel: 'Email Address',
    emailPlaceholder: 'admin@college.edu',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    loginBtn: 'Log In',
    logoutBtn: 'Log Out',
    navSubjects: 'Subjects Management',
    navQuestions: 'Questions Bank',
    navResults: 'Exam Results',
    navStudents: 'Students Directory',

    // Admin Subjects Tab
    subjectsTitle: 'Subjects Management',
    addSubjectBtn: 'Add New Subject',
    filterAllDepartments: 'All Departments',
    subjectCodeCol: 'Subject Code',
    subjectNameCol: 'Subject Name',
    departmentCol: 'Department',
    passingRateCol: 'Passing Rate (%)',
    questionsCountCol: 'Questions Count',
    resultsCountCol: 'Exams Taken',
    addNewSubjectTitle: 'Add New Academic Subject',
    editSubjectTitle: 'Edit Subject Information',
    subjectCodeLabel: 'Subject Code (e.g. CS101)',
    subjectNameLabel: 'Full Subject Name',
    passingPercentageLabel: 'Required Passing Percentage (1 - 100%)',
    saveSubjectBtn: 'Save Subject',
    deleteSubjectConfirm: 'Are you sure you want to delete this subject?',

    // Admin Questions Tab
    questionsTitle: 'Question Bank Management',
    filterBySubject: 'Subject:',
    filterByDept: 'Department:',
    allSubjects: 'All Subjects',
    addQuestionManualBtn: 'Add Question Manually',
    importJsonBtn: 'Bulk Import (JSON)',
    questionTextLabel: 'Question Text',
    questionTextArLabel: 'Question Text (Arabic)',
    questionTextEnLabel: 'Question Text (English)',
    optionsLabel: 'Four Answer Options',
    optionsArLabel: 'Four Options (Arabic)',
    optionsEnLabel: 'Four Options (English)',
    option1Label: 'Option 1 (Index 0)',
    option2Label: 'Option 2 (Index 1)',
    option3Label: 'Option 3 (Index 2)',
    option4Label: 'Option 4 (Index 3)',
    correctOptionLabel: 'Correct Option Selection',
    saveQuestionBtn: 'Save Question',
    importJsonTitle: 'Bulk Questions Import via JSON File',
    selectSubjectForImport: 'Select Target Subject for Imported Questions:',
    jsonUploadFileLabel: 'Choose JSON file from computer:',
    jsonPasteLabel: 'Or paste JSON content directly:',
    executeImportBtn: 'Start Import',
    importReportTitle: 'Questions Import Report',
    totalProcessed: 'Total Processed:',
    totalSuccess: 'Imported Successfully:',
    totalFailed: 'Failed Entries:',
    bilingualNote: 'System supports Version 2 bilingual questions with full backward compatibility for Version 1.',

    // Admin Results Tab
    resultsTitle: 'Student Examination Records',
    statTotalExams: 'Total Exams',
    statPassedExams: 'Passed Students',
    statFailedExams: 'Failed Students',
    statPassRate: 'Overall Pass Rate',
    filterDeptLabel: 'Department:',
    filterSubjectLabel: 'Subject:',
    filterStatusLabel: 'Status:',
    allStatuses: 'All',
    passOnly: 'Pass Only',
    failOnly: 'Fail Only',
    searchStudentPlaceholder: 'Search by Student ID, Name, or Subject...',
    resetFiltersBtn: 'Reset Filters',
    colStudentId: 'Student ID',
    colStudentName: 'Student Name',
    colScore: 'Actual Score',
    colPercentage: 'Percentage',
    colStatus: 'Status',
    colType: 'Submission Type',

    // Admin Students Tab
    studentsTitle: 'Registered College Students',
    addStudentBtn: 'Add Student Record',
    studentFullNameLabel: 'Full Student Name',
    saveStudentBtn: 'Save Student',
  },
};

// State manager for current language
let currentLang = localStorage.getItem('app_lang') || 'ar';

function getLang() {
  return currentLang;
}

function t(key) {
  if (translations[currentLang] && translations[currentLang][key]) {
    return translations[currentLang][key];
  }
  if (translations.en && translations.en[key]) {
    return translations.en[key];
  }
  return key;
}

// Helper: Localize text object or fallback to string
function getLocalizedText(obj, lang = currentLang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    return obj[lang] || obj.en || obj.ar || '';
  }
  return String(obj);
}

// Helper: Localize 4 options array or fallback
function getLocalizedOptions(opts, lang = currentLang) {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts;
  if (typeof opts === 'object') {
    return opts[lang] || opts.en || opts.ar || [];
  }
  return [];
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('app_lang', lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Translate all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Update language toggle button
  document.querySelectorAll('.lang-toggle-btn').forEach((btn) => {
    btn.textContent = t('languageName');
  });

  // Notify active scripts (exam.js, result.js, etc.) that language has switched
  window.dispatchEvent(new CustomEvent('app_language_changed', { detail: { lang } }));
}

function toggleLanguage() {
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  applyLanguage(newLang);
}

// Auto-initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  document.querySelectorAll('.lang-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', toggleLanguage);
  });
});
