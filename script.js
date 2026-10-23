/**
 * ==========================================================================
 * Student Data Viewer - Core Application Logic
 * ==========================================================================
 * Technologies: Vanilla JavaScript (ES6+), Fetch API, DOM Manipulation
 * Purpose: Placement Portfolio Project demonstrating asynchronous JS,
 *          array transformations (filter, sort, reduce), and responsive UI.
 * ==========================================================================
 */

// Strict mode enforces cleaner coding standards and prevents accidental globals
'use strict';

/**
 * --------------------------------------------------------------------------
 * 1. Global Application State
 * --------------------------------------------------------------------------
 * Storing data in a centralized state object makes it easy to maintain, debug,
 * and track changes during interview explanations.
 */
const appState = {
  allStudents: [],          // Original, unaltered dataset fetched from students.json
  filteredStudents: [],     // Current subset of students after filtering and sorting
  searchQuery: '',          // Current user search string (searches name and ID)
  selectedDepartment: 'all',// Selected department filter ('all' or specific name)
  sortField: 'default',     // Current sort criterion ('name', 'grade', 'id', 'default')
  sortOrder: 'asc'          // Sort direction: 'asc' (ascending) or 'desc' (descending)
};

/**
 * --------------------------------------------------------------------------
 * 2. DOM Element Selectors Cache
 * --------------------------------------------------------------------------
 * Caching DOM nodes prevents repeated, expensive DOM tree lookups.
 */
const DOM = {
  // Stats Elements
  statTotalStudents: document.getElementById('statTotalStudents'),
  statDepartments: document.getElementById('statDepartments'),
  statAverageGrade: document.getElementById('statAverageGrade'),
  statTopStudent: document.getElementById('statTopStudent'),

  // Controls Elements
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  departmentFilter: document.getElementById('departmentFilter'),
  sortSelect: document.getElementById('sortSelect'),
  resetBtn: document.getElementById('resetBtn'),
  recordCount: document.getElementById('recordCount'),
  activeFilterPill: document.getElementById('activeFilterPill'),

  // State Containers
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  errorMessageTitle: document.getElementById('errorMessageTitle'),
  errorMessageDetail: document.getElementById('errorMessageDetail'),
  retryBtn: document.getElementById('retryBtn'),
  emptyState: document.getElementById('emptyState'),
  emptyResetBtn: document.getElementById('emptyResetBtn'),

  // Table Elements
  tableWrapper: document.getElementById('tableWrapper'),
  studentTableBody: document.getElementById('studentTableBody'),
  sortableHeaders: document.querySelectorAll('.th-sortable')
};

/**
 * --------------------------------------------------------------------------
 * 3. Data Fetching via Fetch API (Async / Await)
 * --------------------------------------------------------------------------
 * Loads student records asynchronously from the local `students.json` file.
 * Handles HTTP errors, network timeouts, invalid JSON, and CORS restrictions.
 */
async function fetchStudentsData() {
  showLoading();

  // If opened directly from desktop/file system, browsers block fetch() due to CORS
  if (window.location.protocol === 'file:') {
    showError(
      'Browser Security Restriction (CORS): The browser blocks Fetch API requests when opened directly via file:///. ' +
      'Please run the project using a local HTTP server (run start-server.bat or python -m http.server 8000).'
    );
    return;
  }

  try {
    // Relative path to the JSON file
    const response = await fetch('students.json', { cache: 'no-cache' });

    // Step 1: Check HTTP response status before parsing
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('HTTP 404: students.json file was not found in the project directory.');
      } else {
        throw new Error(`HTTP Error ${response.status}: Failed to retrieve students.json (${response.statusText || 'Server Error'})`);
      }
    }

    // Step 2: Parse JSON with explicit syntax error handling
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Invalid JSON Syntax: Unable to parse students.json. Please ensure the file contains valid JSON formatting.');
    }

    // Step 3: Validate data format (must be a non-empty array)
    if (!Array.isArray(data)) {
      throw new Error('Unexpected Data Format: Expected a JSON array of student records, but received ' + typeof data + '.');
    }

    if (data.length === 0) {
      throw new Error('Dataset Empty: The students.json file contains zero records.');
    }

    // Step 4: Validate required properties across records
    const hasValidFields = data.every(student => 
      student && 
      typeof student === 'object' && 
      'id' in student && 
      'name' in student && 
      'department' in student && 
      'grade' in student
    );

    if (!hasValidFields) {
      throw new Error('Unexpected Data Format: One or more records in students.json are missing required fields (id, name, department, grade).');
    }

    // Save fetched data to state
    appState.allStudents = data;
    appState.filteredStudents = [...data];

    // Initialize UI components with loaded data
    populateDepartmentDropdown(data);
    updateSummaryStats(data);
    applyFiltersAndSort();

  } catch (error) {
    console.error('Error fetching student data:', error);
    showError(error.message || 'An unexpected network error occurred while fetching student records.');
  }
}

