# Student Data Viewer 🎓

An interactive, responsive web dashboard built with **Vanilla JavaScript (ES6+)**, **HTML5**, **CSS3**, and the **Fetch API**. This project dynamically consumes and displays student academic records from a JSON dataset with real-time search, multi-department filtering, multi-column sorting, and comprehensive error handling.

Designed as a **final-year computer science placement project**, this application demonstrates core frontend fundamentals, asynchronous JavaScript concepts, state management, and responsive UI design without reliance on heavy third-party libraries.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Technologies Used](#-technologies-used)
- [Project Folder Structure](#-project-folder-structure)
- [Instructions to Run Locally](#-instructions-to-run-locally)
  - [Method 1: Python Built-in Server (Recommended)](#method-1-python-built-in-server-recommended)
  - [Method 2: VS Code Live Server Extension](#method-2-vs-code-live-server-extension)
  - [Method 3: Node.js (npx serve)](#method-3-nodejs-npx-serve)
- [Why an HTTP Server is Required (CORS & file://)](#-why-an-http-server-is-required-cors--file)
- [Code Architecture & Logic Explained](#-code-architecture--logic-explained)
- [Placement Interview Questions & Answers](#-placement-interview-questions--answers)
- [Future Enhancements](#-future-enhancements)

---

## ✨ Key Features

1. **Dynamic Asynchronous Data Loading:**
   - Consumes `students.json` asynchronously using the browser's native `Fetch API` with `async/await`.
   - Displays a clean animated loading spinner while data is being retrieved.

2. **Real-time Search:**
   - Case-insensitive search matching against both **Student Name** and **Student ID** (e.g., `Aarav` or `STU1001`).
   - Includes a quick-clear (`×`) button that resets the search field instantly.

3. **Dynamic Department Filtering:**
   - Automatically parses all unique departments from the dataset using an ES6 `Set`.
   - Allows users to filter records by specific engineering departments or view all.

4. **Multi-Way Sorting (Dropdown & Clickable Table Headers):**
   - **Dropdown:** Sort by Name (A → Z, Z → A), Grade (Highest First, Lowest First), or ID.
   - **Interactive Table Headers:** Click column headers (`ID`, `Name`, `Grade`) to toggle ascending (`▲`) and descending (`▼`) sort orders.

5. **Performance KPI Summary Cards:**
   - Total enrolled students.
   - Number of unique departments.
   - Real-time calculated class average grade (calculated using `Array.prototype.reduce`).
   - Top-performing student and their percentage.

6. **Empty & Error State Handling:**
   - **No Matching Results:** Shows a friendly empty-state illustration with an instant "Clear Search & Filters" button.
   - **Network/CORS Errors:** Displays an alert banner explaining the exact cause of failure (such as `file://` protocol restrictions) alongside a "Retry Request" button.

7. **Fully Responsive & Accessible:**
   - Optimized for mobile, tablet, and desktop screens using CSS Flexbox and CSS Grid.
   - Smooth horizontal scrolling on small screens with high contrast typography and accessible semantic HTML tags.

8. **Secure & Clean:**
   - HTML sanitization against Cross-Site Scripting (XSS) via character entity replacement.
   - Zero external CSS or JavaScript dependencies—pure native web technologies.

---

## 🛠️ Technologies Used

| Technology | Purpose in Project |
| :--- | :--- |
| **HTML5** | Semantic layout (`<header>`, `<main>`, `<section>`, `<table>`, `<caption>`, `<tfoot>`) for accessibility. |
| **CSS3** | Modern styling with CSS Custom Properties (CSS variables), Flexbox, CSS Grid, media queries, and keyframe animations. |
| **JavaScript (ES6+)** | Asynchronous operations (`async/await`, `fetch`), functional array manipulation (`filter`, `sort`, `reduce`, `map`), DOM manipulation, and event handling. |
| **JSON** | Lightweight, structured data format storing 15 student records with distinct attributes. |

---

## 📁 Project Folder Structure

```text
Student-Data-Viewer/
├── index.html        # Main application HTML structure and semantic markup
├── style.css         # Responsive styling, design tokens, and state animations
├── script.js         # Fetch API data loading, filtering, sorting, and UI logic
├── students.json     # Demonstration dataset with student records
├── start-server.bat  # 1-Click launcher to run local server and open browser on Windows
├── README.md         # Comprehensive documentation and technical interview guide
└── .gitignore        # Version control ignore rules (OS, IDE, logs)
```

---

## 🚀 Instructions to Run Locally

Because this application uses the `Fetch API` to read `students.json`, **it must be served over an HTTP/HTTPS protocol** rather than opened directly via double-clicking `index.html` (which uses the `file://` protocol).

Choose any of the simple methods below:

### Method 1: Double-Click `start-server.bat` (Easiest for Windows)

1. Open the project folder in File Explorer.
2. Double-click the file named **`start-server.bat`**.
3. A command window will launch the server and automatically open **`http://localhost:8000`** in your browser.

---

### Method 2: Python Command Line

Python comes pre-installed on most operating systems.

1. Open your terminal (PowerShell, Command Prompt, or Bash) in the project directory:
   ```bash
   cd path/to/student-data-viewer
   ```
2. Start the local HTTP server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:8000
   ```

---

### Method 3: VS Code Live Server Extension

If you use **Visual Studio Code**:
1. Open the project folder in VS Code (`File > Open Folder...`).
2. Install the extension called **"Live Server"** by Ritwick Dey.
3. Right-click `index.html` in the file explorer and click **"Open with Live Server"**.
4. The website will automatically launch in your default browser at `http://127.0.0.1:5500`.

---

### Method 3: Node.js (npx serve)

If you have Node.js installed:
1. Open your terminal in the project directory.
2. Run:
   ```bash
   npx serve .
   ```
3. Open the URL shown in the terminal (usually `http://localhost:3000`).

---

## ❓ Why an HTTP Server is Required (CORS & file://)

### The Placement Interview Explanation:
> When opening an HTML file directly from your local file system (`file:///C:/.../index.html`), modern web browsers apply strict **Same-Origin Policy (SOP)** and **Cross-Origin Resource Sharing (CORS)** security rules. Browsers treat files loaded via `file://` as having an origin of `null` or unique origins, which blocks JavaScript's `fetch()` or `XMLHttpRequest` from accessing local files for security reasons (to prevent malicious scripts on an offline HTML page from reading files on your hard drive).
> 
> Running a local HTTP server provides an origin (e.g. `http://localhost:8000`), allowing the `fetch('students.json')` call to succeed with a standard `200 OK` HTTP response.

---

## 🧠 Code Architecture & Logic Explained

### 1. Centralized State Object (`appState`)
Instead of querying the DOM repeatedly or modifying the original data destructively, the application maintains state in a single object:
```javascript
const appState = {
  allStudents: [],          // Raw fetched data (source of truth)
  filteredStudents: [],     // Active displayed subset
  searchQuery: '',          // Current search term
  selectedDepartment: 'all',// Current department filter
  sortField: 'default',     // 'name' | 'grade' | 'id' | 'default'
  sortOrder: 'asc'          // 'asc' | 'desc'
};
```

### 2. Fetch API & Error Handling (`fetchStudentsData`)
```javascript
async function fetchStudentsData() {
  try {
    const response = await fetch('students.json');
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    const data = await response.json();
    // Process and render...
  } catch (error) {
    showError(error.message);
  }
}
```
- **Why check `response.ok`?** The Fetch API promise only rejects on network failures (e.g., DNS failure, offline). It **does not** reject on HTTP errors like `404 Not Found` or `500 Internal Server Error`. Checking `response.ok` guarantees the status code is in the 200–299 range.

### 3. Array Filtering Pipeline (`applyFiltersAndSort`)
Filters work concurrently using `Array.prototype.filter()`:
```javascript
let results = appState.allStudents.filter(student => {
  const matchesSearch = !query || 
    student.name.toLowerCase().includes(query) || 
    student.id.toLowerCase().includes(query);

  const matchesDept = (selectedDept === 'all') || (student.department === selectedDept);

  return matchesSearch && matchesDept;
});
```

### 4. Array Sorting Logic
- **Strings (Name / ID):** Uses `String.prototype.localeCompare()` for accurate alphabetical collation.
- **Numbers (Grade):** Uses numeric difference:
  ```javascript
  comparison = a.grade - b.grade;
  ```
- **Reversing direction:** If `sortOrder === 'desc'`, the sign of `comparison` is inverted (`-comparison`).

### 5. Statistics Calculation via `Array.prototype.reduce`
- Average grade is computed mathematically in $O(n)$ time:
  $$\text{Average} = \frac{\sum \text{grade}}{N}$$
  ```javascript
  const sumGrade = students.reduce((acc, curr) => acc + curr.grade, 0);
  const avgGrade = (sumGrade / students.length).toFixed(1);
  ```

---

## 🎯 Placement Interview Questions & Answers

Here are answers to common questions interviewers may ask about this project:

#### Q1: What is the difference between `==` and `===` in JavaScript?
> `==` (loose equality) performs automatic type coercion before comparing values (e.g., `'5' == 5` is `true`), whereas `===` (strict equality) compares both value and type without conversion (e.g., `'5' === 5` is `false`). In this project, strict equality `===` is used everywhere to prevent unexpected coercion bugs.

#### Q2: How does JavaScript's `Array.prototype.sort()` work, and why do we pass a comparator function?
> By default, `sort()` converts elements to strings and compares their UTF-16 code units. For numbers, this causes incorrect sorting (e.g., `100` would come before `25` because `"1"` < `"2"`). By providing a comparator `(a, b) => a - b`, we guarantee numerical ordering: if the result is negative, `a` comes before `b`; if positive, `b` comes before `a`.

#### Q3: How do you prevent Cross-Site Scripting (XSS) when rendering dynamic data?
> Instead of blindly concatenating untrusted user or remote input into `innerHTML`, special HTML characters (`<`, `>`, `&`, `"`, `'`) are escaped through our `escapeHtml()` utility function, converting them to HTML entities (e.g. `&lt;`, `&gt;`).

#### Q4: Why did you use `DocumentFragment` when rendering table rows?
> When updating the DOM, each insertion can trigger browser reflows and repaints. By appending each `<tr>` to an in-memory `document.createDocumentFragment()` first and then appending the fragment to `tbody` in a single operation, we minimize layout thrashing and boost rendering performance.

---

## 🔮 Future Enhancements

- **Client-Side Pagination:** Add page numbers (e.g. 5 or 10 records per page) with Next/Previous buttons.
- **Export to CSV:** Enable users to download the filtered table as a `.csv` spreadsheet file.
- **CRUD Functionality:** Add a modal form to add, edit, or delete student records in memory or local storage.
- **Dark Mode Toggle:** Support a user-toggleable dark theme using CSS custom properties.

---

## 📄 License

This project is created for educational and interview demonstration purposes. Feel free to use and modify it for your placement portfolio!
