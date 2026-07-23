# TaskDesk Walkthrough — Build & Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a login-gated CRUD app ("TaskDesk"), then drive the QA Virtual Engineer against it three ways — plugin (`qa.yaml`), CI/CD (GitHub Actions), and the UI — to learn the tool hands-on and surface further defects/gaps.

**Architecture:** TaskDesk is a small Next.js app on localhost:3100 with cookie auth, protected routes, a create-task form, and ONE deliberate defect. The QA engine (API :8080, UI :3000) tests it via a `qa.yaml` plugin locally, via an exported engine-free pytest suite in GitHub Actions, and via the ad-hoc UI wizard.

**Tech Stack:** Next.js (App Router) + cookie session + in-memory store; QA engine (FastAPI + Playwright, `./.venv/Scripts/python.exe`); GitHub Actions.

## Global Constraints

- Ports: **TaskDesk 3100**, QA UI **3000**, QA API **8080** (fixtures already use 5050/5055). Never reuse 5060/5061 (Chromium unsafe ports).
- QA interpreter is `./.venv/Scripts/python.exe` (bare `python` is 3.8 — wrong).
- **Selector contract is non-negotiable:** every input has a stable `id` AND a `placeholder`; every button has exact visible text. Codegen reliability depends on it.
- The `#task-count` / "Task Dashboard" mismatch on `/tasks` is a **deliberate defect** — never "fix" it.
- Credentials: `demo` / `demo123`, passed to the engine as env `TASKDESK_USER` / `TASKDESK_PASS`. Never commit real secrets.
- Two repos: **TaskDesk repo** (the app, its `qa.yaml`, its workflow, exported tests) and **QA repo** (`C:\Users\gugul\Downloads\QA-Virtual-Engineer`, findings log).

---

## File Structure

**TaskDesk repo (user creates, on GitHub):**
- `app/login/page.tsx` — login form (public)
- `app/tasks/page.tsx` — task list (protected) — *contains the deliberate defect*
- `app/tasks/new/page.tsx` — create form (protected)
- `app/profile/page.tsx` — profile (protected)
- `middleware.ts` — cookie gate: protected routes 302 → `/login`
- `app/api/login/route.ts` — sets `td_session` cookie
- `lib/store.ts` — in-memory task store + seed
- `qa.yaml` — the QA plugin manifest
- `.github/workflows/qa.yml` — CI (engine-free exported suite)
- `tests/`, `conftest.py`, `requirements.txt` — exported later from the engine
- `README.md` — run steps, creds, and a note that the missing `#task-count` is deliberate

**QA repo (already exists):**
- `scripts/release_validation/interventions.md` — append a "TaskDesk walkthrough" section for findings

---

## Task 1: Build TaskDesk (user, in Antigravity)

**Files:** all TaskDesk repo files listed above.

**Interfaces:**
- Produces: an app on `http://localhost:3100` with the exact selector contract below; later tasks' `qa.yaml` targets these ids/placeholders/labels verbatim.

- [ ] **Step 1: Paste this brief into Antigravity**

```
Build a small Next.js 14+ (App Router, TypeScript) app called "TaskDesk". It is a test
target for an automated QA tool, so EXACT ids, placeholders and button text matter more
than styling. Keep it simple and dependency-light. It must run with `npm run dev` on
PORT 3100 (set "dev": "next dev -p 3100" in package.json).

AUTH (cookie session, no database):
- POST /api/login accepts username+password. If username === "demo" && password === "demo123",
  set cookie `td_session=ok; Path=/` and redirect to /tasks. Otherwise re-render /login
  showing an element with id "login-error" containing exactly "Invalid credentials".
- middleware.ts: if the `td_session` cookie is missing, redirect /tasks, /tasks/new and
  /profile to /login (HTTP 302). /login is always public and always renders the form,
  even when the cookie is present.
- Add a "Sign out" link on protected pages that clears the cookie.

PAGES (exact selectors — do not rename):
1) /login (public)
   - <input id="username" placeholder="Enter username" />
   - <input id="password" type="password" placeholder="Enter password" />
   - <button> with exact text: Sign in
   - <div id="login-error"></div>
2) /tasks (protected)
   - <h1> with exact text: All Tasks
   - <div id="task-list"> containing one <div class="task-row"> per task; each row shows
     the task title, priority, and description.
   - a link with exact text: New Task  -> /tasks/new
   - <div id="flash"></div> that shows exactly "Task created" after a successful create
3) /tasks/new (protected)
   - <input id="title" placeholder="Task title" />
   - <textarea id="description" placeholder="Describe the task"></textarea>
   - <select id="priority"> with options Low, Medium, High (default Medium)
   - <button> with exact text: Save task
   - On submit, append the task to the store and redirect to /tasks with #flash = "Task created"
4) /profile (protected)
   - <h1> with exact text: Profile
   - <span id="profile-user">demo</span>

DATA: an in-memory module (lib/store.ts) seeded with EXACTLY these 3 tasks:
  - "Write spec" (High)
  - "Fix login bug" (Medium)
  - "Ship release" (Low)
Creating a task appends to this array. A server restart resets to the 3 seeds. No database.

DELIBERATE DEFECT — DO NOT FIX:
The /tasks page must render the heading "All Tasks" and must NOT contain any element with
id "task-count". This mismatch is intentional; an automated QA check expects a
"Task Dashboard" heading and a #task-count element and is SUPPOSED to fail.

README.md must document: `npm run dev` (port 3100), credentials demo/demo123, and a clear
note that the missing #task-count element is deliberate and must not be fixed.
```

