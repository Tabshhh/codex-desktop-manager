# Release Packaging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Windows release packaging for both installer and portable outputs, plus a small set of release-focused usability improvements and platform adapter groundwork.

**Architecture:** The existing Electron/Vite build remains the compile path, and `electron-builder` becomes the packaging layer for Windows release artifacts. A small platform helper will make current Windows assumptions explicit and give future Linux/macOS support a cleaner place to land.

**Tech Stack:** Electron, electron-vite, electron-builder, React, TypeScript, Vitest

---

### Task 1: Add failing tests for platform support metadata

**Files:**
- Create: `src/main/services/platform-support.test.ts`
- Create: `src/main/services/platform-support.ts`

**Step 1: Write the failing test**

Cover:
- Windows returns supported with the expected platform label
- Linux and macOS return unsupported for switching features
- support metadata includes a user-facing reason

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/platform-support.test.ts`

Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Create a helper that reports:
- current platform id
- whether account switching is officially supported
- a short reason when unsupported

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/platform-support.test.ts`

Expected: PASS.

### Task 2: Surface release and platform info in the app

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/api.ts`
- Modify: `src/main/services/desktop-api.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/main/preload.ts`
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/App.test.tsx`
- Modify: `src/renderer/styles.css`

**Step 1: Write the failing test**

Add a renderer test for:
- visible version/about info
- visible platform support note or first-run help text

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`

Expected: FAIL because the UI does not show the new release information yet.

**Step 3: Write minimal implementation**

Expose from the main process:
- app version
- product name
- platform support status

Render a small release info/footer area and clearer first-run note in the UI.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`

Expected: PASS.

### Task 3: Add Windows packaging configuration

**Files:**
- Modify: `package.json`
- Optional create: `build/icon.ico`
- Optional create: `scripts/` helper only if required

**Step 1: Write the failing check**

Define release expectations:
- installer script exists
- portable script exists
- builder config declares Windows targets

**Step 2: Run the current release command**

Run: `npm run release`

Expected: FAIL because the release pipeline does not exist yet.

**Step 3: Write minimal implementation**

Add:
- `electron-builder`
- product metadata
- `nsis` and `portable` targets
- release scripts such as:
  - `release`
  - `release:win`

Use a placeholder icon path if needed, but keep the config valid.

**Step 4: Run release check**

Run: `npm run release:win`

Expected: packaging starts successfully and emits Windows artifacts.

### Task 4: Clarify Windows-only support in docs

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`

**Step 1: Write the failing doc checklist**

Check that docs explain:
- Windows is the currently supported platform
- installer and portable release outputs
- Linux/macOS are future work

**Step 2: Review current docs**

Expected: missing release packaging guidance.

**Step 3: Write minimal documentation**

Add release usage notes and supported-platform wording in both README files.

**Step 4: Re-read docs**

Expected: repo landing pages accurately reflect support and release outputs.

### Task 5: Full verification

**Files:**
- Verify: `package.json`
- Verify: `src/main/services/platform-support.ts`
- Verify: `src/renderer/App.tsx`
- Verify: `README.md`
- Verify: `README.en.md`

**Step 1: Run tests**

Run: `npm test`

Expected: PASS.

**Step 2: Run build**

Run: `npm run build`

Expected: PASS.

**Step 3: Run release packaging**

Run: `npm run release:win`

Expected: installer and portable artifacts are created in the configured output directory.
