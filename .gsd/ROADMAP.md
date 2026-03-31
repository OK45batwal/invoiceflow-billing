---
milestone: v1.1-hardening
version: 1.1.0
updated: 2026-03-31T11:52:14.7549798+05:30
---

# Roadmap

> **Current Phase:** 2 - Operational Hardening
> **Status:** planning

## Must-Haves (from SPEC)

- [ ] Stabilize auth and password-management behavior across admin and staff flows.
- [ ] Empirically verify invoice creation, payment recording, recurring runs, backup restore, and PDF generation.
- [ ] Tighten mobile and login UX without breaking current billing workflows.
- [ ] Keep deployment and recovery steps documented and repeatable.

---

## Phases

### Phase 1: Brownfield Baseline
**Status:** Complete
**Objective:** Install GSD, capture current product scope, and document the existing architecture.

**Plans:**
- [x] Plan 1.1: Validate the installed template against the upstream GSD repository
- [x] Plan 1.2: Create initial SPEC, ROADMAP, ARCHITECTURE, and DECISIONS docs for this app

---

### Phase 2: Operational Hardening
**Status:** Not Started
**Objective:** Reduce risk in authentication, billing, persistence, and recovery flows before broader rollout.
**Depends on:** Phase 1

**Plans:**
- [ ] Plan 2.1: Audit auth/session behavior and seed-credential handling
- [ ] Plan 2.2: Add repeatable verification for billing, recurring, backup, and PDF paths

---

### Phase 3: Workflow Polish
**Status:** Not Started
**Objective:** Improve day-to-day billing usability on desktop and mobile.
**Depends on:** Phase 2

**Plans:**
- [ ] Plan 3.1: Review invoice, customer, and recurring workflows for edge-case friction
- [ ] Plan 3.2: Tighten mobile layout and login/dashboard consistency

---

### Phase 4: Deployment and Recovery
**Status:** Not Started
**Objective:** Make local and hosted operation more repeatable and easier to recover.
**Depends on:** Phase 3

**Plans:**
- [ ] Plan 4.1: Validate deployment assumptions for local development and Render hosting
- [ ] Plan 4.2: Document recovery drills for backup export and restore

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1 | Complete | 2/2 | 100% |
| 2 | Not Started | 0/2 | 0% |
| 3 | Not Started | 0/2 | 0% |
| 4 | Not Started | 0/2 | 0% |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1 | 2026-03-31 | 2026-03-31 | 1 session |
| 2 | - | - | - |
| 3 | - | - | - |
| 4 | - | - | - |
