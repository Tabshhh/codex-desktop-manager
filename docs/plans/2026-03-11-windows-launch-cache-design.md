# Windows Launch And Cache Design

**Date:** 2026-03-11

## Goal

Reduce Windows cache permission errors by launching Codex Desktop using its packaged app identity and by storing this manager's Chromium session cache under a local cache path instead of roaming app data.

## Scope

- detect the Codex Desktop packaged app identifier on Windows
- prefer packaged-app launch over direct `WindowsApps` executable launch
- move this manager's Electron `sessionData` path to a local cache directory
- tighten the account-pool action panel and button widths
- make reset timestamps easier to scan by emphasizing the actual date-time portion

## Why

- the current restart flow launches a Store-installed app by raw executable path, which can drop package identity and trigger Chromium cache permission errors
- Chromium cache directories belong in local cache storage, not roaming profile storage
- the account pool layout still spends too much width on the action panel and action buttons
- reset timestamps are more useful if the actual time stands out from the label

## Expected Result

- Codex restarts through its packaged app entrypoint when available
- this manager uses a local `sessionData` cache path
- Windows cache errors are reduced or eliminated in normal switching flows
- the account-pool layout feels tighter and the reset times are easier to read
