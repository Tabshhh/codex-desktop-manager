# Open Source Cleanup And Window State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persisted window sizing for the Electron app and turn the current repository into a GitHub-safe, clean, runnable open-source project.

**Architecture:** The main process will load and save a small local window-state file under Electron `userData` and merge that into `BrowserWindow` creation options. In parallel, the repository will be audited and hardened with ignore rules plus documentation so no personal auth, tokens, or runtime state are required or accidentally committed.

**Tech Stack:** Electron, React, TypeScript, Node.js, Vitest, Git ignore rules

---

### Task 1: Add failing tests for window-state persistence

**Files:**
- Create: `src/main/window-state.test.ts`
- Create: `src/main/window-state.ts`

**Step 1: Write the failing test**

Cover:
- loading defaults when no saved state exists
- loading saved width/height/position when valid
- rejecting malformed or off-screen values

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/window-state.test.ts`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Create a main-process helper that:
- reads a JSON file from `app.getPath('userData')`
- validates bounds
- returns defaults when invalid

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/window-state.test.ts`
Expected: PASS.

### Task 2: Wire window-state into BrowserWindow creation

**Files:**
- Modify: `src/main/main.ts`
- Modify: `src/main/window-options.ts`
- Modify: `src/main/window-options.test.ts`
- Modify: `src/main/window-state.ts`

**Step 1: Write the failing test**

Extend tests so the main-window options can accept saved bounds and preserve the existing preload behavior.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/window-options.test.ts src/main/window-state.test.ts`
Expected: FAIL because the window options are still static.

**Step 3: Write minimal implementation**

Update main-process startup so it:
- reads saved state before creating the window
- passes saved bounds into `createMainWindowOptions`
- saves the current bounds on close or shutdown

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/window-options.test.ts src/main/window-state.test.ts`
Expected: PASS.

### Task 3: Audit and harden repository ignore rules

**Files:**
- Modify: `.gitignore`
- Optional create: `README.md` or existing setup doc if needed

**Step 1: Write the failing test/check**

Establish a shell-based audit checklist for:
- auth files
- tokens
- runtime snapshots
- logs
- build artifacts

**Step 2: Run the audit to verify current gaps**

Run searches for:
- `auth.json`
- `token`
- `.log`
- snapshot/runtime directories
Expected: identify what still needs to be ignored or documented.

**Step 3: Write minimal implementation**

Expand `.gitignore` to cover runtime-sensitive and local-only artifacts without hiding real source files.

**Step 4: Re-run the audit**

Expected: sensitive runtime paths are ignored and no tracked secrets are introduced.

### Task 4: Clean publication-facing docs and metadata

**Files:**
- Modify: repository docs only if needed

**Step 1: Write the failing check**

Review tracked docs and metadata for:
- personal account references
- local machine paths that should not be user-facing
- instructions that assume private local state

**Step 2: Run the review**

Expected: identify any cleanup needed for public publication.

**Step 3: Write minimal implementation**

Replace or remove only the content that would confuse or expose the publisher, while keeping useful design docs and developer instructions.

**Step 4: Re-check**

Expected: tracked docs are safe to publish.

### Task 5: Verify clean-environment runtime behavior

**Files:**
- Test: `src/main/window-state.test.ts`
- Test: `src/main/window-options.test.ts`
- Test: `src/main/services/usage-service.test.ts`
- Test: `src/renderer/App.test.tsx`

**Step 1: Run targeted tests**

Run: `npm test -- src/main/window-state.test.ts src/main/window-options.test.ts src/main/services/usage-service.test.ts src/renderer/App.test.tsx`
Expected: PASS.

**Step 2: Run full build**

Run: `npm run build`
Expected: PASS.

**Step 3: Verify clean-run behavior**

Run the app from the repo after ensuring no runtime-sensitive files are present in the workspace itself.
Expected: the app launches successfully and remains runnable without any checked-in secrets.