/**
 * --------------------------------------------------------------------------
 * 4. UI State Management (Loading, Error, Empty, Data)
 * --------------------------------------------------------------------------
 */
function showLoading() {
  DOM.loadingState.classList.remove('hidden');
  DOM.errorState.classList.add('hidden');
  DOM.emptyState.classList.add('hidden');
  DOM.tableWrapper.classList.add('hidden');
}

function showError(errorMessage) {
  DOM.loadingState.classList.add('hidden');
  DOM.emptyState.classList.add('hidden');
  DOM.tableWrapper.classList.add('hidden');
  DOM.errorState.classList.remove('hidden');

  DOM.errorMessageDetail.textContent = errorMessage || 'Unable to load dataset. Please ensure the server is active.';
}

function showEmptyState() {
  DOM.loadingState.classList.add('hidden');
  DOM.errorState.classList.add('hidden');
  DOM.tableWrapper.classList.add('hidden');
  DOM.emptyState.classList.remove('hidden');

  DOM.recordCount.textContent = `Showing 0 of ${appState.allStudents.length} records`;
  DOM.activeFilterPill.classList.remove('hidden');
}

function showTable() {
  DOM.loadingState.classList.add('hidden');
  DOM.errorState.classList.add('hidden');
  DOM.emptyState.classList.add('hidden');
  DOM.tableWrapper.classList.remove('hidden');
}

/**
 * --------------------------------------------------------------------------
 * 5. Dynamic Department Options Population
 * --------------------------------------------------------------------------
 * Uses ES6 Set to automatically extract unique department names from data.
 * This keeps the dropdown synchronized with any changes to students.json.
 */
function populateDepartmentDropdown(students) {
  // Extract all department strings and use Set to eliminate duplicates
  const departments = [...new Set(students.map(s => s.department))].sort();

  // Reset to default "All Departments" option
  DOM.departmentFilter.innerHTML = '<option value="all">All Departments</option>';

  // Append an option element for each unique department
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    DOM.departmentFilter.appendChild(option);
  });
}

/**
 * --------------------------------------------------------------------------
 * 6. Filtering and Sorting Pipeline
 * --------------------------------------------------------------------------
 * Centralized function that executes whenever search, filter, or sort changes.
 */
