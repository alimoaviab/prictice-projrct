# Default Workflow Rule

## Purpose

Define the default end-to-end workflow for TechJobs.pk so all feature work follows the same stage order, approval checkpoints, and quality gates.

## Trigger Condition

Any user request that implies building, modifying, or creating a feature MUST activate the full workflow.

Examples:

* "Create authentication system"
* "Build job posting feature"
* "Add candidate dashboard"
* "Create ATS pipeline"
* "Implement employer onboarding"

These requests MUST be treated as:
"Run full TechJobs.pk workflow using Workflow Orchestrator"

## Default Behavior

* Automatically route all feature requests to the Workflow Orchestrator
* The Workflow Orchestrator MUST take control even if not explicitly invoked
* Default execution mode is continuous
* The workflow should continue stage by stage unless:

  * explicit approval is required
  * a blocking failure occurs
  * the user interrupts or changes direction

## Mandatory Workflow Order

1. Product Manager
2. Domain Expert
3. Project Manager
4. SpecKit (`spec.md` -> `plan.md` -> `tasks.md`)
5. Architect
6. Architecture Reviewer
7. Test Engineer
8. Database Engineer
9. Backend Engineer + Frontend Engineer
10. Code Reviewer
11. Standards Audit Agent
12. QA Debugger

## Stage Execution Rules

* Every stage MUST present a short execution plan before acting
* Every stage MUST request explicit user approval before irreversible actions
* No stage may start unless the prior stage is marked approved
* If a gate fails, workflow MUST roll back to the responsible stage
* Project Manager coordinates all rework loops and re-entry approvals
* The active stage MUST always be clearly announced
* Stage announcements MUST use this exact format:
  * `[Running: Product Manager]`
  * `[Running: Domain Expert]`
  * `[Running: Project Manager]`
  * `[Running: Architect]`
  * `[Running: Architecture Reviewer]`
  * `[Running: Test Engineer]`
  * `[Running: Database Engineer]`
  * `[Running: Backend Engineer]`
  * `[Running: Frontend Engineer]`
  * `[Running: Code Reviewer]`
  * `[Running: Standards Audit Agent]`
  * `[Running: QA Debugger]`
* Stage ownership MUST be respected:
  * Code Reviewer, Standards Audit Agent, and QA Debugger stages must primarily report findings/validation outcomes
  * These review/validation stages must not perform broad feature implementation unless explicit user approval is provided for a targeted fix
* Do not create extra artifacts outside approved stage outputs; if additional files are needed, state why and request approval first

## Folder Ownership

* Database Engineer, Backend Engineer must implement server-side work inside `apps/api/`
* Frontend Engineer must implement client-side work inside `apps/web/`

## Environment File Ownership

* Database Engineer and Backend Engineer must maintain backend-safe configuration in `apps/api/.env`
* Frontend Engineer must create and maintain `apps/web/.env`
* Backend environment configuration should include:
  * runtime/app settings
  * database settings
  * auth settings
  * service configuration
* Frontend environment configuration should include:
  * frontend app URL
  * backend API base URL
  * public runtime variables as needed

## Frontend Visual Reference Rule

* Frontend Engineer must use user-provided screenshots/images as design references when supplied
* Frontend Engineer must preserve layout and UX intent from provided references
* Improved or adjusted color grading is allowed when requested
* Frontend implementation must remain responsive, component-based, and production-ready
* Frontend Engineer must use Stitch MCP as the primary UI generation/editing path when Stitch MCP is available
* If Stitch MCP is unavailable (connection/auth/tool failure), the workflow must pause frontend completion and explicitly report the blocker; do not silently bypass this rule

## Backend Stack Baseline

* TechJobs.pk backend must use Python + FastAPI as the default stack
* Any deviation from Python + FastAPI requires:
  1. explicit user approval
  2. documented rationale in project artifacts

## SpecKit Boundary

* SpecKit is authoritative for feature planning artifacts:

  * `spec.md`
  * `plan.md`
  * `tasks.md`
* SpecKit ends at `tasks.md`
* `/speckit-implement` is not part of the default workflow
* After `tasks.md` is approved, downstream execution is handled by the agent workflow

## Gate Enforcement

* No implementation before architecture is formally approved
* No coding before test definitions are complete and task-mapped
* No QA before Code Reviewer and Standards Audit Agent stages complete
* No merge or release progression without QA Debugger final decision
* Frontend stage is incomplete if Stitch MCP-required work is requested but Stitch MCP execution evidence is missing

## Artifact Alignment Rule

All implementation, testing, and review activities MUST align with the latest approved:

* `spec.md`
* `plan.md`
* `tasks.md`
* `architecture.md`

Unapproved divergence is prohibited.

## Approval Policy

* Normal stage-to-stage progression should continue automatically
* Explicit approval is required when:

  * architecture is unclear or disputed
  * destructive changes are required
  * a gate fails and rework changes the approved scope
  * user-facing or security-critical behavior is being altered significantly

## Override Policy

* No silent overrides between agents
* No agent may reinterpret, bypass, or replace another agent’s output without:

  1. explicit user approval
  2. documented rationale in project artifacts

## Orchestrator Enforcement

* The Workflow Orchestrator is the primary controller of this workflow
* If a feature request is detected, control MUST be transferred to the Workflow Orchestrator
* All agents must operate only within orchestrated flow
* Direct execution without orchestrator control is prohibited for feature-level work

## Expected Runtime Behavior

When a feature request is received, the system should behave like this:

1. Activate Workflow Orchestrator
2. Announce the workflow plan
3. Begin Product Manager stage
4. Continue through all required stages in order
5. Stop only when:

   * user approval is required
   * a gate fails
   * workflow completes

## Enforcement Summary

This rule is the default operating behavior for all feature delivery in TechJobs.pk.
Any agent, stage, or workflow that conflicts with this rule is non-compliant unless explicitly approved by the user.
