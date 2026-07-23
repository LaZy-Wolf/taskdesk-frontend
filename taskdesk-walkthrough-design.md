# TaskDesk — dummy product + full QA walkthrough (design)

- Date: 2026-07-23
- Status: approved (design)
- Goal: give the user a realistic login-gated product they build themselves (in Antigravity,
  hosted on GitHub, run on localhost), then drive the QA Virtual Engineer against it three
  ways — **plugin (qa.yaml)**, **CI/CD**, and **the UI** — to learn the tool hands-on and to
  surface further defects/functional gaps.

## Why

The engine has been validated on fixtures I wrote and on live sales. The remaining unknowns are
(a) does it work on a product built by someone else, to a spec, and (b) is the operator
experience good enough for a real user to run it unaided. This exercise answers both, and any
friction found becomes a tracked finding.

## Constraints (decided)

- Dummy app is a **login-gated CRUD app**; **localhost only** (no public deploy).
- Stack: **Next.js (App Router)** + cookie session + in-memory store. Port **3100**
  (3000 is the QA UI, 8080 the QA API, 5050/5055 the existing fixtures).
- The user builds the app; this spec is the hand-off contract.

## Component 1 — TaskDesk (the product under test)

### Auth
- `POST`-style login at `/login`: username `demo`, password `demo123`.
- On success set an HTTP cookie `td_session=ok; Path=/` and redirect to `/tasks`.
- Protected routes (`/tasks`, `/tasks/new`, `/profile`) **302 → `/login`** when the cookie is
  absent. `/login` is public and always renders the form (even when authenticated).
- Wrong credentials: re-render `/login` with `#login-error` = "Invalid credentials".

### Pages and the SELECTOR CONTRACT (non-negotiable — reliability depends on it)
Every input carries a stable `id` **and** a `placeholder`; every button has exact visible text.

| Page | Elements (id / placeholder / text) |
|---|---|
| `/login` | `#username` placeholder `Enter username`; `#password` (type=password) placeholder `Enter password`; button **Sign in**; `#login-error` |
| `/tasks` (protected) | `h1` text **All Tasks**; `#task-list` containing one `.task-row` per task; link **New Task** → `/tasks/new`; `#flash` (shows "Task created" after a save) |
| `/tasks/new` (protected) | `#title` placeholder `Task title`; `#description` (textarea) placeholder `Describe the task`; `#priority` (select: Low/Medium/High); button **Save task** |
| `/profile` (protected) | `h1` text **Profile**; `#profile-user` showing `demo` |

### Seed data
`/tasks` starts with exactly 3 tasks: "Write spec" (High), "Fix login bug" (Medium),
"Ship release" (Low). In-memory store; a restart resets to these 3. Creating a task appends it
and shows `#flash` = "Task created".

### The ONE deliberate defect (documented, intentional)
`/tasks` renders `h1` **"All Tasks"** and has **no** `#task-count` element. The qa.yaml
`defect-detect` flow asserts a **"Task Dashboard"** heading and `#task-count`. The engine must
FAIL that flow and refuse to promote it → the CI gate blocks. This proves defect-gating on the
user's own app. Do **not** "fix" it; it is the control.

### Run + repo
- `npm run dev` serves `http://localhost:3100`.
- Repo root contains the app, `qa.yaml`, and (later) `.github/workflows/qa.yml` + exported tests.
- README documents: run command, credentials, and that the missing `#task-count` is deliberate.

## Component 2 — `qa.yaml` (the plugin)

Five flows mirroring the validated matrix: `login` (auth-tagged, self-contained),
`tasks-list` and `profile` (protected page loads), `task-create` (form submit + result),
`defect-detect` (negative → must fail). `auth.login_flow` names the real placeholders and the
"Sign in" button so `_login_selectors_from_prose` parses them; creds come from
`TASKDESK_USER` / `TASKDESK_PASS` env refs. Guardrail `allowed_hosts: ["localhost","127.0.0.1"]`.

## Component 3 — Test path A: plugin method (local)

Start TaskDesk (3100) + QA engine (8080, creds in env). Then:
1. Register the manifest (`POST /api/v1/products`) — or via the harness.
2. Generate (`mode=generate`) — engine captures a session, grounds per page, generates,
   executes, self-heals, triages, promotes.
3. Expect: `login`/`tasks-list`/`task-create`/`profile` → **approved**;
   `defect-detect` → **missing** (`baseline_promotion_skipped_minority_pass`).
4. Gate green: `qa_ci_client run --mode rerun` → **exit 0**.
5. Gate red: `--mode auto` (defect-detect missing) → **exit 1**. Optionally break a real flow
   (edit a label) and re-run → **exit 1** with that flow failing.
6. Infra: point `--url` at a dead port → **exit 2**.

## Component 4 — Test path B: CI/CD (GitHub Actions)

Because the app is localhost-only, CI boots it inside the runner. Two flavors, both documented;
**exported-suite is the primary** for this setup.

- **Exported-suite (primary, engine-free):** after baselines are approved locally, export the
  standalone pytest+Playwright suite (`GET /api/v1/workflows/{id}/export` → zip) and commit
  `tests/` + `conftest.py` to the TaskDesk repo. Actions workflow: checkout → `npm ci` →
  start app on 3100 → `pip install -r requirements.txt` → `playwright install chromium` →
  `pytest`. No QA engine, no OpenAI key in CI. Auth via `QA_STORAGE_STATE` if needed.
- **Engine-gated (documented, needs persistence):** CI calls a *running* QA engine with
  `qa_ci_client.py`. **Caveat to state plainly:** baselines live in memory unless
  `DATABASE_URL` is configured, so a fresh engine per job has none and the gate always blocks.
  This flavor requires a long-lived engine + Postgres.

## Component 5 — Test path C: the UI

Drive `http://localhost:3000` (QA UI, backend on 8080):
1. `/workflows/new` → **Requirements Document** → paste a short TaskDesk requirement →
   **Target URL** `http://localhost:3100` → Continue → configure (Chromium, headless,
   self-healing on) → **START WORKFLOW**.
2. Watch `/` (Agent Pipeline + activity), `/workflows/[id]` (live progress), `/tests`
   (generated cases), `/bugs` (triage), `/reports`, `/self-healing`.
3. Visit `/products` (type the URL — it is not in the sidebar) to see baseline status.

Known UI limits to expect (already found, not bugs to fix now): `/products` is absent from the
sidebar and read-only; `/pipelines` is a roadmap stub and will not show CI-gate runs.

## Component 6 — Gap-hunting protocol

Every run: record anything wrong or confusing in `scripts/release_validation/interventions.md`
under a "TaskDesk walkthrough" heading — engine defect, UX friction, or doc gap. Engine defects
get fixed with a regression test (same discipline as the release validation); UX/doc items are
logged for triage.

## Non-goals

- No public deployment, no Postgres setup, no closing of the three UI gaps (tracked separately).
- No new engine features; only fixes for defects this exercise exposes.
- TaskDesk stays deliberately small — it is a test target, not a product.

## Risks

- **Selector drift by the builder:** if Antigravity deviates from the selector contract, codegen
  reliability drops. Mitigation: the contract table above is explicit and the README restates it.
- **Port collisions:** 3100 chosen to avoid 3000/8080/5050/5055.
- **LLM codegen variance:** expected (~1/3 on interaction flows); the majority-pass guard and
  deterministic replay contain it. Re-generate if a flow fails to promote.
