# Codex Account Switcher

A Windows desktop tool for managing multiple local Codex Desktop accounts in one place.

## What it does

- Capture the current Codex account into a reusable local snapshot
- List saved snapshots and switch between them with one click
- Back up the live state before switching
- Roll back the previous switch if verification fails
- Show a local-visible account status summary based on local auth/session/log data

## Important note about quota

This app does **not** call official billing APIs. The status panel shows locally visible information only:

- account email
- auth mode
- plan hint from local token claims
- last refresh time
- token expiry time
- recent local activity counts

It should be treated as a local status view, not authoritative remaining credits.

## Local state used

The current implementation is centered on:

- `%USERPROFILE%\\.codex\\auth.json`
- `%USERPROFILE%\\.codex\\config.toml`
- `%USERPROFILE%\\.codex\\.codex-global-state.json`
- `%LOCALAPPDATA%\\Codex\\Logs`

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
