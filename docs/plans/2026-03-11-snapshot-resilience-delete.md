# Snapshot Resilience And Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the account pool usable when snapshot folders are incomplete, add local snapshot deletion, and show quota reset timestamps on each account card.

**Architecture:** Harden the snapshot store so list operations filter out incomplete manifests instead of throwing. Extend the desktop IPC surface with a delete action that removes the saved snapshot directory only. Update the renderer account cards to show reset timestamps and a guarded delete control while preserving quota-as-optional behavior.

**Tech Stack:** Electron, TypeScript, React, Vitest, electron-vite

---

### Task 1: Snapshot resilience in the main process

**Files:**
- Modify: `src/main/services/snapshot-store.test.ts`
- Modify: `src/main/services/snapshot-store.ts`

**Step 1: Write the failing test**

Add a test that creates one valid snapshot folder and one folder without `manifest.json`, then expects `listSnapshots()` to return only the valid one.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/snapshot-store.test.ts`
Expected: FAIL because `listSnapshots()` still rejects when any snapshot manifest is missing.

**Step 3: Write minimal implementation**

Change `listSnapshots()` to read manifests individually, keep valid snapshots, and skip folders that are missing required manifest data. Preserve quota as optional data.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/snapshot-store.test.ts`
Expected: PASS with the new resilience case and existing snapshot tests still green.

### Task 2: Add local snapshot deletion API

**Files:**
- Modify: `src/shared/api.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/main/services/snapshot-store.test.ts`
- Modify: `src/main/services/snapshot-store.ts`
- Modify: `src/renderer/hooks/useAccounts.ts`

**Step 1: Write the failing test**

Add a store test that captures a snapshot, deletes it, and verifies it no longer appears in `listSnapshots()`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/snapshot-store.test.ts`
Expected: FAIL because no delete method exists yet.

**Step 3: Write minimal implementation**

Add `deleteSnapshot(snapshotId)` to the store, expose it through the IPC contract, and add a corresponding hook action in the renderer.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/snapshot-store.test.ts`
Expected: PASS with delete behavior covered.

### Task 3: Show reset timestamps and delete control in the account pool

**Files:**
- Modify: `src/renderer/App.test.tsx`
- Modify: `src/renderer/components/AccountList.tsx`
- Modify: `src/renderer/styles.css`

**Step 1: Write the failing test**

Extend the app test to expect `5h reset` and `Weekly reset` text for saved accounts with quota data, and a delete control that requires confirmation.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because the account cards do not yet show reset timestamps or a delete action.

**Step 3: Write minimal implementation**

Render the two reset times as muted metadata under the quota section. Add a two-step delete button that first arms confirmation and then invokes the delete action.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS with the new card behavior.

### Task 4: Full verification

**Files:**
- No code changes expected

**Step 1: Run targeted tests**

Run: `npm test -- src/main/services/snapshot-store.test.ts src/renderer/App.test.tsx`
Expected: PASS

**Step 2: Run the full suite**

Run: `npm test`
Expected: PASS

**Step 3: Run production build**

Run: `npm run build`
Expected: PASS
