# AGENTS.md

Broadchurch tenant application built on Aether (Nuxt 3 + Vuetify).

## Quick Start

If you're in Cursor Cloud, **the environment is already set up for you.** Do NOT
manually run `nvm install`, `nvm use`, `node init-project.js`, or `npm install`
-- the `environment.json` install step handles all of this automatically,
including pinning Node 20 via nvm. A dev server terminal starts on port 3000.

**Verify it works:** open `http://localhost:3000` in the browser and confirm you
see the app (not a blank page). If the page is blank, see Known Issues below.

## Cursor Cloud Details

Node 20 is required (`.nvmrc`). The `environment.json` install step handles
this via `nvm install 20 && nvm alias default 20` — do not switch Node versions
manually. If you see Node 22 when you first connect, wait for the install step
to complete; it will switch to Node 20. `node` should resolve to v20 in all
terminals after that.

The install step also runs `node init-project.js --local` (creates `.env` if
absent) then `npm install` (which triggers `postinstall` → `nuxt prepare` +
orval codegen). Auth0 is bypassed via `NUXT_PUBLIC_USER_NAME=dev-user` in the
generated `.env`.

**No automated test suite.** Verification is `npm run build` (compile check) and
`npm run format:check` (Prettier). See Verification Commands below.

**Before committing:** always run `npm run format` -- the husky pre-commit hook
runs `lint-staged` with `prettier --check` and will reject unformatted files.

## Manual / Local Setup

Node 20 is required (pinned in `.nvmrc`).

```bash
npm run init -- --local   # creates .env with dev defaults (no Auth0)
npm install               # all deps are public on npmjs.com -- no tokens needed
npm run dev               # dev server on port 3000
```

For the full interactive wizard (project name, Auth0, query server, etc.):

```bash
npm run init              # interactive, or --non-interactive for CI (see --help)
```

## .env Essentials

| Variable                           | Purpose                          | Default                                 |
| ---------------------------------- | -------------------------------- | --------------------------------------- |
| `NUXT_PUBLIC_APP_ID`               | Unique app identifier            | derived from directory name             |
| `NUXT_PUBLIC_APP_NAME`             | Display name                     | derived from directory name             |
| `NUXT_PUBLIC_USER_NAME`            | Set to any value to bypass Auth0 | `dev-user` in local mode                |
| `NUXT_PUBLIC_QUERY_SERVER_ADDRESS` | Query Server URL                 | read from `broadchurch.yaml` if present |
| `NUXT_PUBLIC_GATEWAY_URL`          | Portal Gateway for agent chat    | read from `broadchurch.yaml` if present |
| `NUXT_PUBLIC_TENANT_ORG_ID`        | Auth0 org ID for this tenant     | read from `broadchurch.yaml` if present |

See `.env.example` for the full list.

## Project Structure

| Directory      | Contents                                                      |
| -------------- | ------------------------------------------------------------- |
| `pages/`       | Nuxt pages (`chat.vue` is the agent chat UI)                  |
| `components/`  | Vue components                                                |
| `composables/` | Vue composables (auto-imported by Nuxt)                       |
| `utils/`       | Utility functions (NOT auto-imported -- use explicit imports) |
| `features/`    | Modular feature plugins (globe, entity-lookup, etc.)          |
| `agents/`      | Python ADK agents (each subdirectory is deployable)           |

## Configuration

`broadchurch.yaml` contains tenant-specific settings (GCP project, org ID,
service account, gateway URL, query server URL). It's generated during
provisioning and committed by the `tenant-init` workflow. Don't edit manually
unless you know what you're doing.

## Deploying Agents (Advanced)

Requires `gcloud` CLI authentication and Python packages (pre-installed in the
Cursor Cloud Dockerfile).

```bash
gcloud auth application-default login
adk web agents/maritime_briefer/          # test an agent locally
```

Use the `/deploy_agent` Cursor command to deploy. It reads `broadchurch.yaml`,
deploys to Vertex AI Agent Engine, and registers with the Portal Gateway.

## Verification Commands

```bash
npm run dev          # dev server -- check browser at localhost:3000
npm run build        # production build -- catches compile errors
npm run format       # Prettier formatting (run before committing)
```

There is no automated test runner (no vitest/jest).

## Known Issues

### Blank white page after `npm run dev`

If the server returns HTTP 200 but the page is blank, check the browser console
for `SyntaxError` about missing exports. This is caused by Nuxt's auto-import
scanner incorrectly detecting function parameters in `utils/` as exports.

**Fix:** `nuxt.config.ts` uses an `imports:dirs` hook to remove `utils/` from
the scan list. Verify the hook is present -- `imports.dirs` config alone does NOT
work because Nuxt always scans `composables/` and `utils/` by default and `dirs`
only adds to that list.

### `EBADENGINE` warning during `npm install`

orval declares `engines: { node: ">=22.18.0" }` but the project uses Node 20.
The warning is cosmetic -- orval works fine on Node 20. Ignore it.

### Duplicated `themeColors` import warning

`nuxt prepare` and `npm run dev` print a warning about duplicated `themeColors`
imports from two composables. This is benign -- Nuxt picks one and the app
works correctly.

### `npm run format:check` exits non-zero

`examples/nuxt-modules/nuxt-module-conversion-example.ts` contains embedded JSON
that Prettier can't parse. It's listed in `.prettierignore` so `format:check`
should pass. If it doesn't, verify `.prettierignore` exists. The pre-commit hook
(`lint-staged`) only checks staged files, so this is rarely an issue.

### Formatting

Pre-commit hook runs `lint-staged` with Prettier. Run `npm run format` before
committing to avoid failures.
