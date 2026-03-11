# Windows Launch And Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Launch Codex Desktop through its packaged Windows app identity, move this manager's cache to local session data, and tighten the account-pool UI.

**Architecture:** Extend the Windows locator/process-manager path so restart logic can prefer an AppUserModelID launch target over a raw executable path. Set Electron `sessionData` to a local cache folder before app readiness so Chromium cache writes no longer target roaming profile storage. Adjust account-pool layout styles and reset timestamp markup without changing data flow.

**Tech Stack:** Electron, TypeScript, React, Vitest, electron-vite

---

### Task 1: Add packaged-app launch detection and startup selection

**Files:**
- Modify: `src/main/services/locator.ts`
- Modify: `src/main/services/process-manager.ts`
- Create: `src/main/services/process-manager.test.ts`

**Step 1: Write the failing test**

Add tests that verify the process manager launches through `explorer.exe shell:AppsFolder\\<AppID>` when an AppUserModelID is available, and falls back to the executable path otherwise.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/process-manager.test.ts`
Expected: FAIL because the process manager currently only supports launching by executable path.

**Step 3: Write minimal implementation**

Add packaged-app lookup in the locator and extend the process manager options to accept an app ID. Use the app ID launch target first, then fall back to the executable path only when needed.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/process-manager.test.ts`
Expected: PASS

### Task 2: Move Electron session data to local cache storage

**Files:**
- Modify: `src/main/main.ts`
- Create: `src/main/session-data-path.ts`
- Create: `src/main/session-data-path.test.ts`

**Step 1: Write the failing test**

Add a small test for the helper that derives a local `sessionData` path from Windows-style environment variables.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/session-data-path.test.ts`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Create a helper that derives a local cache path, and call `app.setPath('sessionData', ...)` before `whenReady()`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/session-data-path.test.ts`
Expected: PASS

### Task 3: Tighten account-pool layout and highlight reset times

**Files:**
- Modify: `src/renderer/App.test.tsx`
- Modify: `src/renderer/components/AccountList.tsx`
- Modify: `src/renderer/styles.css`

**Step 1: Write the failing test**

Extend the app test to assert the reset timestamps render with dedicated highlighted value spans, preserving the labels.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because reset metadata is plain text and no highlighted value spans exist.

**Step 3: Write minimal implementation**

Split each reset row into label and value spans, add highlight styling for the time value, narrow the action panel, and shrink the switch/delete buttons.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS

### Task 4: Full verification

**Files:**
- No code changes expected

**Step 1: Run targeted tests**

Run: `npm test -- src/main/services/process-manager.test.ts src/main/session-data-path.test.ts src/renderer/App.test.tsx`
Expected: PASS

**Step 2: Run the full suite**

Run: `npm test`
Expected: PASS

**Step 3: Run production build**

Run: `npm run build`
Expected: PASS
