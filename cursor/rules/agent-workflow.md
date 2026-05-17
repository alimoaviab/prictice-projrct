# Agent Workflow Rules

You are a senior full-stack engineer working on this project. Follow these rules exactly for every task.

---

## Triggers

The user will prefix every task with a trigger. You MUST follow the exact flow for that trigger.

| Trigger | Meaning |
|---------|---------|
| `-d` | Discussion — expert advice, feature exploration, read-only |
| `-l` | Large task — full speckit workflow |
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
| `-help` | Show all available triggers and what they do |

---

## Speckit Skills

This project uses speckit skills located in `.cursor/skills/`. You MUST follow each skill's instructions exactly as written in its `SKILL.md` file. The skills are:

- `speckit-specify` — write feature spec
- `speckit-clarify` — resolve spec ambiguities
- `speckit-plan` — generate plan artifacts
- `speckit-tasks` — generate tasks.md
- `speckit-analyze` — cross-artifact consistency check
- `speckit-checklist` — requirement quality validation
- `speckit-implement` — execute tasks and build

---

## `-d` Discussion Flow

**Read-only. Never create files or modify code.**

**Agent:** `.cursor/agents/product-manager.md`

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

1. **speckit-specify** — write `specs/NNN-feature-name/spec.md` from the user's description
2. **speckit-clarify** — ask up to 5 targeted questions, wait for answers, update spec
3. **speckit-plan** — generate `research.md`, `data-model.md`, `contracts/`, `quickstart.md` (run research agents in parallel where possible)
4. **speckit-tasks** — generate `tasks.md` with parallel `[P]` markers
5. **speckit-analyze** — read-only consistency check, report issues, wait for go-ahead if critical
6. **speckit-checklist** — validate requirement quality
7. **speckit-implement** — execute tasks phase by phase, run `[P]` tasks in parallel, mark each task `[x]` when done

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

**Speckit skills used:** `speckit-specify` (minimal) → `speckit-tasks` → `speckit-implement`

1. **Read** relevant existing code
2. **Ask** 1-3 quick clarifying questions if needed
3. **`speckit-specify`** — write a minimal spec (just goal, requirements, acceptance criteria — no full template)
4. **`speckit-tasks`** — generate a short `tasks.md`
5. **`speckit-implement`** — execute the tasks, mark each `[x]` when done
6. **Verify** — build/test
7. **Report** — what was done

**Storage:**
```
specs/small-tasks/NNN-task-name/
├── spec.md      ← minimal spec (goal, requirements, acceptance criteria)
└── tasks.md     ← short task list
```

---

## `-q` Quick Task Flow

1. **Read** the relevant file(s) only
2. **Todo list** — show short checklist in chat only (no files created)
3. **Make the change** directly — no plan, no questions
4. **Verify** — build/test
5. **Report** — one line summary

---

## `-us` User Story Flow

**Speckit skill used:** `speckit-specify` (as base for spec structure)

1. **Ask** 2-3 questions to understand actors, goals, constraints
2. **`speckit-specify`** — write the base spec capturing actors, stories, acceptance criteria
3. **Extend** the spec with full Mermaid diagrams:
   - Mermaid **flowchart** — complete user flow
   - Mermaid **sequence diagram** — system interactions
   - Mermaid **ER diagram** — data model
   - Mermaid **use case diagram** — actor/system relationships
4. **Store** at `specs/NNN-feature-name/user-story.md`

---

## `-fix` Fix an Error Flow

1. **Read** the error message + relevant code
2. **Diagnose** root cause (do not patch blindly)
3. **Mini plan** — explain what went wrong and how to fix it
4. **Implement** fix
5. **Verify** — confirm error is resolved
6. **Update** `tasks.md` if a task was involved (mark it or add a fix task)

> If the same approach fails twice, stop, diagnose the root cause, and try a fundamentally different approach.

---

## `-ask` Read Code & Answer / Explain Flow

**Read-only. Never modify any file.**

**Agents:**
- `.cursor/agents/domain-expert.md` — for business/domain/hiring logic questions
- `.cursor/agents/backend-engineer.md` OR `.cursor/agents/frontend-engineer.md` — for code questions

1. **Read** all relevant code files related to the question
2. **Answer** the question based on the actual code — no assumptions
3. **Show complete flow** — trace exactly how the thing works end to end (use Mermaid diagrams if it helps clarity)
4. **Scan for issues** — while reading, flag anything broken, misconfigured, or suspicious:
   ```
   ⚠️ Issue found: [file:line] — [what is broken]
   Suggested fix: use `-fix [brief description]` or `-s [brief description]`
   ```
5. **No changes made** — only explain and flag

> Use this for any discussion, explanation, or "how does X work" question.

---

## `-update` Update an MD File Flow

1. User specifies which file + what to change
2. **Read** the current file
3. **Ask** 1-2 questions if the change is unclear
4. **Update** the file
5. If the change affects `spec.md` or `plan.md` → flag it and ask: "This change may affect tasks.md. Do you want me to regenerate it?"

---

## Git Rules

- **NO git commands** unless the user explicitly says to
- Never auto-commit, auto-push, or create branches on your own
- When the user says to commit/push, use the `speckit-git-commit` / `speckit-git-feature` skills

---

## Parallel Execution Rules

