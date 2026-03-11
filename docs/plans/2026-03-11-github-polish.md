# GitHub Presentation Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the public-facing GitHub presentation for `Codex Desktop Manager`.

**Architecture:** Keep the repository landing pages focused on product overview, move download guidance to the GitHub Release page, and use GitHub repository metadata for discoverability.

**Tech Stack:** Markdown, GitHub CLI

---

### Task 1: Update README landing pages

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`

**Step 1: Remove maintainer-facing release instructions**

Delete the Windows release generation section from both landing pages.

**Step 2: Re-read the pages**

Confirm the remaining sections still read naturally.

### Task 2: Polish the first GitHub Release

**Files:**
- Verify: GitHub Release `v0.1.0`

**Step 1: Replace the notes**

Rewrite the release notes in Simplified Chinese with:
- direct download guidance
- a short feature summary
- current Windows-only support note

**Step 2: Re-read the release**

Confirm the release page now reads like a user-facing download page.

### Task 3: Polish repository metadata

**Files:**
- Verify: repository About panel

**Step 1: Update description**

Use a concise product description suitable for the repository sidebar.

**Step 2: Add topics**

Apply a focused set of repository topics related to Electron, Windows, Codex, and account switching.

**Step 3: Leave homepage empty**

Do not set a homepage URL yet.

### Task 4: Verify and sync

**Files:**
- Verify: `README.md`
- Verify: `README.en.md`

**Step 1: Check repository status**

Run: `git status --short`

Expected: only the intended polish changes are present.

**Step 2: Push the changes**

Commit and push the README changes so the repository landing page matches the GitHub metadata updates.
