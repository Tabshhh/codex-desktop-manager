# Snapshot Resilience And Delete Design

**Date:** 2026-03-11

## Goal

Make the account pool resilient to incomplete snapshot folders, add a safe local snapshot delete action, and expose the 5-hour and weekly reset timestamps in the account pool.

## Scope

- skip incomplete snapshot folders only when required login metadata cannot be read
- keep loading valid accounts even when quota data is missing or stale
- add a local-only delete action for saved snapshots
- show `5h reset` and `Weekly reset` as concrete timestamps on each saved account card

## Why

- the current list flow fails the whole page if one snapshot directory is temporarily incomplete
- quota data is optional and should not make an otherwise valid saved account disappear
- users need a way to clean up stale saved accounts without touching the live Codex login
- reset timestamps are more actionable than percentages alone when choosing which account to switch to

## Expected Result

- account pool still loads when one snapshot folder is broken
- only truly unusable snapshots are skipped
- users can delete a saved snapshot with a lightweight confirmation
- each account card shows the next 5-hour and weekly reset times when quota exists