function applyFiltersAndSort() {
  const query = appState.searchQuery.trim().toLowerCase();
  const selectedDept = appState.selectedDepartment;

  // Step 1: Filter students based on search term AND department
  let results = appState.allStudents.filter(student => {
    // Search query matches student name OR student ID (case-insensitive)
    const matchesSearch = !query || 
      student.name.toLowerCase().includes(query) || 
      student.id.toLowerCase().includes(query);

    // Department match
    const matchesDept = (selectedDept === 'all') || (student.department === selectedDept);

    return matchesSearch && matchesDept;
  });

  // Step 2: Sort the filtered results
  if (appState.sortField !== 'default') {
    results.sort((a, b) => {
      let comparison = 0;

      if (appState.sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (appState.sortField === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (appState.sortField === 'grade') {
        comparison = a.grade - b.grade;
      }

      // Invert comparison if descending order
      return appState.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  // Update filtered list in state
  appState.filteredStudents = results;

  // Step 3: Render results or show empty state
  if (results.length === 0) {
    showEmptyState();
  } else {
    showTable();
    renderTableRows(results);
    updateStatusBar();
  }

  // Synchronize column header sort icons
  updateTableSortHeaders();
}

/**
 * --------------------------------------------------------------------------
 * 7. Table Rendering with Safe DOM Injection
 * --------------------------------------------------------------------------
 */
function renderTableRows(students) {
  // Clear existing rows
  DOM.studentTableBody.innerHTML = '';

  const fragment = document.createDocumentFragment();

  students.forEach(student => {
    const row = document.createElement('tr');

    const gradeBadge = getPerformanceBadge(student.grade);
    const deptClass = getDepartmentBadgeClass(student.department);

    row.innerHTML = `
      <td>
        <span class="student-id">${escapeHtml(student.id)}</span>
      </td>
      <td>
        <span class="student-name">${escapeHtml(student.name)}</span>
      </td>
      <td>
        <a class="student-email" href="mailto:${escapeHtml(student.email)}" title="Send email to ${escapeHtml(student.name)}">
          ${escapeHtml(student.email)}
        </a>
      </td>
      <td>
        <span class="dept-badge ${deptClass}">${escapeHtml(student.department)}</span>
      </td>
      <td class="student-grade">
        ${student.grade.toFixed(1)}%
      </td>
      <td class="th-center">
        <span class="perf-badge ${gradeBadge.className}">
          ${gradeBadge.label}
        </span>
      </td>
    `;

    fragment.appendChild(row);
  });

  DOM.studentTableBody.appendChild(fragment);
}

/**
 * --------------------------------------------------------------------------
 * 8. Status Bar & KPI Metrics Calculations
 * --------------------------------------------------------------------------
 */
function updateStatusBar() {
  const currentCount = appState.filteredStudents.length;
  const totalCount = appState.allStudents.length;

  DOM.recordCount.textContent = `Showing ${currentCount} of ${totalCount} records`;

  const isFiltered = appState.searchQuery || appState.selectedDepartment !== 'all';
  if (isFiltered) {
    DOM.activeFilterPill.classList.remove('hidden');
    DOM.activeFilterPill.textContent = 'Filtered';
  } else {
    DOM.activeFilterPill.classList.add('hidden');
  }
}

function updateSummaryStats(students) {
  if (!students || students.length === 0) return;

  // 1. Total Enrolled Students
  DOM.statTotalStudents.textContent = students.length;

  // 2. Total Unique Departments
  const uniqueDepts = new Set(students.map(s => s.department));
  DOM.statDepartments.textContent = uniqueDepts.size;

  // 3. Class Average Grade
  const sumGrade = students.reduce((acc, curr) => acc + curr.grade, 0);
  const avgGrade = (sumGrade / students.length).toFixed(1);
  DOM.statAverageGrade.textContent = `${avgGrade}%`;

  // 4. Top Performer
  const topStudent = students.reduce((highest, curr) => (curr.grade > highest.grade ? curr : highest), students[0]);
  DOM.statTopStudent.textContent = `${topStudent.name} (${topStudent.grade.toFixed(1)}%)`;
  DOM.statTopStudent.title = `${topStudent.name} - ${topStudent.department}`;
}

/**
 * --------------------------------------------------------------------------
 * 9. Helpers & Utilities
 * --------------------------------------------------------------------------
 */

// Categorize academic grade into performance tier
function getPerformanceBadge(grade) {
  if (grade >= 90) {
    return { label: 'Excellent', className: 'perf-excellent' };
  } else if (grade >= 80) {
    return { label: 'Very Good', className: 'perf-verygood' };
  } else if (grade >= 70) {
    return { label: 'Good', className: 'perf-good' };
  } else {
    return { label: 'Satisfactory', className: 'perf-satisfactory' };
  }
}

// Maps department string to CSS styling class
function getDepartmentBadgeClass(dept) {
  const map = {
    'Computer Science': 'dept-cs',
    'Information Technology': 'dept-it',
    'Electronics & Communication': 'dept-ece',
    'Mechanical Engineering': 'dept-mech',
    'Civil Engineering': 'dept-civil',
    'Data Science': 'dept-ds'
  };
  return map[dept] || 'dept-default';
}

// Escapes special characters to protect against XSS (Cross-Site Scripting)
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Update table header sorting indicators
function updateTableSortHeaders() {
  DOM.sortableHeaders.forEach(th => {
    const sortKey = th.getAttribute('data-sort-key');
    const sortIcon = th.querySelector('.sort-icon');

    if (sortKey === appState.sortField) {
      if (appState.sortOrder === 'asc') {
        th.classList.add('sorted-asc');
        th.classList.remove('sorted-desc');
        sortIcon.textContent = '▲';
      } else {
        th.classList.add('sorted-desc');
        th.classList.remove('sorted-asc');
        sortIcon.textContent = '▼';
      }
    } else {
      th.classList.remove('sorted-asc', 'sorted-desc');
      sortIcon.textContent = '↕';
    }
  });
}

/**
 * --------------------------------------------------------------------------
 * 10. Event Listeners Setup
 * --------------------------------------------------------------------------
 */
function setupEventListeners() {
  // Search Input Event (Real-time dynamic filtering)
  DOM.searchInput.addEventListener('input', (event) => {
    appState.searchQuery = event.target.value;
    
    // Toggle clear search button visibility
    DOM.clearSearchBtn.style.display = event.target.value.length > 0 ? 'block' : 'none';

    applyFiltersAndSort();
  });

  // Clear Search Button
  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    appState.searchQuery = '';
    DOM.searchInput.focus();
    applyFiltersAndSort();
  });

  // Department Filter Change Event
  DOM.departmentFilter.addEventListener('change', (event) => {
    appState.selectedDepartment = event.target.value;
    applyFiltersAndSort();
  });

  // Sort Dropdown Change Event
  DOM.sortSelect.addEventListener('change', (event) => {
    const value = event.target.value;

    switch (value) {
      case 'name-asc':
        appState.sortField = 'name';
        appState.sortOrder = 'asc';
        break;
      case 'name-desc':
        appState.sortField = 'name';
        appState.sortOrder = 'desc';
        break;
      case 'grade-desc':
        appState.sortField = 'grade';
        appState.sortOrder = 'desc';
        break;
      case 'grade-asc':
        appState.sortField = 'grade';
        appState.sortOrder = 'asc';
        break;
      case 'id-asc':
        appState.sortField = 'id';
        appState.sortOrder = 'asc';
        break;
      default:
        appState.sortField = 'default';
        appState.sortOrder = 'asc';
        break;
    }

    applyFiltersAndSort();
  });

  // Clickable Table Headers for Sorting
  DOM.sortableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort-key');

      // If clicking the same column, toggle direction; otherwise, default to ascending
      if (appState.sortField === field) {
        appState.sortOrder = appState.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        appState.sortField = field;
        // Grades are usually more intuitively sorted descending first (highest first)
        appState.sortOrder = (field === 'grade') ? 'desc' : 'asc';
      }

      // Synchronize the dropdown value to match header click
      syncDropdownSort(appState.sortField, appState.sortOrder);

      applyFiltersAndSort();
    });
  });

  // Reset Button & Empty State Reset Button
  const handleReset = () => {
    appState.searchQuery = '';
    appState.selectedDepartment = 'all';
    appState.sortField = 'default';
    appState.sortOrder = 'asc';

    DOM.searchInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    DOM.departmentFilter.value = 'all';
    DOM.sortSelect.value = 'default';

    applyFiltersAndSort();
  };

  DOM.resetBtn.addEventListener('click', handleReset);
  DOM.emptyResetBtn.addEventListener('click', handleReset);

  // Retry Button on Fetch Failure
  DOM.retryBtn.addEventListener('click', () => {
    fetchStudentsData();
  });
}

// Synchronize sort select dropdown with column clicks
function syncDropdownSort(field, order) {
  if (field === 'name') {
    DOM.sortSelect.value = order === 'asc' ? 'name-asc' : 'name-desc';
  } else if (field === 'grade') {
    DOM.sortSelect.value = order === 'desc' ? 'grade-desc' : 'grade-asc';
  } else if (field === 'id') {
    DOM.sortSelect.value = 'id-asc';
  } else {
    DOM.sortSelect.value = 'default';
  }
}

/**
 * --------------------------------------------------------------------------
 * 11. Application Initialization
 * --------------------------------------------------------------------------
 * Initializes the app once the HTML DOM is fully parsed and accessible.
 */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchStudentsData();
});
