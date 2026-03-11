# Release Packaging Design

**Date:** 2026-03-11

## Goal

Ship a first usable release flow for `Codex Desktop Manager` that produces both a normal Windows installer and a portable Windows build, while improving release-time usability and leaving room for future Linux and macOS support.

## Current State

- The app can be developed and built with `electron-vite`, but there is no release packaging pipeline.
- There is no installer, portable package, app icon, or release metadata.
- Platform-specific logic is still mostly implied by the current Windows implementation.
- The project does not yet distinguish between "supported today" and "possible later" platforms.

## Requirements

### Release outputs

- Produce a Windows installer suitable for normal end users.
- Produce a Windows portable package suitable for testing, backup, and no-install workflows.
- Keep release commands simple enough to run from the existing repository.

### Usability

- Add a visible app version/about surface so release builds feel intentional.
- Improve "first run" guidance when local Codex state is missing.
- Make it easy for users to understand where local data lives and what the app expects.

### Platform direction

- Keep Windows as the only officially supported platform for now.
- Introduce a platform adapter seam for paths/process naming so Linux and macOS can be added later without rewriting core features.
- Avoid claiming Linux/macOS packaging support without test coverage.

## Approaches Considered

### 1. `electron-builder` with Windows `nsis` + `portable`

Use `electron-builder` on top of the existing Electron/Vite build outputs.

**Pros**

- standard Electron packaging path
- can emit both installer and portable builds in one toolchain
- good metadata support
- easiest route to future auto-update or code-signing work

**Cons**

- adds a new build dependency and release config
- introduces extra packaging concepts into a currently lean repo

### 2. Manual zip/copy packaging

Build the app, then script a manual portable folder and zip flow without a formal installer.

**Pros**

- fewer dependencies
- fastest path to a portable artifact

**Cons**

- no real installer experience
- release metadata and platform conventions become ad hoc
- harder to maintain once the app grows

### 3. `electron-forge`

Adopt Forge as the release framework and migrate packaging there.

**Pros**

- modern integrated workflow
- strong ecosystem

**Cons**

- heavier migration from the current `electron-vite` setup
- more change than needed for the first release

## Recommended Approach

Use approach 1.

Add `electron-builder` and configure Windows-first targets:

- `nsis` installer
- `portable`

This gives the project a practical release story now without forcing a larger tooling migration.

## Release Design

### Build pipeline

- Keep `npm run build` as the shared compile step.
- Add release scripts that:
  - build app assets
  - package Windows installer
  - package Windows portable
- Store release configuration in `package.json` unless it becomes too large, in which case it can move to a dedicated config file later.

### Assets and metadata

- Add a Windows `.ico` app icon placeholder path in the repo.
- Set:
  - product name: `Codex Desktop Manager`
  - app id
  - artifact names with version placeholders
- Keep versioning simple and manual for now.

### Release-time usability

- Add a lightweight About/version area in the UI so packaged builds expose version information.
- Add clearer empty-state guidance for first-time users with no local Codex state.
- Optionally include a direct link/button to open the local snapshot directory.

## Platform Adapter Direction

Extract or formalize one platform-facing helper layer for:

- Codex home path resolution
- app-local data location
- platform support checks
- process executable naming

For this phase:

- Windows implementation stays authoritative
- Linux/macOS return explicit "not yet supported" responses where needed
- packaging config only builds Windows targets

## Testing Strategy

- Add unit tests for any new platform support helper behavior.
- Add renderer tests for the About/version or first-run guidance changes.
- Run the full test suite.
- Run `npm run build`.
- Run release packaging commands and confirm that Windows artifacts are produced in the configured release output directory.

## Success Criteria

- A single repo can generate both Windows installer and portable artifacts.
- Release builds expose basic product/version identity.
- First-run UX is clearer for users without local Codex state.
- The codebase has an explicit platform boundary instead of implicit Windows assumptions.
- Linux/macOS remain future-ready without being falsely advertised as supported today.