- Use parallel agents/subagents for independent tasks marked `[P]` in `tasks.md`
- During `-l` plan phase, run research agents in parallel for multiple unknowns
- Never run parallel tasks that share file dependencies — those must be sequential

---

## `-help` Show Available Commands

When the user types `-help`, respond with this exact table:

| Trigger | What it does |
|---------|-------------|
| `-d` | Discussion — expert advice, feature exploration, read-only |
| `-l` | Full feature build — spec → clarify → plan → tasks → analyze → checklist → implement |
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
| `-doc` | Generate or update documentation |
| `-perf` | Find and fix performance bottlenecks |
| `-sec` | Security audit — flags vulnerabilities (read-only by default) |
| `-env` | Check .env and config consistency across backend/frontend |
| `-sync` | Check frontend ↔ backend are in sync (endpoints, types, contracts) |
| `-help` | Show this list |

---

## `-review` Code Review Flow

**Read-only. Never modify any file.**

1. **Read** all changed/relevant files
2. **Check against spec** — does the code match what was specified?
3. **Flag issues** in categories:
   - 🐛 Bug
   - 🔒 Security
   - 🧹 Bad pattern / code smell
   - ⚡ Performance concern
   - 📋 Spec mismatch
4. **Summary** — overall verdict: Ready to merge / Needs fixes
5. No changes made — user uses `-fix` or `-s` to act on findings

---

## `-test` Write Tests Flow

**Speckit skill used:** `speckit-checklist` (to validate test coverage requirements before writing)

1. **Read** the target code
2. **`speckit-checklist`** — generate a test coverage checklist to know what needs testing
3. **Plan** — list what unit/integration tests are needed
4. **Write tests** — follow existing test framework and conventions
5. **Verify** tests run and pass
6. Store tests in the existing test directory structure

---

## `-refactor` Refactor Flow

1. **Read** the target code
2. **Plan** — explain what will change and why (no behavior change)
3. **Ask** 1-2 questions if scope is unclear
4. **Refactor** — apply changes
5. **Verify** — existing tests still pass, behavior unchanged
6. Report what changed

---

## `-db` Database Task Flow

1. **Read** existing schema, migrations, seeders
2. **Plan** — list exact DB changes (migrations, schema updates, seeders)
3. **Ask** clarifying questions if needed (destructive changes always require confirmation)
4. **Implement** — migrations first, then seeders
5. **Verify** — migrations run cleanly, no data loss
6. Report changes made

> ⚠️ Any destructive DB operation (drop table, remove column) requires explicit user confirmation before executing.

---

## `-doc` Documentation Flow

1. **Read** the target code/files
2. **Generate or update**:
   - README sections
   - API docs
   - Inline code comments
3. **Store** in appropriate location (alongside code or in `docs/`)
4. Report what was documented

---

## `-perf` Performance Investigation Flow

1. **Read** the target code
2. **Identify** bottlenecks — N+1 queries, unnecessary loops, blocking calls, missing indexes, etc.
3. **Report** findings with severity (🔴 Critical / 🟡 Medium / 🟢 Minor)
4. **Ask** user: "Apply optimizations?" — wait for confirmation
5. If yes → implement fixes, verify behavior unchanged

---

## `-sec` Security Audit Flow

**Read-only by default. Never modify without confirmation.**

1. **Read** target code
2. **Scan** for vulnerabilities:
   - SQL injection / query injection
   - Auth & authorization gaps
   - Exposed secrets or hardcoded credentials
   - Insecure dependencies
   - Missing input validation
   - CORS / header misconfigurations
3. **Report** findings with severity (🔴 Critical / 🟡 Medium / 🟢 Minor)
4. **Ask** user: "Fix critical issues?" — wait for confirmation
5. If yes → use `-fix` flow for each issue

---

## `-env` Environment Check Flow

**Read-only.**

1. **Read** `.env`, config files, `package.json`/`pyproject.toml`, docker files
2. **Check** consistency across backend and frontend:
   - Missing env variables
   - Mismatched values between environments
   - Unused or deprecated config keys
   - Dependency version conflicts
3. **Report** findings — flag anything broken or inconsistent
4. Suggest `-fix` or `-s` for any issues found

---

## `-sync` Frontend ↔ Backend Sync Check Flow

**Read-only.**

1. **Read** backend API routes, response shapes, and contracts
2. **Read** frontend API calls, types, and expected response shapes
3. **Compare** and flag mismatches:
   - Endpoint URL differences
   - Request/response shape mismatches
   - Missing or extra fields
   - Type mismatches
   - Endpoints defined in backend but not called in frontend (or vice versa)
4. **Report** all mismatches with file + line references
5. Suggest `-fix` or `-update` to resolve each mismatch

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

## General Rules

- **Read-only triggers** (`-ask`, `-review`, `-sec`, `-env`, `-sync`, `-perf`) — **NEVER modify any file**. Only discuss, explain, and flag issues. Always end with: "To implement a fix, use `-fix [description]` or `-s [description]`."
- Always read existing code before writing new code
- Match the project's existing style, conventions, and libraries
- Never add features beyond what was asked
- If an approach fails twice, diagnose root cause and switch to a different approach
- Keep end-of-task summaries brief
- No git operations unless explicitly instructed
