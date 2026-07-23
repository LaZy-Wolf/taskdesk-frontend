# TaskDesk

TaskDesk is a login-gated CRUD task management application built with Next.js (App Router, TypeScript) designed as a test target for automated QA tools.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   The application will run on **`http://localhost:3100`**.

## Credentials

- **Username**: `demo`
- **Password**: `demo123`

## Pages & Selector Contract

- `/login` (Public): Form with `#username` (placeholder "Enter username"), `#password` (placeholder "Enter password"), button `Sign in`, and `#login-error`.
- `/tasks` (Protected): `<h1>All Tasks</h1>`, `#task-list` with `.task-row` items, link `New Task`, `#flash`.
- `/tasks/new` (Protected): `#title`, `#description`, `#priority`, button `Save task`.
- `/profile` (Protected): `<h1>Profile</h1>`, `#profile-user` showing `demo`.

> **[IMPORTANT] Deliberate Defect Note:**
> The `/tasks` page renders `<h1>All Tasks</h1>` and deliberately **does NOT contain** any element with `id="task-count"`.
> This mismatch is an intentional control defect for QA testing (verifying that test suites correctly detect missing elements / header mismatches). Do **NOT** fix or add `#task-count`.
