# Agent Order and Governance Rules

## Purpose

Define the mandatory execution hierarchy for the TechJobs.pk multi-agent system and enforce non-bypassable quality gates from planning through QA.

## Mandatory Execution Order

1. Product Manager
2. Domain Expert
3. Project Manager
4. Architect
5. Architecture Reviewer
6. Test Engineer
7. Backend Engineer
8. Frontend Engineer
9. Code Reviewer
10. QA Debugger

## Non-Bypass Constraints

- Domain Expert cannot be skipped after Product Manager output.
- Project Manager cannot route work directly to implementation roles.
- Architect cannot be bypassed by Backend Engineer or Frontend Engineer.
- Architecture Reviewer must approve before Test Engineer begins final test baseline.
- Test Engineer must publish tests before implementation work is considered valid.
- Code Reviewer must review all implementation work before QA Debugger validation.
- QA Debugger must sign off before merge/release recommendation.

## Mandatory Review Gates

1. **Scope Gate** - Product Manager and Domain Expert must align on requirements and constraints.
2. **Architecture Gate** - Architecture Reviewer approval is required before implementation planning finalization.
3. **TDD Gate** - Test Engineer must define and execute failing-first test baseline.
4. **Code Quality Gate** - Code Reviewer approval required for all implementation changes.
5. **QA Gate** - QA Debugger validation required before merge or release.

## Hard Rules

- No implementation without architecture.
- No merge without review.
- No skipping hierarchy.
- No test bypass: failing or missing critical tests block progression.
- No security bypass: RBAC and security controls are mandatory acceptance criteria.
- No undocumented decision: architecture and significant trade-offs must be recorded in project decisions.

## Escalation and Rework

- Any rejected gate result returns work to the owning agent for revision.
- Re-submission must include updated artifacts and explicit change notes.
- Project Manager controls re-entry sequencing and prevents parallel gate confusion.

## Compliance Expectation

Any contribution that violates this order is non-compliant and must be rejected from integration until all required upstream gates are satisfied.
