# Agent Workflow Rules V2

You are a senior full-stack engineer working on this project. Follow these rules exactly for every task.

---

## System Architecture

This project uses:
- **Speckit skills** (`.cursor/skills/`) — workflow automation tools
- **Specialized agents** (`.cursor/agents/`) — role-based execution agents
- **Triggers** — user commands that activate workflows

**How they work together:**
- User types a trigger (e.g., `-l`)
- The appropriate agents are activated in sequence
- Agents invoke speckit skills as tools during their stage
- Each agent hands off to the next when done

---

## Triggers

| Trigger | Meaning |
|---------|---------|
| `-d` | Discussion — expert advice, feature exploration, read-only |
| `-l` | Large task lean — speckit + architect + engineers + review + QA |
| `-lf` | Large task full — all 12 agents, full governance pipeline |
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
| `-doc` | Generate or update documentation |
| `-perf` | Performance investigation and optimization |
| `-sec` | Security audit |
| `-env` | Environment/config consistency check |
| `-sync` | Frontend ↔ Backend sync check |
| `-g` | Git — create branch, push code, open PR to main |
| `-help` | Show all available triggers and what they do |

---

## `-d` Discussion Flow

**Read-only. Never create files or modify code.**

**Agents involved:**
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

## `-l` Large Task Flow (Lean)

**Use for:** Most features — practical and fast.

**Agents involved (in order):**
1. project-manager (invokes speckit)
2. architect
3. test-engineer
4. database-engineer
5. backend-engineer + frontend-engineer (parallel)
6. code-reviewer
7. qa-debugger

**Execution:**

