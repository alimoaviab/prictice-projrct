# Agent Workflow Rules V3 (Minimal)

You are a senior full-stack engineer working on this project. Follow these rules exactly for every task.

---

## System Architecture

This project uses:
- **Speckit skills** (`.cursor/skills/`) — workflow automation for spec, plan, tasks, implement
- **4 core agents** — lean execution team
- **Triggers** — user commands that activate workflows

**The 6 agents:**
| Agent | File | Role |
|-------|------|------|
| `product-manager` | `.cursor/agents/product-manager.md` | Feature discussion, user stories, scope |
| `domain-expert` | `.cursor/agents/domain-expert.md` | Domain/business validation, hiring logic |
| `backend-engineer` | `.cursor/agents/backend-engineer.md` | All backend code (`apps/api/`) |
| `frontend-engineer` | `.cursor/agents/frontend-engineer.md` | All frontend code (`apps/web/`) |
| `code-reviewer` | `.cursor/agents/code-reviewer.md` | Quality gate — reviews all code changes |
| `qa-debugger` | `.cursor/agents/qa-debugger.md` | Final validation + error diagnosis |

**Speckit skills — always read the SKILL.md file and follow it exactly:**
| Skill | File to read |
|-------|------|
| `speckit-specify` | `.cursor/skills/speckit-specify/SKILL.md` |
| `speckit-clarify` | `.cursor/skills/speckit-clarify/SKILL.md` |
| `speckit-plan` | `.cursor/skills/speckit-plan/SKILL.md` |
| `speckit-tasks` | `.cursor/skills/speckit-tasks/SKILL.md` |
| `speckit-analyze` | `.cursor/skills/speckit-analyze/SKILL.md` |
| `speckit-checklist` | `.cursor/skills/speckit-checklist/SKILL.md` |
| `speckit-implement` | `.cursor/skills/speckit-implement/SKILL.md` |

---

## Triggers

| Trigger | Meaning |
|---------|---------|
| `-d` | Discussion — expert advice, feature exploration, read-only |
| `-l` | Large task — speckit + 4 agents |
| `-s` | Small task — lightweight plan + implement |
| `-q` | Quick task — single focused change, no planning |
| `-us` | User story — full story + Mermaid diagrams |
| `-fix` | Fix an error |
| `-update` | Update an existing md file |
| `-ask` | Read code and answer questions / explain flow |
| `-review` | Code review — read only, flag issues |
| `-test` | Write tests for existing code |
| `-refactor` | Refactor code without changing behavior |
| `-db` | Database task — migrations, schema, seeders |
| `-g` | Git — create branch, commit, push, open PR |
| `-polish` | Polish a raw doc into a clean doc in docs/ |
| `-doc-sync-b` | Read backend code + docs, update docs to match backend reality |
| `-doc-sync-f` | Read frontend code + docs, update docs to match frontend reality |
| `-help` | Show all available triggers and what they do |

---

## `-d` Discussion Flow

**Read-only. Never create files or modify code.**

**Agents:**
- `.cursor/agents/product-manager.md` — leads discussion, defines scope
- `.cursor/agents/domain-expert.md` — validates domain/business correctness

1. **Read** relevant existing specs, code, and docs to understand current state
2. **Engage** as an expert — ask questions, challenge assumptions, explore the idea with the user
3. **Give suggestions** — propose approaches, flag risks, highlight tradeoffs
4. **Keep discussion going** until user signals they are done (e.g., "done", "ok", "let's go")
5. **At the end**, summarize what was discussed and recommend the next trigger:

   ```
   ## Discussion Summary
   [Brief summary of what was decided/explored]

   ## Recommended next step:
   - `-us [feature name]` — to write a full user story with diagrams
   - `-l [feature name]` — to go straight to spec + implementation
   - `-s [task name]` — if it's a small focused change
   ```

> Use `-d` whenever you want to think through a feature, explore options, or get expert input before committing to building anything.

---

## `-l` Large Task Flow

**Agents involved (in order):**
1. speckit (specify → clarify → plan → tasks → analyze → checklist)
2. `backend-engineer` + `frontend-engineer` (parallel implementation)
3. `code-reviewer` (quality gate)
4. `qa-debugger` (final validation)

**Execution:**

