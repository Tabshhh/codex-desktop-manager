# UI Navigation And Quota Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the app into Account Pool and Current Account Status pages, add refresh-all quotas, visualize quota with progress bars, and remove page-level scrolling.

**Architecture:** Keep the existing data layer and quota refresh APIs, but reshape the renderer into a single-viewport shell with page tabs. The Account Pool page owns snapshot management and batch refresh, while the Current Account Status page focuses on the live account summary and quota visuals.

**Tech Stack:** Electron, React, TypeScript, Vitest, CSS

---

### Task 1: Add renderer tests for tab navigation and refresh-all

**Files:**
- Modify: `src/renderer/App.test.tsx`

**Step 1: Write the failing test**

Add expectations for:
- two navigation tabs
- Account Pool as the default page
- `Capture current` only visible on Account Pool
- `Refresh all quotas` button
- clicking refresh-all calls `refreshSnapshotUsage` for each snapshot
- switching to Current Account Status hides capture controls and shows live status content

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because the app is still a single mixed page and has no refresh-all control.

**Step 3: Write minimal implementation**

Update the app test fixtures to include multiple snapshots and live usage data needed by the new view structure.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS after the renderer is updated later in the plan.

### Task 2: Add batch refresh behavior to the accounts hook

**Files:**
- Modify: `src/renderer/hooks/useAccounts.ts`
- Modify: `src/renderer/App.test.tsx`

**Step 1: Write the failing test**

Extend the renderer test so `Refresh all quotas` triggers refresh calls for each saved account, continues through failures, and refreshes UI state afterward.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because no batch action exists.

**Step 3: Write minimal implementation**

Add a `refreshAllSnapshotUsage()` action that:
- iterates snapshots sequentially
- swallows individual errors into a collected message
- refreshes the app state when the batch finishes

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS.

### Task 3: Split the renderer into two pages

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/components/ActionBar.tsx`
- Modify: `src/renderer/components/AccountList.tsx`
- Modify: `src/renderer/components/AccountDetail.tsx`

**Step 1: Write the failing test**

Add explicit assertions for:
- `Account Pool` tab content
- `Current Account Status` tab content
- capture controls only on Account Pool
- live status page not rendering the snapshot action bar

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because the page split does not exist yet.

**Step 3: Write minimal implementation**

Introduce page state and render:
- a shared hero
- a tab nav
- Account Pool page with list and actions
- Current Account Status page with live usage-focused detail panel

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS.

### Task 4: Add quota progress bars and stronger visual hierarchy

**Files:**
- Modify: `src/renderer/components/AccountList.tsx`
- Modify: `src/renderer/components/AccountDetail.tsx`
- Modify: `src/renderer/styles.css`
- Modify: `src/renderer/App.test.tsx`

**Step 1: Write the failing test**

Add assertions for progress-bar labels or accessible text representing:
- 5h remaining
- weekly used

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because no progress-bar UI exists.

**Step 3: Write minimal implementation**

Render quota bars in both the account cards and the status page, and update CSS so:
- quota figures are brighter
- timestamps are more muted
- progress bars are visually distinct

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS.

### Task 5: Remove global page scrolling

**Files:**
- Modify: `src/renderer/styles.css`

**Step 1: Write the failing test**

Use an implementation-facing check in the renderer test or manual CSS assertions via class usage to ensure the app shell uses viewport-bounded layout and the account list becomes the inner scroll region.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL if layout classes are missing.

**Step 3: Write minimal implementation**

Update CSS to:
- lock `body`/`#root`/`.app-shell` to viewport height
- hide page overflow
- constrain page panels
- move overflow scrolling into the account list region only

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS.

### Task 6: Verify the full change set

**Files:**
- Test: `src/main/ipc.test.ts`
- Test: `src/main/window-options.test.ts`
- Test: `src/main/services/auth-state.test.ts`
- Test: `src/main/services/session-rate-limits.test.ts`
- Test: `src/main/services/snapshot-store.test.ts`
- Test: `src/main/services/switch-service.test.ts`
- Test: `src/main/services/usage-service.test.ts`
- Test: `src/main/services/remote-usage.test.ts`
- Test: `src/renderer/App.test.tsx`

**Step 1: Run targeted and regression tests**

Run: `npm test -- src/main/ipc.test.ts src/main/window-options.test.ts src/main/services/auth-state.test.ts src/main/services/session-rate-limits.test.ts src/main/services/snapshot-store.test.ts src/main/services/switch-service.test.ts src/main/services/usage-service.test.ts src/main/services/remote-usage.test.ts src/renderer/App.test.tsx`
Expected: PASS.

**Step 2: Run build verification**

Run: `npm run build`
Expected: PASS.
