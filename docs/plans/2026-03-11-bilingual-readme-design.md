# Bilingual README Design

**Date:** 2026-03-11

## Goal

Add a GitHub-friendly bilingual project introduction so visitors can switch between English and Simplified Chinese without changing the codebase structure or duplicating too much maintenance burden.

## Recommended Approach

Use:

- `README.md` as the default English landing page
- `README.zh-CN.md` as the Simplified Chinese companion page

Both files should include a small language switch link near the top so GitHub visitors can move between them easily.

## Why This Approach

- matches common open-source repository conventions
- keeps GitHub preview behavior predictable
- avoids mixing two full languages into one overly long page
- keeps future updates simple because the two files can stay structurally aligned

## Scope

- update the existing English README with a language switch link and slightly cleaner release-facing wording
- add a Chinese README that mirrors the important sections
- keep technical details accurate and consistent with current project behavior

## Verification

- ensure both README files exist and cross-link correctly
- run the project build after documentation updates to confirm the repo still validates cleanly