- [ ] **Step 2: Run it and self-check**

```bash
npm run dev
```
Then verify by hand in a browser:
- `http://localhost:3100/tasks` while logged out → redirects to `/login`
- login `demo` / `demo123` → lands on `/tasks`, 3 seeded rows visible, `h1` = "All Tasks"
- `/tasks/new` → fill Title/Description/Priority → **Save task** → back on `/tasks` with "Task created" and 4 rows
- wrong password → `#login-error` shows "Invalid credentials"
- View source of `/tasks`: **no** `#task-count` (defect present, as intended)

- [ ] **Step 3: Push to GitHub**

```bash
git init && git add -A
git commit -m "feat: TaskDesk — login-gated CRUD test target"
git branch -M main
git remote add origin <your-taskdesk-repo-url>
git push -u origin main
```

---

## Task 2: Add the qa.yaml plugin

**Files:**
- Create: `qa.yaml` (TaskDesk repo root)

**Interfaces:**
- Consumes: the Task 1 selector contract (placeholders `Enter username` / `Enter password`, button `Sign in`).
- Produces: product id `taskdesk` with flows `login`, `tasks-list`, `task-create`, `profile`, `defect-detect` — later tasks reference these ids.

- [ ] **Step 1: Create `qa.yaml`**

```yaml
# TaskDesk — QA Virtual Engineer plugin manifest.
product: taskdesk
display_name: TaskDesk (walkthrough target)
environments:
  staging: http://localhost:3100
auth:
  login_flow: "Go to http://localhost:3100/login. In the username field (placeholder 'Enter username') type ${TASKDESK_USER}. In the password field (placeholder 'Enter password') type ${TASKDESK_PASS}. Click the 'Sign in' button. Wait until the URL is no longer /login."
  username_ref: TASKDESK_USER
  password_ref: TASKDESK_PASS
data:
  guardrails:
    allowed_hosts: ["localhost", "127.0.0.1"]
flows:
  - id: login
    text: "After signing in, verify the URL is no longer /login and the heading 'All Tasks' is visible."
    tags: [smoke, auth]
  - id: tasks-list
    text: "After signing in, navigate to http://localhost:3100/tasks and verify the heading 'All Tasks' is visible and the element with id 'task-list' contains the text 'Write spec'."
    tags: [smoke]
  - id: task-create
    text: "After signing in, navigate to http://localhost:3100/tasks/new. Fill the 'Task title' field with 'QA smoke task' and the 'Describe the task' field with 'created by QA'. Click the 'Save task' button. Verify the text 'Task created' appears."
    tags: [regression, feature]
  - id: profile
    text: "After signing in, navigate to http://localhost:3100/profile and verify the heading 'Profile' is visible and the element with id 'profile-user' contains 'demo'."
    tags: [smoke]
  - id: defect-detect
    text: "After signing in, navigate to http://localhost:3100/tasks and verify a heading 'Task Dashboard' is visible and an element with id 'task-count' exists."
    tags: [regression, negative]
policy:
  block_on: [failed]
  min_pass_rate: 100
  on_missing_baseline: fail
test_types: [ui]
```

- [ ] **Step 2: Validate it parses** (run from the QA repo)

```bash
cd /c/Users/gugul/Downloads/QA-Virtual-Engineer
./.venv/Scripts/python.exe -c "from src.config.product_manifest import load_manifest; m=load_manifest(open(r'<path-to-taskdesk>/qa.yaml').read()); print('OK', [f.id for f in m.flows])"
```
Expected: `OK ['login', 'tasks-list', 'task-create', 'profile', 'defect-detect']`

- [ ] **Step 3: Commit** (TaskDesk repo)

```bash
git add qa.yaml && git commit -m "feat: add QA Virtual Engineer plugin manifest" && git push
```

