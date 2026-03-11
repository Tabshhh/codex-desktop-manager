# README Screenshot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the latest UI screenshot to the Chinese and English README landing sections.

**Architecture:** Store the provided screenshot under `docs/assets` and reference it from both README files using a shared relative path. Keep the change documentation-only aside from the copied asset.

**Tech Stack:** Markdown, GitHub repository assets

---

### Task 1: Add the screenshot asset

**Files:**
- Create: `docs/assets/account-pool.png`

**Step 1: Copy the provided screenshot**

Copy the user-provided screenshot from its local path into `docs/assets/account-pool.png`.

**Step 2: Verify the file exists**

Run: `Get-ChildItem docs/assets/account-pool.png`
Expected: the copied PNG is present in the repository.

### Task 2: Update the Chinese README

**Files:**
- Modify: `README.md`

**Step 1: Add a preview section**

Insert a `## 界面预览` section near the top of `README.md` and reference `./docs/assets/account-pool.png`.

**Step 2: Verify the markdown change**

Run: `Get-Content README.md`
Expected: the new preview section appears below the short introduction.

### Task 3: Update the English README

**Files:**
- Modify: `README.en.md`

**Step 1: Add a preview section**

Insert a `## Screenshot` section near the top of `README.en.md` and reference `./docs/assets/account-pool.png`.

**Step 2: Verify the markdown change**

Run: `Get-Content README.en.md`
Expected: the new screenshot section appears below the short introduction.

### Task 4: Verification

**Files:**
- No code changes expected

**Step 1: Run production build**

Run: `npm run build`
Expected: PASS
