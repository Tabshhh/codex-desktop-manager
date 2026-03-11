# Codex Quota Detection Design

**Date:** 2026-03-11

**Goal**

Extend the account switcher so it shows Codex-style quota details for the active account, prioritizing locally cached client data for:

- remaining 5-hour quota
- weekly quota usage percentage or remaining percentage

## Problem

The current app only derives:

- account email
- auth mode
- token expiry
- a plan hint
- recent local activity counts

That is useful for identity checks, but it does not answer the user-facing question that matters during switching: "How much Codex quota is left on this account right now?"

## What We Know

### Existing State

The current implementation reads:

- `%USERPROFILE%\\.codex\\auth.json`
- `%USERPROFILE%\\.codex\\config.toml`
- `%USERPROFILE%\\.codex\\.codex-global-state.json`
- `%LOCALAPPDATA%\\Codex\\Logs`

The UI labels this as a local-visible summary and does not attempt true quota detection yet.

### Newly Observed Local Signals

Investigation of the local machine showed:

- the `id_token` contains subscription metadata such as `chatgpt_plan_type`, but not actual remaining quota
- Codex logs confirm the app refreshes auth context and knows plan presence, but do not obviously log remaining quota values
- Electron storage under `%APPDATA%\\Codex` includes `Local Storage\\leveldb`, `Session Storage`, `Network`, and cache directories that are likely to contain cached quota state if the client renders it

This means plan detection and quota detection are separate problems.

## Requirements

### Primary Requirement

Show the same class of quota information that Codex Desktop shows locally:

- remaining quota for the recent 5-hour window
- weekly quota usage or remaining percentage

### Secondary Requirement

Do not require remote billing APIs or user credentials beyond existing local client state.

### Fallback Requirement

If true quota data cannot be located for a given account, the app should degrade clearly and honestly instead of showing a misleading synthetic number as if it were real.

## Approaches Considered

### 1. Continue Using Token Claims Only

Read `plan` and subscription metadata from `id_token` and infer quota heuristically.

**Pros**

- easy to implement
- stable local file

**Cons**

- does not expose actual remaining quota
- would mislead users by confusing subscription tier with current allowance

### 2. Scan Local Codex Caches For Quota Snapshots

Search Electron local storage and other local client caches for quota-related JSON and surface that directly.

**Pros**

- best chance of matching what Codex Desktop itself displays
- still fully local
- works with the user's stated requirement

**Cons**

- storage format may change over time
- may require defensive parsing across multiple candidate files

### 3. Estimate Quota From Usage History

Count local sessions or activity in the last 5 hours and week, and estimate remaining budget.

**Pros**

- always available
- independent of opaque client storage

**Cons**

- very unlikely to match Codex Desktop accurately
- easy to overstate confidence

## Recommended Approach

Use approach 2 first, with transparent fallback behavior.

The app should attempt to extract a real quota snapshot from local Codex client storage. If that succeeds, the UI should display it as local cached quota. If not, the app should show quota as unavailable and retain the existing local-visible activity summary. Estimation should be optional later, not bundled into the first quota release.

## Proposed Architecture

### New Service

Add a dedicated quota-reading service in the main process that:

- scans a small set of local Codex storage roots
- extracts readable strings from candidate files
- looks for quota-shaped JSON fragments or records
- normalizes any discovered quota data into a typed summary

### Data Flow

1. `desktop-api.ts` resolves Codex runtime paths.
2. A new quota reader inspects `%APPDATA%\\Codex` local storage roots.
3. The reader returns either a normalized quota snapshot or `null` when no reliable quota data is found.
4. `usage-service.ts` merges the quota snapshot into the existing local usage summary.
5. The renderer shows quota values when present and an honest fallback when absent.

## Parsing Strategy

The first implementation should stay conservative:

- inspect `Local Storage\\leveldb` text-bearing files first
- search for quota-related keys and JSON payloads
- prefer exact values over derived ones
- capture source metadata so the UI can label the values as local cached quota

The parser should not try to decode arbitrary binary formats beyond simple string extraction in v1 of this feature.

## UI Behavior

When quota data is found, show:

- 5-hour remaining quota
- weekly usage or remaining percentage
- a small note that this comes from local cached Codex client data

When quota data is not found, show:

- quota unavailable
- existing local status summary
- no fabricated percentage

## Error Handling

- unreadable cache files: ignore and continue scanning
- malformed JSON fragments: ignore and continue scanning
- stale cache data: include a freshness hint if a timestamp is available
- multiple matches: choose the most complete and most recent record

## Testing Strategy

### Automated

- add fixture-like tests for parsing quota fragments from text blobs
- test fallback when no quota fields exist
- test summary merging so existing usage UI remains stable

### Manual

- open Codex Desktop and view quota
- switch to a saved account in the switcher app
- confirm the app shows matching 5-hour and weekly quota values when cache data exists
- verify accounts without discoverable quota cache show a clear unavailable state

## Non-Goals For This Iteration

- official remote quota APIs
- exact server-authoritative billing guarantees
- synthetic quota estimation presented as real data
