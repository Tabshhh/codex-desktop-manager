# Snapshot Usage Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-snapshot quota state plus a manual refresh action that fetches real Codex usage for that saved account without switching the active desktop account.

**Architecture:** Keep the existing live local-usage banner for the currently active Codex home, but store quota snapshots on each saved manifest. Refreshing a snapshot reads that snapshot's `auth.json`, refreshes OAuth tokens when needed, calls the Codex usage endpoint, then persists the normalized quota back into the snapshot manifest.

**Tech Stack:** Electron, React, TypeScript, Vitest, local `auth.json` OAuth tokens, OpenAI auth/usage HTTP endpoints.

---

### Task 1: Define snapshot quota types and bridge contract

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/api.ts`
- Modify: `src/shared/global.d.ts`
- Test: `src/main/ipc.test.ts`

**Step 1: Write the failing test**

Extend the IPC test so services expose `refreshSnapshotUsage(snapshotId)` and the handler count increases.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/ipc.test.ts`
Expected: FAIL because the new IPC channel/bridge method does not exist.

**Step 3: Write minimal implementation**

Add a typed `SnapshotQuotaSummary` structure, attach it to `SnapshotManifest`, and add `refreshSnapshotUsage(snapshotId)` to the desktop bridge contract.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/ipc.test.ts`
Expected: PASS.

### Task 2: Persist quota snapshots in the snapshot store

**Files:**
- Modify: `src/main/services/snapshot-store.ts`
- Modify: `src/main/services/snapshot-store.test.ts`

**Step 1: Write the failing test**

Add a snapshot-store test that captures a snapshot, saves a quota summary onto it, then reads/lists the snapshot and expects the quota payload to persist.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/snapshot-store.test.ts`
Expected: FAIL because the store cannot update quota on a snapshot.

**Step 3: Write minimal implementation**

Add a store method to update `manifest.json` with a `quota` block while preserving account metadata and snapshot identity.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/snapshot-store.test.ts`
Expected: PASS.

### Task 3: Fetch real usage from a snapshot auth file

**Files:**
- Create: `src/main/services/remote-usage.ts`
- Create: `src/main/services/remote-usage.test.ts`
- Modify: `src/main/services/auth-state.ts`

**Step 1: Write the failing test**

Add tests for reading a snapshot `auth.json`, calling the usage endpoint with `Authorization` plus `chatgpt-account-id`, and refreshing tokens via `https://auth.openai.com/oauth/token` when the access token is near expiry or a 401 is returned.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/remote-usage.test.ts`
Expected: FAIL because the service does not exist.

**Step 3: Write minimal implementation**

Implement the remote usage reader with:
- auth parsing from `auth.json`
- JWT expiry check
- token refresh using `refresh_token`
- usage fetch from `https://chatgpt.com/backend-api/wham/usage`
- normalization into the shared quota shape

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/remote-usage.test.ts`
Expected: PASS.

### Task 4: Wire refreshSnapshotUsage through Electron main/preload/renderer

**Files:**
- Modify: `src/main/ipc.ts`
- Modify: `src/main/preload.ts`
- Modify: `src/main/services/desktop-api.ts`
- Modify: `src/renderer/hooks/useAccounts.ts`
- Modify: `src/renderer/App.test.tsx`

**Step 1: Write the failing test**

Update the app test so each saved account can trigger a refresh action and calls `window.codexSwitcher.refreshSnapshotUsage(snapshotId)`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because the refresh action is not wired.

**Step 3: Write minimal implementation**

Expose the new IPC channel, call the remote usage service for the selected snapshot, persist the returned quota into the manifest, then refresh the UI state.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS.

### Task 5: Show per-account quota and manual refresh in the UI

**Files:**
- Modify: `src/renderer/components/AccountList.tsx`
- Modify: `src/renderer/components/AccountDetail.tsx`
- Modify: `src/renderer/App.tsx`

**Step 1: Write the failing test**

Extend the renderer test to expect account cards/details to render snapshot-specific quota and a refresh button label.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because the UI still shows only global usage.

**Step 3: Write minimal implementation**

Render each snapshot's saved quota summary and add a refresh button with busy state. Keep the hero banner as current live local usage so both concepts stay separate.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS.

### Task 6: Verify end-to-end behavior

**Files:**
- Test: `src/main/ipc.test.ts`
- Test: `src/main/services/snapshot-store.test.ts`
- Test: `src/main/services/remote-usage.test.ts`
- Test: `src/main/services/usage-service.test.ts`
- Test: `src/renderer/App.test.tsx`
- Test: `src/main/services/session-rate-limits.test.ts`

**Step 1: Run targeted tests**

Run: `npm test -- src/main/ipc.test.ts src/main/services/snapshot-store.test.ts src/main/services/remote-usage.test.ts src/main/services/usage-service.test.ts src/main/services/session-rate-limits.test.ts src/renderer/App.test.tsx`
Expected: PASS.

**Step 2: Run broader regression/build checks**

Run: `npm run build`
Expected: PASS.
