# UI Navigation And Quota Visualization Design

**Date:** 2026-03-11

## Goal

Rework the renderer so the app feels like a focused desktop utility instead of a long mixed dashboard. The user wants:

- brighter and more legible quota emphasis
- subdued but still distinct refresh timestamps
- a one-click refresh-all action for all saved accounts
- a split between account-pool operations and current live account status
- a single-screen layout without the page-level right-side scrollbar

## Current Problems

The current UI mixes three different concerns into one page:

- snapshot management
- saved-account quota comparison
- current live Codex status

That makes the mental model muddy. It also causes layout growth that pushes the whole document taller than the viewport, producing the page scrollbar the user wants removed.

## Requirements

### Functional

- Add a navigation bar with two pages:
  - Account Pool
  - Current Account Status
- Move `capture current` into the Account Pool page.
- Add `Refresh all quotas`.
- Keep per-account `Refresh quota`.
- Continue refreshing accounts independently, without aborting the batch when one account fails.

### Visual

- Quota values should be brighter and more prominent than surrounding metadata.
- Refresh timestamps should be visible but lower-contrast than the quota values.
- Percentages should also be visualized using progress bars.
- The app should present as a single viewport page without global page scrolling in normal use.

## Approaches Considered

### 1. Top Tabs With Page-Specific Content

Use a compact tab navigation and render one page at a time.

**Pros**

- cleanest separation of concerns
- easiest way to keep the app within one screen
- simplest mental model for the user

**Cons**

- requires some component reshaping

### 2. One Page With Sections

Keep a single page and visually separate sections more clearly.

**Pros**

- smaller refactor

**Cons**

- still mixes responsibilities
- much harder to eliminate global scrolling

### 3. Sidebar Navigation Shell

Introduce a larger application shell with side navigation.

**Pros**

- scalable if many future pages appear

**Cons**

- heavier than needed for a two-page desktop utility

## Recommended Approach

Use top tabs with two focused pages.

This gives the user the clearest split between:

- managing and comparing saved accounts
- inspecting the currently active desktop account

It also makes it straightforward to keep the full app height locked to the viewport while allowing only the account list area to scroll if many snapshots exist.

## Proposed UI

### Global Shell

- Hero stays at the top.
- A small navigation strip sits under the hero.
- The content area below switches between two views.

### Account Pool Page

- Top action row:
  - capture current
  - rollback last switch
  - refresh all quotas
- Snapshot cards:
  - label
  - email
  - highlighted quota summary
  - two progress bars:
    - 5h remaining
    - weekly used
  - muted refresh timestamp
  - per-card buttons:
    - refresh quota
    - switch
- The snapshot list becomes the only vertically scrollable area on this page when needed.

### Current Account Status Page

- Focus only on the live account and current local status.
- Reuse the stronger quota visual language:
  - bright figures
  - progress bars
  - secondary timestamp styling
- No capture controls here.

## Visual Language

### Quota Emphasis

- Use a brighter accent color for the main quota figures.
- Use a softer secondary color for timestamp text.
- Keep labels muted.

### Progress Bars

- 5h remaining bar should communicate available headroom.
- Weekly bar should show used percentage.
- High remaining can lean aqua/green.
- Lower remaining can transition toward amber.

## Batch Refresh Behavior

- `Refresh all quotas` runs through snapshots sequentially.
- If one refresh fails:
  - continue with the rest
  - keep per-card state honest
  - surface the failure in the affected card or banner
- Busy state should prevent duplicate batch starts.

## Layout And Scrolling

- Lock `html`, `body`, `#root`, and the app shell to viewport height.
- Hide page-level overflow.
- Give the active page a bounded layout.
- Only the account list region should scroll when content exceeds available space.

## Testing Strategy

- Update renderer tests to cover:
  - tab navigation
  - capture shown only on Account Pool
  - refresh-all action
  - per-account refresh buttons
  - progress-bar rendering
- Keep existing quota-refresh behavior tests intact.
- Run full renderer and relevant main-process tests plus build verification.
