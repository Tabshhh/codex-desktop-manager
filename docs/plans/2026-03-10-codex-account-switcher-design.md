# Codex Desktop Account Switcher Design

**Date:** 2026-03-10

**Goal**

Build a Windows-only desktop tool in this repository that manages multiple Codex Desktop accounts, switches between them with one click, and shows the best available local account/quota snapshot without calling official billing APIs.

## Problem

Codex Desktop currently behaves like a single-account client on Windows. The user wants to:

- save multiple Codex account states locally
- switch between them quickly
- see local account status and a quota-like summary
- recover safely if a switch fails

## Constraints

- Windows only for v1
- Project must live in this folder as a standalone Git repo
- No reliance on official remote billing APIs for quota data
- Must tolerate Codex Desktop internal storage changes
- Must not destroy the active session if replacement fails

## Discovered Local State

The local machine inspection found these relevant paths:

- `C:\Users\Tabs\.codex\auth.json`
- `C:\Users\Tabs\.codex\config.toml`
- `C:\Users\Tabs\.codex\.codex-global-state.json`
- `C:\Users\Tabs\AppData\Roaming\Codex\Local State`
- `C:\Users\Tabs\AppData\Roaming\Codex\Preferences`
- `C:\Users\Tabs\AppData\Local\Codex\Logs\...`

The most stable switching anchor for v1 is `C:\Users\Tabs\.codex\auth.json`. This file exposes the active auth mode, token refresh timestamp, and token bundle. Electron-side roaming data appears useful as supplemental metadata, but not as the primary switching source.

## Approaches Considered

### 1. Full Roaming Profile Swap

Copy the entire `AppData\Roaming\Codex` profile per account and replace it during switch.

**Pros**

- Feels closest to a full client profile restore

**Cons**

- Highly coupled to Electron storage internals
- More likely to break across desktop updates
- Harder to validate and recover safely

### 2. CLI/Auth-Centric Snapshot With Desktop Restart

Treat `.codex\auth.json` as the source of truth, keep a small set of related metadata files, and restart Codex Desktop after switch.

**Pros**

- Smaller, more stable switching surface
- Easier to validate and back up
- Aligns with observed local state and desktop log behavior

**Cons**

- Some desktop-specific transient state is intentionally ignored

### 3. Login Launcher Only

Manage account labels and login entry points but do not replace local auth state.

**Pros**

- Safest implementation

**Cons**

- Does not meet the one-click switching requirement

## Recommended Approach

Use approach 2: an auth-centric snapshot manager with restart, validation, backup, and rollback.

## Architecture

### App Shape

Use Electron with:

- a main process for system access and switching workflows
- a preload bridge for narrowly scoped IPC
- a renderer for the UI

### Modules

- `CodexLocator`: resolves Codex Desktop process, executable path, and local state paths
- `SnapshotStore`: saves and reads account snapshots under the app data directory
- `AccountService`: derives display metadata from local auth files, including email, auth mode, last refresh, token expiry, and plan-like hints
- `SwitchService`: performs backup, validation, file replacement, restart, health check, and rollback
- `UsageService`: computes a local quota summary from available local state
- `AuditService`: persists switch logs and errors

## Data Model

### Snapshot

- `id`
- `label`
- `createdAt`
- `updatedAt`
- `email`
- `plan`
- `authMode`
- `lastRefresh`
- `tokenExpiry`
- `sourcePaths`
- `notes`

### Stored Snapshot Payload

- copied `auth.json`
- copied `config.toml` when present
- copied `.codex-global-state.json` when present
- metadata manifest JSON

### Audit Entry

- `id`
- `timestamp`
- `action`
- `snapshotId`
- `status`
- `details`

## Switch Flow

1. Detect current Codex state.
2. Validate that the target snapshot contains a parseable `auth.json`.
3. Back up the current live state into a temporary recovery bundle.
4. Stop Codex Desktop processes.
5. Replace `.codex\auth.json` and companion files from the target snapshot.
6. Restart Codex Desktop.
7. Re-read live auth state and verify the active identity matches the intended snapshot.
8. If validation fails, restore the backup and relaunch Codex Desktop.

## Quota And Account View

Because official quota data is out of scope and local inspection did not reveal a reliable billing cache, v1 will show a local quota summary rather than official remaining credits.

### v1 Surface

- account email
- auth mode
- token expiry time
- last refresh time
- inferred plan status when available from local token claims or desktop state
- recent local activity counts from `.codex\sessions` and local logs
- freshness badge: `fresh`, `stale`, or `unknown`

### Messaging

The UI must explicitly label this as local-visible account status, not official billing remaining quota.

## Error Handling

- Missing live auth file: disable switching and offer import
- Invalid snapshot payload: mark snapshot unhealthy
- Desktop restart failure: show retry and rollback
- Identity mismatch after restart: auto-rollback
- File lock issues: retry with exponential backoff before failing

## Security

- Store snapshots only on the local machine
- Avoid printing tokens in logs
- Redact sensitive values in diagnostics
- Use per-file validation before writing

## Testing Strategy

### Automated

- unit tests for auth parsing, JWT decoding, snapshot validation, and usage summary
- unit tests for switch orchestration with mocked filesystem/process adapters
- integration-style tests against temporary directories simulating `.codex`

### Manual

- capture current account as snapshot
- import a second snapshot fixture
- switch between them
- verify backup and rollback on forced failure
- verify UI updates after switch

## Non-Goals For v1

- official billing API integration
- cross-platform support
- cloud sync of snapshots
- background automatic switching rules

## Planned Stack

- Electron
- React
- TypeScript
- Vitest
- Playwright optional later, not required for v1

## Implementation Direction

Bootstrap a standalone Electron + React + TypeScript app in this repo, build the switching engine behind a narrow IPC contract, and keep Codex-specific file handling isolated so later updates only touch adapter code.
