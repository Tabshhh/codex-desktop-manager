# Codex Desktop Manager

[简体中文](./README.md) | English

A Windows desktop tool for managing multiple local Codex Desktop accounts, snapshots, and quota refresh in one place.

## What it does

- Capture the current Codex account into a reusable local snapshot
- List saved snapshots and switch between them with one click
- Back up the live state before switching
- Roll back the previous switch if verification fails
- Show the current live account status from local Codex session data
- Refresh per-snapshot quota using the saved account auth state
- Remember the desktop window size and position between launches

## Quota behavior

This project uses two different quota sources:

- The current live account page uses locally visible Codex session metadata.
- Saved snapshot quota refresh uses the account auth state saved inside that snapshot to request the Codex usage endpoint.

This is intended to mirror the practical account-switching workflow, not to serve as an official billing dashboard.

## Local state used

The current implementation is centered on:

- `%USERPROFILE%\\.codex\\auth.json`
- `%USERPROFILE%\\.codex\\config.toml`
- `%USERPROFILE%\\.codex\\.codex-global-state.json`
- `%LOCALAPPDATA%\\Codex\\Logs`

Runtime preferences and app-local state such as remembered window size are stored under Electron `userData`, not in the repository.

## Open-source safety

- Do not commit real `auth.json`, tokens, logs, or local snapshots.
- This repository is intended to stay publish-safe; any runtime-sensitive files should remain outside source control.
- Test fixtures use synthetic data only.
- A clean clone can build and open the UI without local Codex auth; quota and account data simply remain unavailable until a real local Codex login exists on that machine.

## Development

```bash
npm install
npm test
npm run build
```

## Run in development

```bash
npm run dev
```

## Current limitations

- Windows only
- Uses local snapshot switching instead of official account APIs
- Codex Desktop storage changes may require adapter updates later

## License

[MIT](./LICENSE)