---

## Task 3: Test path A — plugin method (local)

**Files:** none created; produces baselines in the running engine.

**Interfaces:**
- Consumes: TaskDesk on 3100, `qa.yaml` from Task 2.
- Produces: approved baselines for 4 flows; `defect-detect` deliberately unapproved.

- [ ] **Step 1: Start TaskDesk** (its own terminal)

```bash
npm run dev
```

- [ ] **Step 2: Start the QA engine** (QA repo, its own terminal)

```bash
cd /c/Users/gugul/Downloads/QA-Virtual-Engineer
SECURITY_AUTH_ENABLED=false PLAYWRIGHT_HEADLESS=true TASKDESK_USER=demo TASKDESK_PASS=demo123 ./.venv/Scripts/python.exe -m src.api.main
```
Wait for `Uvicorn running on http://0.0.0.0:8080`.

- [ ] **Step 3: Register + generate (one command)**

```bash
cd /c/Users/gugul/Downloads/QA-Virtual-Engineer
./.venv/Scripts/python.exe -m scripts.release_validation.run_target --manifest "<path-to-taskdesk>/qa.yaml" --base-url http://localhost:3100 --mode generate
```
Takes ~8–15 min (LLM generation for 5 flows). Expected final JSON:
```json
{"flows": {"login": "approved", "tasks-list": "approved", "task-create": "approved",
           "profile": "approved", "defect-detect": "missing"}}
```
`defect-detect: missing` is **success** — the engine caught the planted defect and refused to bless it. If a *real* flow shows `missing`, re-run this step once (LLM variance); if it persists, record a finding in Task 6.

- [ ] **Step 4: Gate GREEN → exit 0**

```bash
./.venv/Scripts/python.exe scripts/qa_ci_client.py run --product taskdesk --url http://localhost:3100 --mode rerun --junit taskdesk-green.xml --server http://localhost:8080
echo "exit=$?"
```
Expected: `verdict = pass`, `4 passed ... 0 failed`, `exit=0`.

- [ ] **Step 5: Gate RED (planted defect blocks the build) → exit 1**

```bash
./.venv/Scripts/python.exe scripts/qa_ci_client.py run --product taskdesk --url http://localhost:3100 --mode auto --server http://localhost:8080
echo "exit=$?"
```
Expected: `verdict = fail`, reason `flow defect-detect has no approved baseline (missing)`, `exit=1`.

- [ ] **Step 6: Gate RED from a real regression → exit 1**

In TaskDesk, temporarily change the `/profile` heading from `Profile` to `My Profile`, save (Next hot-reloads), then:
```bash
./.venv/Scripts/python.exe scripts/qa_ci_client.py run --product taskdesk --url http://localhost:3100 --mode rerun --server http://localhost:8080
echo "exit=$?"
```
Expected: `exit=1` with the `profile` case failing. **Revert the heading to `Profile` afterwards.**

- [ ] **Step 7: Infra error → exit 2**

```bash
./.venv/Scripts/python.exe scripts/qa_ci_client.py run --product taskdesk --url http://localhost:3999 --mode rerun --server http://localhost:8080
echo "exit=$?"
```
Expected: `verdict = infra_error`, `exit=2` (not a test failure).

---

## Task 4: Test path B — CI/CD via GitHub Actions (engine-free)

**Files:**
- Create in TaskDesk repo: `tests/`, `conftest.py`, `requirements.txt` (exported), `.github/workflows/qa.yml`

**Interfaces:**
- Consumes: approved baselines from Task 3 (the export contains the exact code that passed).
- Produces: a CI job that runs the suite with plain pytest — no QA engine, no OpenAI key.

- [ ] **Step 1: Find a completed workflow id**

```bash
curl -s "http://localhost:8080/api/v1/workflows?limit=10"
```
Pick a `workflow_id` whose flow you want exported (e.g. the `task-create` generation run).

- [ ] **Step 2: Export the standalone suite**

```bash
curl -s -o taskdesk-suite.zip "http://localhost:8080/api/v1/workflows/<workflow_id>/export"
unzip -o taskdesk-suite.zip -d <path-to-taskdesk>/
```
Produces `tests/test_suite.py`, `conftest.py`, `requirements.txt`, `README.md` in the TaskDesk repo.

- [ ] **Step 3: Add the CI workflow**

Create `.github/workflows/qa.yml` in the TaskDesk repo:

```yaml
name: QA
on: [push, pull_request]

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      - name: Start TaskDesk
        run: |
          npm run dev &
          for i in $(seq 1 30); do
            curl -sf http://localhost:3100/login && break
            sleep 2
          done

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: python -m playwright install --with-deps chromium

      - name: Run QA suite
        env:
          TASKDESK_USER: demo
          TASKDESK_PASS: demo123
        run: pytest -v --junitxml=junit.xml

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: qa-results
          path: junit.xml
```

