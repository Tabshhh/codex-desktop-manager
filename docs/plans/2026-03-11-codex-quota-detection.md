# Codex Quota Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local cached Codex quota detection so the app can show 5-hour remaining quota and weekly quota usage when those values are present in the desktop client's local storage.

**Architecture:** A new main-process quota reader will scan a narrow set of local Codex storage files, extract quota-shaped records, normalize them, and merge them into the existing local usage summary. The renderer will show quota values when available and an explicit unavailable state otherwise.

**Tech Stack:** Electron, React, TypeScript, Vitest, Node filesystem APIs

---

### Task 1: Add Typed Quota Models

**Files:**
- Modify: `src/shared/types.ts`

**Step 1: Write the failing test**

Add tests that expect `LocalUsageSummary` to be able to hold normalized quota fields for a 5-hour window and weekly percentage.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/usage-service.test.ts`
Expected: FAIL because the current summary shape has no quota fields.

**Step 3: Write minimal implementation**

Extend the shared types with nullable quota fields and a source label.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/usage-service.test.ts`
Expected: PASS

### Task 2: Parse Quota Records From Local Cache Text

**Files:**
- Create: `src/main/services/quota-cache.ts`
- Create: `src/main/services/quota-cache.test.ts`

**Step 1: Write the failing test**

Create parser tests using representative text blobs that contain quota-like JSON fragments. Cover:

- a full record with 5-hour remaining and weekly percentage
- incomplete records that should be ignored
- multiple candidate records where the most complete result should win

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/quota-cache.test.ts`
Expected: FAIL because the parser does not exist.

**Step 3: Write minimal implementation**

Implement string-based quota extraction and normalization helpers.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/quota-cache.test.ts`
Expected: PASS

### Task 3: Read Local Codex Cache Files

**Files:**
- Modify: `src/main/services/locator.ts`
- Modify: `src/main/services/quota-cache.ts`
- Test: `src/main/services/quota-cache.test.ts`

**Step 1: Write the failing test**

Add an integration-style test that creates fake Codex local storage files and expects the quota reader to return the normalized quota summary.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/quota-cache.test.ts`
Expected: FAIL because file scanning is not implemented.

**Step 3: Write minimal implementation**

Add runtime path support for the roaming Codex directory and scan likely text-bearing local storage files.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/quota-cache.test.ts`
Expected: PASS

### Task 4: Merge Quota Into Usage Summary

**Files:**
- Modify: `src/main/services/usage-service.ts`
- Modify: `src/main/services/usage-service.test.ts`
- Modify: `src/main/services/desktop-api.ts`

**Step 1: Write the failing test**

Update usage service tests to expect quota values to be preserved in the returned summary.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/services/usage-service.test.ts`
Expected: FAIL because the usage service does not accept quota input yet.

**Step 3: Write minimal implementation**

Thread the normalized quota snapshot through the usage summary pipeline.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/usage-service.test.ts`
Expected: PASS

### Task 5: Render Quota In The UI

**Files:**
- Modify: `src/renderer/components/AccountDetail.tsx`
- Modify: `src/renderer/App.test.tsx`

**Step 1: Write the failing test**

Add a renderer test that expects:

- 5-hour quota to appear when present
- weekly usage percentage to appear when present
- quota unavailable messaging when absent

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: FAIL because the renderer does not display quota fields yet.

**Step 3: Write minimal implementation**

Render quota rows in the detail panel with clear local-cache wording.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.test.tsx`
Expected: PASS

### Task 6: Verify End-To-End Readiness

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

If practical, add or update an existing assertion that the README describes quota detection as local cached quota rather than official billing.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS or fail only if documentation-linked code changes introduced build issues.

**Step 3: Write minimal implementation**

Document the new quota behavior and its limitations.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/services/quota-cache.test.ts src/main/services/usage-service.test.ts src/renderer/App.test.tsx`
Run: `npm run build`
Expected: PASS
