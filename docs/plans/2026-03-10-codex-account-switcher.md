# Codex Account Switcher Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Windows desktop app that captures multiple local Codex account snapshots, switches between them with one click, and shows local-visible account status.

**Architecture:** The app is an Electron shell with a React renderer. The main process owns filesystem, process, and restart logic; the renderer only talks through a typed preload bridge. Codex-specific state handling is isolated in services so storage changes stay localized.

**Tech Stack:** Electron, React, TypeScript, Vite, Vitest, Testing Library

---

### Task 1: Bootstrap The Repo

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `electron.vite.config.ts`
- Create: `.gitignore`
- Create: `src/main/main.ts`
- Create: `src/main/preload.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/styles.css`

**Step 1: Write the failing test**

Create a smoke test that expects the app config exports and renderer root component to load.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand`
Expected: FAIL because project files do not exist yet

**Step 3: Write minimal implementation**

Add the Electron/Vite scaffold, scripts, and a minimal renderer shell.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand`
Expected: PASS for the scaffold smoke test

**Step 5: Commit**

```bash
git add .
git commit -m "chore: bootstrap codex account switcher"
```

### Task 2: Add Codex State Parsing

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/main/services/auth-state.ts`
- Create: `src/main/services/jwt.ts`
- Create: `src/main/services/paths.ts`
- Test: `src/main/services/auth-state.test.ts`

**Step 1: Write the failing test**

Test parsing of `.codex/auth.json`, JWT payload extraction, and account summary mapping.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/auth-state.test.ts --runInBand`
Expected: FAIL because parser functions are missing

**Step 3: Write minimal implementation**

Implement parsing helpers that never expose raw token strings in returned summaries.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/auth-state.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: parse codex auth state"
```

### Task 3: Build Snapshot Storage

**Files:**
- Create: `src/main/services/snapshot-store.ts`
- Test: `src/main/services/snapshot-store.test.ts`

**Step 1: Write the failing test**

Test snapshot creation, listing, metadata persistence, and validation against temporary directories.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/snapshot-store.test.ts --runInBand`
Expected: FAIL because snapshot storage is not implemented

**Step 3: Write minimal implementation**

Write the snapshot store using a dedicated app data directory and manifest files.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/snapshot-store.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add snapshot storage"
```

### Task 4: Implement Switching And Rollback

**Files:**
- Create: `src/main/services/process-manager.ts`
- Create: `src/main/services/switch-service.ts`
- Test: `src/main/services/switch-service.test.ts`

**Step 1: Write the failing test**

Test backup, stop-process, replace-files, restart, verification success, and rollback-on-mismatch flows.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/switch-service.test.ts --runInBand`
Expected: FAIL because the switch service does not exist

**Step 3: Write minimal implementation**

Implement orchestration with injected filesystem and process adapters.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/switch-service.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add account switching workflow"
```

### Task 5: Add Local Usage Summary

**Files:**
- Create: `src/main/services/usage-service.ts`
- Test: `src/main/services/usage-service.test.ts`

**Step 1: Write the failing test**

Test local session counting, freshness classification, and fallback handling when data is missing.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/usage-service.test.ts --runInBand`
Expected: FAIL because usage summarization is missing

**Step 3: Write minimal implementation**

Implement a local-visible usage summary from `.codex/sessions`, auth refresh time, and token expiry.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/usage-service.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add local usage summary"
```

### Task 6: Expose IPC API

**Files:**
- Create: `src/main/ipc.ts`
- Modify: `src/main/main.ts`
- Modify: `src/main/preload.ts`
- Test: `src/main/ipc.test.ts`

**Step 1: Write the failing test**

Test that the preload bridge exposes only the supported API surface and that handlers call the right services.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/ipc.test.ts --runInBand`
Expected: FAIL because no bridge exists

**Step 3: Write minimal implementation**

Add IPC handlers for list accounts, capture current account, switch account, rollback last switch, and read local usage.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/ipc.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: expose desktop ipc api"
```

### Task 7: Build The UI

**Files:**
- Create: `src/renderer/hooks/useAccounts.ts`
- Create: `src/renderer/components/AccountList.tsx`
- Create: `src/renderer/components/AccountDetail.tsx`
- Create: `src/renderer/components/ActionBar.tsx`
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/styles.css`
- Test: `src/renderer/App.test.tsx`

**Step 1: Write the failing test**

Test the renderer for account listing, detail rendering, and switch action states.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx --runInBand`
Expected: FAIL because UI components do not exist

**Step 3: Write minimal implementation**

Build the first usable interface with account cards, local status, and one-click actions.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add account switcher ui"
```

### Task 8: Verify End-To-End Readiness

**Files:**
- Modify: `README.md`
- Create: `src/main/services/manual-checklist.md`

**Step 1: Write the failing test**

Add a README usage section and a manual verification checklist; if a lightweight build smoke test is practical, add it.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL until build configuration is complete

**Step 3: Write minimal implementation**

Complete docs, packaging scripts, and any missing config needed for a successful build.

**Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "docs: add setup and verification guide"
```