- [ ] **Step 4: Push and watch it run**

```bash
git add tests conftest.py requirements.txt .github/workflows/qa.yml
git commit -m "ci: run exported QA suite on every push"
git push
```
Open the repo's **Actions** tab. Expected: the job runs pytest against TaskDesk booted in the runner.
If tests need an authenticated session, set `QA_STORAGE_STATE` (the exported `conftest.py` reads it) or keep the exported login test first in the file.

- [ ] **Step 5: Prove CI blocks a bad build**

Change `/profile`'s heading to `My Profile`, commit, push. Expected: the Actions job **fails** (red X) — a real regression blocked before production. Revert afterwards.

> **Engine-gated CI (alternative, documented):** calling a running engine with `qa_ci_client.py` from CI requires a **long-lived engine with `DATABASE_URL` set** — baselines are in-memory otherwise, so a fresh engine per job has none and the gate always blocks. Use the exported-suite flavor above unless you stand up a persistent QA service.

---

## Task 5: Test path C — the UI

**Files:** none.

**Interfaces:**
- Consumes: TaskDesk on 3100, QA API on 8080.

- [ ] **Step 1: Start the QA UI** (QA repo, its own terminal)

```bash
cd /c/Users/gugul/Downloads/QA-Virtual-Engineer/Frontend
npm run dev
```
Open `http://localhost:3000` (backend must be running from Task 3 Step 2).

- [ ] **Step 2: Create a workflow**

1. Sidebar → **Workflows** → **New Workflow** (or go to `/workflows/new`)
2. Choose **Requirements Document**
3. Paste into **Requirements Text**:
```
Sign in to TaskDesk with username demo and password demo123 using the username field
(placeholder 'Enter username') and password field (placeholder 'Enter password'), then
click 'Sign in'. Then navigate to /tasks and verify the heading 'All Tasks' is visible
and the element with id 'task-list' contains 'Write spec'.
```
4. **Target URL:** `http://localhost:3100`
5. **Continue to Configuration** → Browser **Chromium**, **Headless** on, **Self-Healing** on → **START WORKFLOW**

- [ ] **Step 3: Watch it work**

- `/` (Dashboard) — Agent Pipeline lights up; Active Workflows / Tests Generated tick up
- `/workflows/<id>` — live stage progress
- `/tests` — the generated Playwright cases
- `/bugs` — triaged failures (if any)
- `/reports` — the run report
- `/self-healing` — heal attempts

- [ ] **Step 4: See plugin status in the UI**

Type `http://localhost:3000/products` in the address bar (it is **not** in the sidebar) and confirm `taskdesk` appears with per-flow baseline status matching Task 3.

---

## Task 6: Record findings

**Files:**
- Modify: `scripts/release_validation/interventions.md` (QA repo)

- [ ] **Step 1: Append a findings section**

Add under a new `## TaskDesk walkthrough` heading, one bullet per issue, tagged
`[engine]`, `[ux]`, or `[docs]`:
```markdown
## TaskDesk walkthrough (2026-07-23)
- [ux] /products is not reachable from the sidebar — had to type the URL.
- [engine] <what broke, the exact error, and which step>
- [docs] <anything the plan failed to explain>
```

- [ ] **Step 2: Commit** (QA repo)

```bash
cd /c/Users/gugul/Downloads/QA-Virtual-Engineer
git add scripts/release_validation/interventions.md
git commit -m "docs(walkthrough): TaskDesk findings"
```

- [ ] **Step 3: Triage**

Send me the findings list. Engine defects get a fix + regression test (same discipline as the release validation); UX/doc items get triaged into a follow-up list.

---

## Self-Review (done)

- **Spec coverage:** Component 1 → Task 1; Component 2 → Task 2; path A → Task 3; path B → Task 4; path C → Task 5; gap protocol → Task 6. All covered.
- **Placeholder scan:** none — the Antigravity brief, `qa.yaml`, workflow YAML and every command are complete and literal. `<path-to-taskdesk>` and `<workflow_id>` are user-supplied values, not unwritten content.
- **Consistency:** ports (3100/3000/8080), credentials (demo/demo123 ↔ `TASKDESK_USER`/`TASKDESK_PASS`), flow ids (`login`, `tasks-list`, `task-create`, `profile`, `defect-detect`) and selectors (`#username`, `Enter username`, `Sign in`, `#task-list`, `#profile-user`, absent `#task-count`) match across Tasks 1–5.