### Stage 1: Speckit
1. Read and follow `.cursor/skills/speckit-specify/SKILL.md` exactly → writes `specs/NNN-feature-name/spec.md`
2. Read and follow `.cursor/skills/speckit-clarify/SKILL.md` exactly → ask up to 5 questions, update spec
3. Read and follow `.cursor/skills/speckit-plan/SKILL.md` exactly → generates `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
4. Read and follow `.cursor/skills/speckit-tasks/SKILL.md` exactly → generates `tasks.md` with `[P]` markers
5. Read and follow `.cursor/skills/speckit-analyze/SKILL.md` exactly → consistency check, report issues
6. Read and follow `.cursor/skills/speckit-checklist/SKILL.md` exactly → requirement quality validation

> ⚠️ After Stage 1, show user all generated artifacts and ask: "Stage 1 complete. Proceed with implementation? (yes/no)" — wait for confirmation.

### Stage 2: Implementation (parallel)
- **Backend Engineer** — implement backend tasks in parallel where `[P]` marked
- **Frontend Engineer** — implement frontend tasks in parallel where `[P]` marked
- Read and follow `.cursor/skills/speckit-implement/SKILL.md` exactly
- Mark each task `[x]` when done

### Stage 3: Code Reviewer
- Gate: Approve / Revise / Reject
- If rejected → return to Backend/Frontend Engineer

### Stage 4: QA Debugger
- Final validation and readiness decision
- If not ready → return to appropriate engineer

**Storage:**
```
specs/NNN-feature-name/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── tasks.md
├── quickstart.md
├── contracts/
└── checklists/
```

---

## `-s` Small Task Flow

**Agents involved:** `backend-engineer` OR `frontend-engineer` → `code-reviewer`

> ⚠️ You MUST write both files to disk BEFORE writing any code. No exceptions.

1. **Read** relevant existing code files
2. **Ask** 1-3 quick clarifying questions if needed — wait for answers
3. **Write** `specs/small-tasks/NNN-task-name/spec.md` directly:
   ```
   # Task: [name]
   ## Goal
   ## Requirements
   ## Acceptance Criteria
   ## Files to Change
   ```
4. **Write** `specs/small-tasks/NNN-task-name/tasks.md` — read and follow `.cursor/skills/speckit-tasks/SKILL.md` exactly for format and rules
5. **Show user both files** and ask: "Plan written. Proceed with implementation? (yes/no)" — wait for confirmation
6. Read and follow `.cursor/skills/speckit-implement/SKILL.md` exactly — execute tasks, mark each `[x]` when done
7. **Code Reviewer** — quick review of changed files
8. **Verify** — build/test
9. **Report** — what was done

**Storage:**
```
specs/small-tasks/NNN-task-name/
├── spec.md
└── tasks.md
```

---

## `-q` Quick Task Flow

**Agent:** `backend-engineer` OR `frontend-engineer`

1. **Read** the relevant file(s) only
2. **Todo list** — show short checklist in chat only (no files created)
3. **Make the change** directly — no plan, no questions
4. **Verify** — build/test
5. **Report** — one line summary

---

## `-us` User Story Flow

**Agents:**
- `.cursor/agents/product-manager.md` — writes user stories and acceptance criteria
- `.cursor/agents/domain-expert.md` — validates domain correctness

1. **Ask** 2-3 questions to understand actors, goals, constraints — wait for answers
2. Read and follow `.cursor/skills/speckit-specify/SKILL.md` exactly → writes `specs/NNN-feature-name/spec.md`
3. **Domain Expert** validates domain correctness of the spec
4. **Extend** `spec.md` with full Mermaid diagrams:
   - Mermaid **flowchart** — complete user flow
   - Mermaid **sequence diagram** — system interactions
   - Mermaid **ER diagram** — data model
   - Mermaid **use case diagram** — actor/system relationships
5. Save final output as `specs/NNN-feature-name/user-story.md`

> To convert into code, follow up with `-l` on the same feature.

---

## `-fix` Fix an Error Flow

**Agents involved:** `qa-debugger` → `backend-engineer` OR `frontend-engineer` → `code-reviewer`

1. **QA Debugger** reads error + relevant code, diagnoses root cause
2. **Mini plan** — explain what went wrong and how to fix it
3. **Backend/Frontend Engineer** implements fix
4. **Code Reviewer** verifies fix
5. **Verify** — confirm error is resolved
6. **Update** `tasks.md` if a task was involved

> If the same approach fails twice, stop, diagnose root cause, try a fundamentally different approach.

---

## `-ask` Read Code & Answer / Explain Flow

**Read-only. Never modify any file.**

**Agents:**
- `.cursor/agents/domain-expert.md` — for business/domain/hiring logic questions
- `.cursor/agents/backend-engineer.md` OR `.cursor/agents/frontend-engineer.md` — for code questions

1. **Read** all relevant code files related to the question
2. **Answer** based on actual code — no assumptions
3. **Show complete flow** — trace end to end (use Mermaid diagrams if helpful)
4. **Scan for issues** — flag anything broken:
   ```
   ⚠️ Issue found: [file:line] — [what is broken]
   Suggested fix: use `-fix [description]` or `-s [description]`
   ```
5. **No changes made**

---

## `-update` Update an MD File Flow

1. User specifies which file + what to change
2. **Read** the current file
3. **Ask** 1-2 questions if unclear
4. **Update** the file
5. If change affects `spec.md` or `plan.md` → ask: "This may affect tasks.md. Regenerate it?"

---

## `-review` Code Review Flow

**Read-only. Never modify any file.**

**Agent:** `code-reviewer`

1. **Read** all changed/relevant files
2. **Check against spec** — does code match what was specified?
3. **Flag issues:**
   - 🐛 Bug
   - 🔒 Security
   - 🧹 Bad pattern / code smell
   - ⚡ Performance concern
   - 📋 Spec mismatch
4. **Summary** — Ready to merge / Needs fixes
5. User uses `-fix` or `-s` to act on findings

---

## `-test` Write Tests Flow

**Speckit skill used:** `speckit-checklist` (to validate test coverage requirements before writing)

**Agent:** `backend-engineer` OR `frontend-engineer`

1. **Read** the target code
2. Read and follow `.cursor/skills/speckit-checklist/SKILL.md` exactly — generate a test coverage checklist
3. **Plan** — list what tests are needed based on checklist
4. **Write tests** — follow existing test framework
5. **Verify** tests run and pass

---

## `-refactor` Refactor Flow

**Agents:** `backend-engineer` OR `frontend-engineer` → `code-reviewer`

1. **Read** the target code
2. **Plan** — what changes and why (no behavior change)
3. **Ask** 1-2 questions if scope unclear
4. **Refactor**
5. **Code Reviewer** verifies no behavior change
6. **Verify** — existing tests still pass

---

## `-db` Database Task Flow

**Agent:** `backend-engineer`

1. **Read** existing schema, migrations, seeders
2. **Plan** — list exact DB changes
3. **Ask** if destructive (always requires confirmation)
4. **Implement** — migrations first, then seeders
5. **Verify** — migrations run cleanly

> ⚠️ Destructive operations (drop table, remove column) require explicit user confirmation.

---

## `-doc` Documentation Flow

**Agent:** `backend-engineer` OR `frontend-engineer`

1. **Read** target code
2. **Generate or update** README, API docs, inline comments
3. **Store** in `docs/` or alongside code

---

## `-perf` Performance Investigation Flow

**Agent:** `backend-engineer` OR `frontend-engineer` → `code-reviewer`

1. **Read** target code
2. **Identify** bottlenecks — N+1 queries, blocking calls, missing indexes, etc.
3. **Report** with severity (🔴 Critical / 🟡 Medium / 🟢 Minor)
4. **Ask** user: "Apply optimizations?" — wait for confirmation
5. If yes → implement, verify behavior unchanged

---

## `-sec` Security Audit Flow

**Read-only by default.**

**Agent:** `code-reviewer`

1. **Read** target code
2. **Scan** for: SQL injection, auth gaps, exposed secrets, missing validation, CORS issues
3. **Report** with severity (🔴 Critical / 🟡 Medium / 🟢 Minor)
4. **Ask** user: "Fix critical issues?" — wait for confirmation
5. If yes → use `-fix` flow

---

## `-env` Environment Check Flow

**Read-only.**

**Agents:** `backend-engineer` + `frontend-engineer`

1. **Read** `.env`, config files, `package.json`/`pyproject.toml`
2. **Check** for missing vars, mismatches, unused keys, version conflicts
3. **Report** findings, suggest `-fix` or `-s`

---

## `-sync` Frontend ↔ Backend Sync Check Flow

**Read-only.**

**Agents:** `backend-engineer` + `frontend-engineer`

1. **Backend Engineer** reads API routes and response shapes
2. **Frontend Engineer** reads API calls and types
3. **Compare** — flag endpoint, shape, type mismatches
4. **Report** with file + line references
5. Suggest `-fix` or `-update`

---

## `-polish` Polish Raw Doc Flow

**Purpose:** Turn a rough file from `raw_docs/` into a clean, structured doc in `docs/`. Only writes when user is fully satisfied.

**Primary targets (always update these if content is relevant):**
1. `docs/agent-map.md`
2. `docs/agent-system-overview.md`
3. `docs/product-roadmap.md`
4. `docs/project-structure.md`

**Agent selection — auto-detected from content:**
| Content type | Agent |
|---|---|
| DB schema, tables, migrations | `.cursor/agents/database-engineer.md` |
| Feature/product requirements, roadmap | `.cursor/agents/product-manager.md` |
| ATS/hiring domain rules, business logic | `.cursor/agents/domain-expert.md` |
| Architecture, system design, API contracts | `.cursor/agents/architect.md` |
| Backend implementation notes | `.cursor/agents/backend-engineer.md` |
| Frontend/UI notes | `.cursor/agents/frontend-engineer.md` |

**Output target — auto-detected from content:**
| Content type | Target in `docs/` |
|---|---|
| DB schema / architecture | `docs/architecture/` |
| Feature decisions | `docs/decisions/` |
| MVP tables / product roadmap | `docs/product-roadmap.md` |
| Code/QA reviews | `docs/reviews/` |
| Sync/parity reports | `docs/sync-reports/` |
| Agent/workflow docs | `docs/agent-map.md` or `docs/agent-system-overview.md` |
| Project structure | `docs/project-structure.md` |

**Execution:**

1. **Read** the raw doc file the user points to in `raw_docs/`
2. **Detect** content type → select the right agent + output target
3. **Tell user:** "I'll use `[agent]` and write the clean doc to `[target]`. OK?" — wait for confirmation
4. **Analyze** the raw doc as the selected agent:
   - What is clear and good → keep
   - What is vague or missing → ask user (max 5 questions, one at a time)
   - What is redundant → flag for removal
   - What contradicts existing docs → flag and resolve with user
   - What should be added based on Wellfound parity / industry standards → suggest
5. **Interactive discussion** — go back and forth until user explicitly says "satisfied", "done", "write it", or "proceed"
6. **Only after user is satisfied** → write the clean doc to the confirmed target in `docs/`
7. **After writing** → check if `docs/agent-map.md`, `docs/agent-system-overview.md`, `docs/product-roadmap.md`, or `docs/project-structure.md` need updating based on the new content — if yes, update them too
8. **Report:** "Clean doc written to `[path]`. Updated primary docs: [list]."

> ⚠️ Never write to `docs/` until user explicitly signals satisfaction. Never write based on "ok" mid-discussion — only on final approval.

---

## `-doc-sync-b` Backend Docs Sync Flow

**Purpose:** Read all backend code and existing docs, update `docs/` to reflect current backend reality.

**Agents:** `.cursor/agents/backend-engineer.md` + `.cursor/agents/database-engineer.md`

1. **Read** the following files across all modules in `backend/app/modules/<module>/`:
   - `models/schema.py` — DB table definitions (SQLModel)
   - `models/reqs.py` — request schemas (Pydantic)
   - `models/res.py` — response schemas (Pydantic)
   - `routes/route.py` (and any `*_routes.py`) — API endpoints, HTTP methods, paths
2. **Read** `backend/alembic/versions/` — all migrations
3. **Read** all existing `docs/` files
4. **Compare** — flag stale, missing, outdated content vs actual backend code:
   - DB tables in `schema.py` not documented in `docs/architecture/`
   - API endpoints in `routes/` not documented
   - Request/response shapes changed in `reqs.py`/`res.py` vs docs
   - Migrations applied but not reflected in docs
5. **Report findings** to user:
   ```
   📄 Stale: docs/architecture/X.md — table Y no longer exists in schema.py
   📄 Missing: docs/architecture/ — module Z has no architecture doc
   📄 Outdated: docs/product-roadmap.md — feature marked Planned is now Done
   ```
6. **Ask:** "Update all flagged docs? (yes/no or list specific ones)" — wait for confirmation
7. **Update** only confirmed docs
8. **Report** — files updated + one-line summary per file

> ⚠️ Never update docs without user confirmation. Never delete content without flagging first.

---

## `-doc-sync-f` Frontend Docs Sync Flow

**Purpose:** Read all frontend code and existing docs, update `docs/` to reflect current frontend reality.

**Agent:** `.cursor/agents/frontend-engineer.md`

1. **Read** `frontend/src/` — pages, components, features, routes
2. **Read** all existing `docs/` files
3. **Compare** — flag stale, missing, outdated content vs actual frontend code
4. **Report findings** to user (same format as `-doc-sync-b`)
5. **Ask:** "Update all flagged docs? (yes/no or list specific ones)" — wait for confirmation
6. **Update** only confirmed docs
7. **Report** — files updated + one-line summary per file

> ⚠️ Never update docs without user confirmation. Never delete content without flagging first.

---

## `-g` Git Flow

**No agents — pure git operations.**

1. **Validate** branch with `speckit-git-validate`
   - On feature branch → skip creation
   - On `main` → create feature branch with `speckit-git-feature`
2. `git add .`
3. `git commit` with descriptive message
4. `git push -u origin <branch>`
5. `gh pr create` — PR to `main` with title + description
6. Report PR URL

> ⚠️ Never pushes directly to `main`.

---

## `-help` Show Available Commands

| Trigger | What it does |
|---------|-------------|
| `-d` | Expert discussion — explore features, get suggestions, read-only |
| `-l` | Full feature build — speckit + 4 agents |
| `-s` | Small task — mini plan + todo + implement |
| `-q` | Quick task — single focused change, no planning |
| `-us` | User story — actors, stories, acceptance criteria, Mermaid diagrams |
| `-fix` | Diagnose and fix an error |
| `-update` | Update an existing md file |
| `-ask` | Read code and explain how something works, flags broken things |
| `-review` | Code review — flags bugs, security issues, bad patterns (read-only) |
| `-test` | Write unit/integration tests for existing code |
| `-refactor` | Refactor code without changing behavior |
| `-db` | Database work — migrations, schema changes, seeders |
| `-g` | Create branch, commit, push, open PR to main |
| `-polish` | Polish a raw_docs/ file into a clean doc in docs/ |
| `-doc-sync-b` | Read backend code + docs, update docs to match backend reality |
| `-doc-sync-f` | Read frontend code + docs, update docs to match frontend reality |
| `-help` | Show this list |

---

## Auto-Review + Auto-Fix Rule

After completing any `-s`, `-q`, `-l`, or `-lf` task, automatically run the following pipeline without waiting for user instruction:

1. **`-review`** — run a full code review on all changed files
2. **Evaluate results:**
   - If 🔴 Critical or 🟡 Medium issues found → automatically run `-fix` for each one
   - 🟢 Minor issues → report only, do not fix automatically
3. **After all fixes applied** → re-run `-review` once to confirm issues are resolved
4. **Report final status** to user:
   ```
   ✅ Auto-review complete. X critical/medium issues found and fixed. Y minor issues reported.
   ```

> This pipeline runs automatically. The user does NOT need to trigger it manually.

---

## Git Rules

- **NO git commands** unless the user explicitly says to or uses `-g`
- Never auto-commit, auto-push, or create branches on your own

---

## Parallel Execution Rules

- `backend-engineer` + `frontend-engineer` always run in parallel during `-l`
- `[P]` tasks in `tasks.md` run in parallel
- Never parallelize tasks that share file dependencies

---

## General Rules

- Always read existing code before writing new code
- Match the project's existing style, conventions, and libraries
- Never add features beyond what was asked
- If an approach fails twice, diagnose root cause and switch approaches
- Keep end-of-task summaries brief
- No git operations unless explicitly instructed
- **Read-only triggers** (`-d`, `-ask`, `-review`, `-sec`, `-env`, `-sync`, `-perf`) — NEVER modify any file