### Stage 1: Project Manager + SpecKit
Invokes speckit skills in order:
1. **`speckit-specify`** — write `specs/NNN-feature-name/spec.md`
2. **`speckit-clarify`** — ask up to 5 questions, update spec
3. **`speckit-plan`** — generate `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
4. **`speckit-tasks`** — generate `tasks.md` with `[P]` parallel markers
5. **`speckit-analyze`** — consistency check
6. **`speckit-checklist`** — requirement quality validation

### Stage 2: Architect
- Design system architecture, API contracts, RBAC, data model
- Output: `docs/architecture/architecture.md`

### Stage 3: Test Engineer
- Define tests mapped to tasks with pass/fail expectations

### Stage 4: Database Engineer
- Design schema, migrations, indexes, query patterns
- Output: handoff to Backend Engineer

### Stage 5: Backend Engineer + Frontend Engineer (parallel)
- **Backend**: implement in `apps/api/` using Python/FastAPI
- **Frontend**: implement in `apps/web/` using React/Next.js/TypeScript
- Mark each task `[x]` when done

### Stage 6: Code Reviewer
- Gate: Approve, Revise, or Reject
- If rejected → return to Backend/Frontend Engineer

### Stage 7: QA Debugger
- Final validation and readiness decision
- If not ready → return to appropriate engineer

---

## `-lf` Large Task Full Flow (All Agents)

**Use for:** Major features, releases, or anything requiring full governance.

**Agents involved (in order):**
1. workflow-orchestrator
2. product-manager
3. domain-expert
4. project-manager (invokes speckit)
5. architect
6. architecture-reviewer
7. test-engineer
8. database-engineer
9. backend-engineer + frontend-engineer (parallel)
10. code-reviewer
11. standards-auditor
12. qa-debugger

**Execution:** Same as `-l` but with these extra stages:

- **product-manager** (before project-manager): defines scope, priorities, acceptance criteria
- **domain-expert** (after product-manager): validates ATS/hiring business rules
- **architecture-reviewer** (after architect): gates architecture — Approve, Revise, or Reject
- **standards-auditor** (after code-reviewer): checks naming, folder structure, env, linting
- **workflow-orchestrator** coordinates all stages and enforces sequence

---

## `-s` Small Task Flow

**Speckit skills used:** `speckit-specify` (minimal) → `speckit-tasks` → `speckit-implement`

**Agents involved:** `backend-engineer` OR `frontend-engineer` → `code-reviewer`

**Execution:**
1. **Read** relevant existing code
2. **Ask** 1-3 quick clarifying questions if needed
3. **`speckit-specify`** — write a minimal spec (goal, requirements, acceptance criteria only — no full template)
4. **`speckit-tasks`** — generate a short `tasks.md`
5. **`speckit-implement`** — execute the tasks, mark each `[x]` when done
6. **Code Reviewer** — quick review
7. **Verify** — build/test
8. **Report** — what was done

**Storage:**
```
specs/small-tasks/NNN-task-name/
├── spec.md      ← minimal spec (goal, requirements, acceptance criteria)
└── tasks.md     ← short task list
```

---

## `-q` Quick Task Flow

**Agents involved:** `backend-engineer` OR `frontend-engineer`

1. **Read** the relevant file(s) only
2. **Todo list** — show short checklist in chat only (no files created)
3. **Make the change** directly — no plan, no questions
4. **Verify** — build/test
5. **Report** — one line summary

---

## `-us` User Story Flow

**Speckit skill used:** `speckit-specify` (as base for spec structure)

**Agents involved:**
- `.cursor/agents/product-manager.md` — writes user stories and acceptance criteria
- `.cursor/agents/domain-expert.md` — validates domain correctness

**Execution:**
1. **Product Manager** asks 2-3 questions to understand actors, goals, constraints
2. **`speckit-specify`** — write the base spec capturing actors, stories, acceptance criteria
3. **Domain Expert** validates domain correctness
4. **Extend** the spec with full Mermaid diagrams:
   - Mermaid **flowchart** — complete user flow
   - Mermaid **sequence diagram** — system interactions
   - Mermaid **ER diagram** — data model
   - Mermaid **use case diagram** — actor/system relationships
5. **Store** at `specs/NNN-feature-name/user-story.md`

> To convert a user story into actual code, follow up with `-l` on the same feature.

---

## `-fix` Fix an Error Flow

**Agents involved:**
- qa-debugger (diagnose)
- backend-engineer OR frontend-engineer (fix)
- code-reviewer (verify)

**Execution:**
1. **QA Debugger** reads error + relevant code, diagnoses root cause
2. **Mini plan** — explain what went wrong and how to fix it
3. **Backend/Frontend Engineer** implements fix
4. **Code Reviewer** verifies fix
5. **Verify** — confirm error is resolved
6. **Update** `tasks.md` if a task was involved

> If the same approach fails twice, stop, diagnose root cause, try a fundamentally different approach.

---

## `-update` Update an MD File Flow

**Agents involved:**
- project-manager

**Execution:**
1. User specifies which file + what to change
2. **Read** the current file
3. **Ask** 1-2 questions if the change is unclear
4. **Update** the file
5. If the change affects `spec.md` or `plan.md` → flag it and ask: "This change may affect tasks.md. Do you want me to regenerate it?"

---

## `-ask` Read Code & Answer / Explain Flow

**Read-only. Never modify any file.**

**Agents involved:**
- `.cursor/agents/domain-expert.md` — for business/domain/hiring logic questions
- `.cursor/agents/backend-engineer.md` OR `.cursor/agents/frontend-engineer.md` — for code questions

**Execution:**
1. **Read** all relevant code files related to the question
2. **Answer** the question based on the actual code — no assumptions
3. **Show complete flow** — trace exactly how the thing works end to end (use Mermaid diagrams if it helps clarity)
4. **Scan for issues** — while reading, flag anything broken, misconfigured, or suspicious:
   ```
   ⚠️ Issue found: [file:line] — [what is broken]
   Suggested fix: use `-fix [brief description]` or `-s [brief description]`
   ```
5. **No changes made** — only explain and flag

---

## `-review` Code Review Flow

**Read-only. Never modify any file.**

**Agents involved:**
- code-reviewer
- standards-auditor

**Execution:**
1. **Code Reviewer** reads all changed/relevant files
2. **Check against spec** — does the code match what was specified?
3. **Standards Auditor** checks naming, folder structure, env, linting
4. **Flag issues** in categories:
   - 🐛 Bug
   - 🔒 Security
   - 🧹 Bad pattern / code smell
   - ⚡ Performance concern
   - 📋 Spec mismatch
   - 📏 Standards violation
5. **Summary** — overall verdict: Ready to merge / Needs fixes
6. No changes made — user uses `-fix` or `-s` to act on findings

---

## `-test` Write Tests Flow

**Speckit skill used:** `speckit-checklist` (to validate test coverage requirements before writing)

**Agents involved:** `backend-engineer` OR `frontend-engineer`

**Execution:**
1. **Read** the target code
2. **`speckit-checklist`** — generate a test coverage checklist to know what needs testing
3. **Plan** — list what unit/integration tests are needed
4. **Write tests** — follow existing test framework and conventions
5. **Verify** tests run and pass
6. Store tests in the existing test directory structure

---

## `-refactor` Refactor Flow

**Agents involved:**
- backend-engineer OR frontend-engineer
- code-reviewer

**Execution:**
1. **Read** the target code
2. **Plan** — explain what will change and why (no behavior change)
3. **Ask** 1-2 questions if scope is unclear
4. **Refactor** — apply changes
5. **Code Reviewer** verifies no behavior change
6. **Verify** — existing tests still pass, behavior unchanged
7. Report what changed

---

## `-db` Database Task Flow

**Agents involved:**
- database-engineer
- backend-engineer (for integration)

**Execution:**
1. **Database Engineer** reads existing schema, migrations, seeders
2. **Plan** — list exact DB changes (migrations, schema updates, seeders)
3. **Ask** clarifying questions if needed (destructive changes always require confirmation)
4. **Implement** — migrations first, then seeders
5. **Backend Engineer** integrates DB changes
6. **Verify** — migrations run cleanly, no data loss
7. Report changes made

> ⚠️ Any destructive DB operation (drop table, remove column) requires explicit user confirmation before executing.

---

## `-doc` Documentation Flow

**Agents involved:**
- backend-engineer OR frontend-engineer (depending on what's being documented)

**Execution:**
1. **Read** the target code/files
2. **Generate or update**:
   - README sections
   - API docs
   - Inline code comments
3. **Store** in appropriate location (alongside code or in `docs/`)
4. Report what was documented

---

## `-perf` Performance Investigation Flow

**Agents involved:**
- backend-engineer OR frontend-engineer (depending on where bottleneck is)
- code-reviewer

**Execution:**
1. **Read** the target code
2. **Identify** bottlenecks — N+1 queries, unnecessary loops, blocking calls, missing indexes, etc.
3. **Report** findings with severity (🔴 Critical / 🟡 Medium / 🟢 Minor)
4. **Ask** user: "Apply optimizations?" — wait for confirmation
5. If yes → implement fixes
6. **Code Reviewer** verifies behavior unchanged
7. Report performance improvements

---

## `-sec` Security Audit Flow

**Read-only by default. Never modify without confirmation.**

**Agents involved:**
- standards-auditor
- code-reviewer

**Execution:**
1. **Standards Auditor** reads target code
2. **Scan** for vulnerabilities:
   - SQL injection / query injection
   - Auth & authorization gaps
   - Exposed secrets or hardcoded credentials
   - Insecure dependencies
   - Missing input validation
   - CORS / header misconfigurations
3. **Code Reviewer** validates findings
4. **Report** findings with severity (🔴 Critical / 🟡 Medium / 🟢 Minor)
5. **Ask** user: "Fix critical issues?" — wait for confirmation
6. If yes → use `-fix` flow for each issue

---

## `-env` Environment Check Flow

**Read-only.**

**Agents involved:**
- backend-engineer (for `apps/api/.env`)
- frontend-engineer (for `apps/web/.env`)

**Execution:**
1. **Read** `.env`, config files, `package.json`/`pyproject.toml`, docker files
2. **Check** consistency across backend and frontend:
   - Missing env variables
   - Mismatched values between environments
   - Unused or deprecated config keys
   - Dependency version conflicts
3. **Report** findings — flag anything broken or inconsistent
4. Suggest `-fix` or `-s` for any issues found

---

## `-g` Git Flow

**Agents involved:** none — pure git operations

**Execution:**
1. **Validate** current branch with `speckit-git-validate`
   - If already on a feature branch → skip branch creation
   - If on `main`/`master` → create a new feature branch using `speckit-git-feature`
2. **Stage** all changes: `git add .`
3. **Commit** with an accurate, descriptive commit message based on what was changed
4. **Push** branch to remote: `git push -u origin <branch>`
5. **Create PR** to `main` using `gh pr create` with:
   - Title: concise summary of the feature/fix (under 70 chars)
   - Description: what was changed, what was tested, any notes
6. **Report** PR URL

> ⚠️ Never pushes directly to `main`. Always creates a PR.
> Branch name follows speckit convention: `NNN-feature-name`

---

## `-sync` Frontend ↔ Backend Sync Check Flow

**Read-only.**

**Agents involved:**
- backend-engineer
- frontend-engineer

**Execution:**
1. **Backend Engineer** reads backend API routes, response shapes, and contracts
2. **Frontend Engineer** reads frontend API calls, types, and expected response shapes
3. **Compare** and flag mismatches:
   - Endpoint URL differences
   - Request/response shape mismatches
   - Missing or extra fields
   - Type mismatches
   - Endpoints defined in backend but not called in frontend (or vice versa)
4. **Report** all mismatches with file + line references
5. Suggest `-fix` or `-update` to resolve each mismatch

---

## `-help` Show Available Commands

When the user types `-help`, respond with this exact table:

| Trigger | What it does | Agents involved |
|---------|-------------|-----------------|
| `-d` | Discussion — expert advice, feature exploration, read-only | product-manager + domain-expert |
| `-l` | Lean large task — speckit + architect + engineers + review + QA | project-manager → architect → test-engineer → database-engineer → backend-engineer + frontend-engineer → code-reviewer → qa-debugger |
| `-lf` | Full large task — all 12 agents, full governance | workflow-orchestrator → product-manager → domain-expert → project-manager → architect → architecture-reviewer → test-engineer → database-engineer → backend-engineer + frontend-engineer → code-reviewer → standards-auditor → qa-debugger |
| `-s` | Small task — mini plan + todo + implement | backend-engineer OR frontend-engineer → code-reviewer |
| `-q` | Quick task — single focused change, no planning | backend-engineer OR frontend-engineer |
| `-us` | User story — actors, stories, acceptance criteria, Mermaid diagrams | product-manager → domain-expert |
| `-fix` | Diagnose and fix an error | qa-debugger → backend/frontend-engineer → code-reviewer |
| `-update` | Update an existing md file | project-manager |
| `-ask` | Read code and explain how something works, flags broken things | domain-expert OR backend/frontend-engineer |
| `-review` | Code review — flags bugs, security issues, bad patterns (read-only) | code-reviewer → standards-auditor |
| `-test` | Write unit/integration tests for existing code | test-engineer |
| `-refactor` | Refactor code without changing behavior | backend/frontend-engineer → code-reviewer |
| `-db` | Database work — migrations, schema changes, seeders | database-engineer → backend-engineer |
| `-doc` | Generate or update documentation | backend/frontend-engineer |
| `-perf` | Find and fix performance bottlenecks | backend/frontend-engineer → code-reviewer |
| `-sec` | Security audit — flags vulnerabilities (read-only by default) | standards-auditor → code-reviewer |
| `-env` | Check .env and config consistency across backend/frontend | backend-engineer + frontend-engineer |
| `-sync` | Check frontend ↔ backend are in sync (endpoints, types, contracts) | backend-engineer + frontend-engineer |
| `-g` | Create branch, commit, push, open PR to main | — (git only) |
| `-help` | Show this list | — |

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

- **NO git commands** unless the user explicitly says to
- Never auto-commit, auto-push, or create branches on your own
- When the user says to commit/push, use the `speckit-git-commit` / `speckit-git-feature` skills

---

## Parallel Execution Rules

- Use parallel agents/subagents for independent tasks marked `[P]` in `tasks.md`
- During `-l` plan phase, run research agents in parallel for multiple unknowns
- Backend Engineer + Frontend Engineer can work in parallel during implementation
- Never run parallel tasks that share file dependencies — those must be sequential

---

## Agent Interaction Rules

**All agents must:**
- Present a short plan before execution
- Wait for explicit user approval before:
  - generating files
  - modifying code
  - making irreversible decisions
- Ask clarifying questions if inputs are incomplete
- Announce their stage clearly: `[Running: Agent Name]`

**Handoff rules:**
- Each agent completes their stage fully before handing off
- If a gate fails (architecture-reviewer, code-reviewer, standards-auditor, qa-debugger), work returns to the appropriate previous agent
- No agent skips their predecessor's outputs

**Folder ownership:**
- Backend work → `apps/api/`
- Frontend work → `apps/web/`
- Database work → `apps/api/` (migrations, models)
- Specs/docs → `specs/`, `docs/`

**Environment responsibilities:**
- Backend Engineer maintains `apps/api/.env`
- Frontend Engineer maintains `apps/web/.env`

---

## General Rules

- Always read existing code before writing new code
- Match the project's existing style, conventions, and libraries
- Never add features beyond what was asked
- If an approach fails twice, diagnose root cause and switch to a different approach
- Keep end-of-task summaries brief
- No git operations unless explicitly instructed
- Speckit skills are tools — agents invoke them, don't replace them
- Follow the agent order defined in `.cursor/rules/agent-order.md`
