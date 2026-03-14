# README Workflow And Release Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a practical usage workflow to both README landing pages and ship a new packaged Windows patch release for the latest switch rollback fix.

**Architecture:** The repository landing pages remain the primary user-facing entry point, so the workflow guidance is added inline instead of being split into a separate manual. Release metadata is updated in-place by bumping the package version and adding a matching release note so generated artifacts and docs stay aligned.

**Tech Stack:** Markdown, npm, Electron, electron-vite, electron-builder, Vitest

---

### Task 1: Record the new docs and release scope

**Files:**
- Create: `docs/plans/2026-03-14-readme-workflow-release-design.md`
- Create: `docs/plans/2026-03-14-readme-workflow-release.md`

**Step 1: Write the brief design**

Capture:
- why the README needs a workflow section
- why the release needs a new patch version
- the recommended inline README approach

**Step 2: Write the execution plan**

Capture:
- exact files to update
- exact verification commands
- release output expectation

### Task 2: Update bilingual landing pages

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`

**Step 1: Review the current structure**

Check where the workflow section should sit so both files stay structurally aligned.

**Step 2: Add the workflow section**

Add a compact section that covers:
- first login in Codex Desktop
- snapshot capture
- capturing additional accounts
- one-click switching
- rollback usage
- usage refresh

**Step 3: Re-read both files**

Confirm the Chinese and English sections mirror each other and read naturally on GitHub.

### Task 3: Bump release metadata

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `docs/releases/v0.1.2.md`

**Step 1: Update the package version**

Change `0.1.1` to `0.1.2` so the next packaged artifacts have a distinct version.

**Step 2: Add the release note**

Summarize:
- the switch rollback process cleanup
- the new README workflow guidance

**Step 3: Re-read release metadata**

Confirm the package version and release note match.

### Task 4: Verify and package

**Files:**
- Verify: `README.md`
- Verify: `README.en.md`
- Verify: `package.json`
- Verify: `src/main/services/switch-service.ts`

**Step 1: Run the full test suite**

Run: `npm test`

Expected: PASS.

**Step 2: Run the production build**

Run: `npm run build`

Expected: PASS.

**Step 3: Run Windows release packaging**

Run: `npm run release:win`

Expected: PASS and emit `0.1.2` setup and portable artifacts under `release/`.

### Task 5: Commit and publish

**Files:**
- Verify: git status

**Step 1: Review the final diff**

Run: `git status --short`

Expected: only intended files are modified.

**Step 2: Commit**

Use a commit message scoped to the rollback fix, README workflow, and release bump.

**Step 3: Push**

Push `main` to `origin`.
