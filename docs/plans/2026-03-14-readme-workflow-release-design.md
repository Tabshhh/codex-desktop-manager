# README Workflow And Release Design

**Context**

The repository landing pages currently describe features and limits, but they do not show a simple end-to-end usage flow. The repository also has a fresh switch rollback fix that should ship as a new Windows package instead of reusing the existing `0.1.1` version number.

**User Goal**

Ship an updated build that:

- explains the practical usage flow on both landing pages
- keeps the Chinese and English README structure aligned
- produces new Windows artifacts with a distinct patch version

**Approach Options**

## Option 1: Add a compact workflow section directly to both README files

- Add a 5-step or 6-step usage flow after the feature overview.
- Keep the existing screenshots and section order stable.
- Bump the package version for the new packaged artifacts.

Pros:

- smallest documentation change
- best fit for GitHub landing pages
- low maintenance

Cons:

- detailed troubleshooting still lives outside the README

## Option 2: Add a short README summary plus a separate guide in `docs/`

- Keep README brief and link to a dedicated usage guide.

Pros:

- scales better for longer docs later

Cons:

- higher maintenance
- more clicks for first-time visitors

**Recommendation**

Use Option 1. It matches the user request for a homepage update, keeps the repository front page readable, and fits naturally with a patch release that packages the latest switch rollback fix.

**Design**

- Add a mirrored `使用流程` / `Workflow` section to `README.md` and `README.en.md`.
- Cover the real switching path in order: sign in within Codex Desktop, capture the current account, sign in to more accounts and capture them, switch with one click, rollback on failure, refresh usage when needed.
- Bump the app version from `0.1.1` to `0.1.2` so packaged artifacts are unambiguous.
- Add a `docs/releases/v0.1.2.md` note summarizing the rollback fix and README workflow documentation.

**Validation**

- Run `npm test`
- Run `npm run build`
- Run `npm run release:win`
- Confirm the `release/` directory contains new `0.1.2` Windows artifacts
