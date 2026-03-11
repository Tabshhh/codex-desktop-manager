# Open Source Cleanup And Window State Design

**Date:** 2026-03-11

## Goal

Prepare the current repository so it can be published to GitHub without leaking personal or local-sensitive data, while also improving the desktop app so it remembers the user's preferred window size and position between launches.

## Current Problems

- The Electron window always opens with the same hard-coded size, even after the user carefully resizes it to a more comfortable working layout.
- The current repository is still in a local development posture and has not yet been audited for open-source publication safety.
- Local-only artifacts such as build output, logs, snapshots, auth files, and platform-specific traces may be produced in normal use and should never be committed.
- Some UI and docs changes have accumulated quickly; the repository now needs a deliberate "publish-safe" pass instead of relying on ad hoc cleanup.

## Requirements

### Functional

- Persist window bounds across launches.
- Use the current preferred dimensions as the initial default when no prior state exists.
- Restore saved bounds safely without reopening off-screen.
- Keep the app launchable in a clean environment with no local Codex auth state checked into the repo.

### Open Source Safety

- Do not keep any real auth data, tokens, local snapshots, or logs in the repository.
- Add ignore rules for local runtime state that the app may create during normal use.
- Review docs and tests for personal identifiers, machine-specific paths, or live secrets.
- Leave the repository in a state that can be pushed directly to GitHub.

### Verification

- Confirm the project still builds and tests.
- Confirm the project can run after removing or ignoring local-sensitive files.
- Document any required setup so a new user can run the project from a clean clone.

## Approaches Considered

### 1. Persist Window State In `userData` And Clean The Current Repository

Store bounds in a small local JSON file under Electron `app.getPath('userData')`, and make the current repository itself publication-ready.

**Pros**

- simplest runtime model
- matches Electron desktop conventions
- keeps one canonical repository
- lowest maintenance burden after publishing

**Cons**

- requires a careful audit of current files before declaring the repo publish-safe

### 2. Persist Window State In The Repo And Export A Separate Public Copy

Store preferences inside the workspace and generate a second directory for public release.

**Pros**

- easier to inspect at first glance
- very conservative for the original working copy

**Cons**

- preferences do not belong in source control
- creates two directories that can drift
- conflicts with the user's request to clean the current repository itself

### 3. Build A Fresh Repository By Copying Selected Files

Create a brand new repo and manually move only safe files into it.

**Pros**

- strongest isolation if history is already compromised

**Cons**

- too heavy for the current need
- high chance of missing required files
- duplicates maintenance effort

## Recommended Approach

Use approach 1.

Window state should live in a local file under Electron `userData`, never in the repository. The repository should be hardened in place by ignoring runtime-sensitive files, auditing tracked content, and verifying the app still works from a clean local state.

## Architecture

### Window State

- Add a small main-process helper dedicated to reading and writing the main window state.
- On launch:
  - read the saved bounds if present
  - validate them against the current display work area
  - fall back to the existing default window size if no valid state exists
- During normal use:
  - save window bounds on close
  - optionally save maximized state if present

### Repository Cleanup

- Review current tracked files for secrets and personal identifiers.
- Expand `.gitignore` to cover:
  - Codex auth files
  - local snapshot/runtime folders
  - logs
  - release artifacts
  - OS-specific leftovers
- Keep test fixtures synthetic and anonymized.
- Add or update project docs so someone cloning the repo understands what local files will be created at runtime and why they are ignored.

## Error Handling

- If the window-state file is missing or malformed, silently fall back to defaults.
- If saved bounds are off-screen, ignore them and use defaults.
- If the app starts with no local Codex auth, the UI should still launch and show the existing helpful bridge/data errors rather than crashing.

## Testing Strategy

- Add unit tests for window-state loading and fallback logic.
- Add tests for saving/restoring valid bounds and rejecting invalid ones.
- Keep renderer tests intact to ensure recent UI work remains stable.
- Run a clean build.
- Verify a "clean" run by launching the app after ensuring no sensitive runtime files are present in the repository itself.

## Success Criteria

- The app reopens with the user's last chosen window size and position.
- The repository contains no real auth or token material.
- Local-sensitive runtime files are ignored by Git.
- The app still builds, tests, and launches from a clean repo state suitable for open-source publication.
