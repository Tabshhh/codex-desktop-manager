# Bilingual README Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an English-default and Chinese-companion README setup suitable for GitHub open-source publishing.

**Architecture:** Keep `README.md` as the primary landing page and add `README.zh-CN.md` as the Chinese mirror. Both files will cross-link near the top and share the same section order so future edits stay manageable.

**Tech Stack:** Markdown, GitHub README conventions

---

### Task 1: Add publish-facing bilingual README docs

**Files:**
- Create: `docs/plans/2026-03-11-bilingual-readme-design.md`
- Create: `docs/plans/2026-03-11-bilingual-readme.md`

**Step 1: Write the documentation**

Capture the chosen bilingual README structure and the reason for using separate English and Chinese files.

**Step 2: Confirm the docs exist**

Check that both plan files are present in `docs/plans/`.

### Task 2: Update repository README files

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`

**Step 1: Update the English README**

Add a top-level language switch link and keep the current open-source and runtime notes accurate.

**Step 2: Create the Chinese README**

Mirror the core sections:
- project summary
- main features
- quota behavior
- local state
- open-source safety
- development and run commands
- current limitations

**Step 3: Re-read both files**

Confirm that links, commands, and terminology are consistent.

### Task 3: Verify repository health

**Files:**
- Verify: `README.md`
- Verify: `README.zh-CN.md`

**Step 1: Run build verification**

Run: `npm run build`

Expected: PASS.

**Step 2: Summarize publish readiness**

Report that the repo now has bilingual README navigation and retains the previously verified clean publish posture.
