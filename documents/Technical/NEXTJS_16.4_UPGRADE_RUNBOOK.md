# Next.js 16.1.6 → 16.4.6 Security Upgrade Runbook

> **Audience:** a coding agent (or developer) executing this upgrade in the SAMS frontend repository.
> **Status:** EXECUTED on branch `chore/next-16.4.6-security-upgrade` (2026-11-14) through §6; §5.3 browser test blocked on test credentials; not yet committed/pushed. Baseline numbers below were measured on `main` at commit `5f896733` on 2026-11-14.
> **Scope:** dependency upgrade + verification only. Do **not** fix unrelated pre-existing failures, do not refactor, do not touch `.env*`.

---

## 0. Why we are doing this

The repository runs **Next.js 16.1.6**, which sits inside the vulnerable range of several GitHub Security Advisories. Upgrading to **16.4.6** (latest stable, released 2026-11-09) closes all of them with a single minor-version bump.

| Advisory | Severity | Applies to this repo? | Fixed in |
|---|---|---|---|
| GHSA-673q-mjm6-r5xr — RCE via `use cache` returning typed arrays (React Flight) | Critical | Indirectly (no `use cache` in source, but Vercel says upgrade regardless) | 16.4.1 |
| GHSA-2464-fhr4-w9xw — RCE in Image Optimization (SVG, via `sharp` < 0.35.5) | Critical | **Yes** — `next/image` in 24 files, `images.remotePatterns` configured, Next's nested `sharp` is 0.34.5 | 16.4.1 |
| GHSA-2xp9-vwfh-vxw4 — RCE in Image Optimization (AVIF / libheif) | Critical | **Yes** — same reason | 16.3.3 |
| GHSA-p3m5-59mp-jv5r — DoS via Server Actions | High | **Yes** — `action/app-actions.ts` is a `'use server'` module | 16.4.1 |
| GHSA-cjq9-62q9-8jv4 — SSRF in Image Optimization via allow-listed hosts | High | **Yes** — 6 hosts in `remotePatterns` | 16.3.8 |
| GHSA-p293-qw3h-jr36 — RCE on Windows-hosted servers | Critical | Only if hosted on Windows (Vercel = no) | 16.3.3 |
| 16.4.5 batch — `use cache` cross-tenant leaks, response injection in self-hosted apps | Various | Mostly no (`use cache` unused), harmless to take | 16.4.5 |

`react-server-dom-*` (the React Flight runtime named in the advisory) is **not** a direct dependency. It is vendored inside the `next` package (`node_modules/next/dist/compiled/react-server-dom-*`), so upgrading `next` is what fixes it.

---

## 1. Repository facts the agent must know

| Fact | Value | Why it matters |
|---|---|---|
| Package manager | **yarn 1.22.22** (`packageManager` field in `package.json`) | Use `yarn`, not `npm`, for every install step |
| Lockfiles | `yarn.lock` **and** `package-lock.json` are both committed, both at 16.1.6 | If only one is updated, a deploy that picks the other ships 16.1.6 again. See §3.3 |
| `.npmrc` | `legacy-peer-deps=true` | Only affects npm; yarn ignores it |
| Node | v26.13.0 locally; Next 16.4.6 needs ≥ 20.9 | OK. Node 26 prints `DEP0205 module.register()` deprecation warnings during build — **pre-existing, ignore** |
| Hosting | Vercel (`.env.local` contains `VERCEL_OIDC_TOKEN`; `.vercel/` dir present). Branches: `main` (preview/dev) → `prod` | Verify the Vercel build log after deploy, not just local |
| Backend | External API chosen by `NEXT_PUBLIC_ENVIRONTMENT` (misspelling is intentional) → `NEXT_PUBLIC_DEVELOPMENT_API` / `NEXT_PUBLIC_PRODUCTION_API` | Browser smoke tests need the dev backend reachable and a test login |
| Auth | Custom login → `POST` to backend via `lib/api/auth/postLogin.ts`, tokens in `localStorage`, Redux auth state. `next-auth` is only wired as `SessionProvider` + `/api/auth/[...nextauth]` route | Login smoke test = fill form at `/en/auth/login` |
| i18n | `next-intl`; locales `en`, `ar` (`config/index.ts`); `proxy.ts` is the middleware (Next 16 convention, already migrated) | Test both locales; `ar` must render `dir="rtl"` |
| Caching features | **None**: no `use cache`, no `cacheComponents`, no `experimental.*`, no route segment config exports (`dynamic`, `revalidate`…) | Nothing removed in 16.2–16.4 is used by this repo |
| Postinstall | `scripts/patch-next-themes.js` patches `next-themes` (not Next). Runs on every `yarn install` | Must still print "✅ Patched next-themes" after reinstall |
| Legacy script | `scripts/patch-next-dev.js` targets Next **14.x** internals and is **not** wired to any npm script | Inert. Do not run it. Leave it alone (out of scope) |
| Direct `sharp` dep | `sharp ^0.33.4` in `dependencies`, **never imported** in source | Remove it so the only `sharp` is the 0.35.5 that Next 16.4.6 pins |
| Peer deps | `next-intl 4.9.0` (`^16.0.0`), `next-auth 5.0.0-beta.30` (`^16.0.0`), `nextra 4.6.1` (`>=14`) | All already accept Next 16.x — no companion upgrades needed |
| Tests | Vitest, `lib/**/*.test.ts`, Node env only. No component/E2E tests exist | Browser verification is manual/agent-driven (see §5) |

---

## 2. Baseline (measured on 16.1.6, 2026-11-14) — compare everything against this

The agent **must re-run** these on its own machine before touching anything, and record the results. Any difference between the agent's baseline and the table below should be noted but is not a blocker.

| Gate | Command | Baseline result |
|---|---|---|
| Install | `yarn install --frozen-lockfile` | OK, postinstall prints `✅ Patched next-themes` ×2 (index.js, index.mjs) |
| Typecheck | `npx tsc --noEmit` | **6 errors**, all in `lib/api/master/aircraft-engine/aircraftEngine.completeness.test.ts` (TS2554 ×3, TS2367 ×3). Pre-existing |
| Unit tests | `yarn test` | 30 files / 323 tests. **4 files, 10 tests FAIL — pre-existing** (see list below) |
| Lint | `yarn lint` | **Broken** — `next lint` was removed in Next 16, so the CLI treats `lint` as a directory. Pre-existing; **not a gate** |
| Build | `yarn build` | **Success** in ~37 s. `✓ Compiled successfully in 13.5s`, 5 static pages, **56 routes** (all `ƒ` dynamic except `/_not-found`, `/icon.png`, `/apple-icon.png`), `ƒ Proxy (Middleware)` listed |

Pre-existing failing tests (do **not** fix in this change; only confirm the set does not grow):

```
lib/api/qa/authorization/authority-auth.status.test.ts        1 failed
lib/api/qa/authorization/customer-auth.test.ts                1 failed
lib/api/master/aircraft-engine/aircraftEngine.api.test.ts     2 failed
lib/api/master/aircraft-engine/aircraftEngine.completeness.test.ts  6 failed
```

HTTP smoke baseline (production build, `yarn start`, measured with curl — these are the numbers §5.1 compares against):

| Request | Baseline (16.1.6) | Note |
|---|---|---|
| `GET /` | **307** → `/en` | proxy middleware |
| `GET /en` | 200 | |
| `GET /ar` | **500** | **pre-existing bug**: `messages/ar.json` does not exist (only `en.json`), so every `/ar/*` route throws `Cannot find module '../messages/ar.json'`. Not an upgrade regression. See §9 |
| `GET /en/auth/login` | 200, body contains password field, `dir="ltr"` | |
| `GET /ar/auth/login` | **500** | same pre-existing cause |
| `GET /en/confirm-attendance` | 200 | public page |
| `GET /en/this-route-does-not-exist` | **200** (not 404) | pre-existing: catch-all page calls `notFound()` but the HTTP status observed is 200; body is the not-found UI |
| `GET /api/auth/providers` | 200 `application/json` | next-auth route |
| `GET /_next/image?url=%2Fsams-logo-new.png&w=256&q=75` | 200 `image/png` | sharp pipeline works (curl sends no `Accept`, so png not webp) |
| `GET /_next/image?url=%2Fvercel.svg&w=64&q=75` | **400** | SVG optimisation blocked (`dangerouslyAllowSVG` unset) |
| `GET /_next/image?url=https%3A%2F%2Fnot-allowed.example.com%2Fx.png…` | **400** | `remotePatterns` enforced |
| `GET /_next/image?url=https%3A%2F%2Fflight-storage.sams.aero%2Fx.png…` | 403 | host allow-listed → request forwarded, upstream denies the fake path. Anything but 400 is fine |

Save the baseline build log for later diffing:

```bash
yarn build 2>&1 | tee /tmp/sams-baseline-build.log
grep -E "^[├└┌] [ƒ○●] " /tmp/sams-baseline-build.log | sed 's/^[├└┌] //' | sort > /tmp/sams-baseline-routes.txt
wc -l /tmp/sams-baseline-routes.txt   # expect 56
```

---

## 3. Upgrade procedure

### 3.1 Preconditions

```bash
git status --porcelain          # must be empty
git checkout main && git pull
git checkout -b chore/next-16.4.6-security-upgrade
node -v                         # >= 20.9
yarn -v                         # 1.22.x
```

Stop any running `yarn dev` / `yarn start` first (they hold `.next/`).

### 3.2 Bump dependencies

```bash
yarn add next@^16.4.6 eslint-config-next@^16.4.6 react@~19.2.9 react-dom@~19.2.9
yarn remove sharp
```

Notes:
- Use `~19.2.9`, not `^19.2.9`: the caret resolves to React **19.3.1** (a new minor). `react`/`react-dom` 19.2.9 is the patched line matching the vendored RSC runtime. Same minor as today (19.2.4) → no API change. `@types/react` / `@types/react-dom` stay as they are.
- `yarn remove sharp` removes the unused top-level copy. Next 16.4.6 declares `sharp ^0.35.5` as its own optional dependency and will install it under `node_modules/sharp` (hoisted) or `node_modules/next/node_modules/sharp`.
- Do **not** add `--ignore-scripts`; the postinstall patch must run.

### 3.3 Lockfile policy (decide once, state it in the MR)

**Default (recommended): keep `yarn.lock` as the single source of truth and delete `package-lock.json`.**

```bash
git rm package-lock.json
```

Rationale: `packageManager` says yarn; two lockfiles that drift is exactly how a security patch silently fails to ship.

**Alternative (only if the team insists on keeping npm support):** regenerate it so both lockfiles agree.

```bash
npm install --package-lock-only --ignore-scripts
grep -A1 '"node_modules/next"' package-lock.json | grep version   # must say 16.4.6
```

Either way, after deploy confirm in the Vercel build log which installer ran and that it printed Next 16.4.6 (§6).

### 3.4 Verify what was actually installed

```bash
node -e '
const v=p=>require(`./node_modules/${p}/package.json`).version;
const out={next:v("next"),react:v("react"),"react-dom":v("react-dom"),"eslint-config-next":v("eslint-config-next")};
try{out["sharp(hoisted)"]=v("sharp")}catch{out["sharp(hoisted)"]="absent"}
try{out["sharp(nested in next)"]=v("next/node_modules/sharp")}catch{out["sharp(nested in next)"]="absent"}
console.log(JSON.stringify(out,null,2))'
```

Expected:

| Package | Expected |
|---|---|
| next | `16.4.6` |
| react, react-dom | `19.2.9` |
| eslint-config-next | `16.4.6` |
| sharp (hoisted **or** nested) | `>= 0.35.5` — at least one location must exist and satisfy this |

Also:

```bash
grep -nA1 '^next@' yarn.lock          # version "16.4.6"
grep -nA1 '^sharp@' yarn.lock         # only ^0.35.x entries remain
yarn why sharp                        # must be required by "next" only
grep -rn "sharp" package.json         # no match
```

If `sharp` resolves to anything below 0.35.5, **stop**: the SVG RCE (GHSA-2464) is not closed. Run `yarn install --force` and re-check before continuing.

---

## 4. Static verification gates

Run in this order. Each gate's pass criterion is **"no regression versus §2"**, not "everything green" — the repo has known pre-existing failures.

### 4.1 Typecheck

```bash
npx tsc --noEmit 2>&1 | tee /tmp/sams-tsc-after.log | grep -c "error TS"
```

- **PASS:** exactly 6 errors, all in `aircraftEngine.completeness.test.ts`.
- **FAIL:** any error in a non-test file, or any new file in the list → investigate; it is almost certainly a type change in `next` (e.g. `next/navigation`, `next/server`, `next/image` props). Fix minimally and note it in the MR.

### 4.2 Unit tests

```bash
yarn test 2>&1 | tee /tmp/sams-test-after.log | tail -8
```

- **PASS:** `Test Files 4 failed | 26 passed (30)` and `Tests 10 failed | 313 passed (323)`, same four files as §2.
- **FAIL:** any additional failing file/test. (Note: these tests are pure Node logic and don't import `next`, so a change here would be surprising — if it happens, suspect `react` or a transitive dependency and check `git diff yarn.lock`.)

### 4.3 Production build

```bash
rm -rf .next
yarn build 2>&1 | tee /tmp/sams-after-build.log
grep -E "^[├└┌] [ƒ○●] " /tmp/sams-after-build.log | sed 's/^[├└┌] //' | sort > /tmp/sams-after-routes.txt
diff /tmp/sams-baseline-routes.txt /tmp/sams-after-routes.txt && echo "ROUTE TABLE IDENTICAL"
```

- **Known change in 16.4 (found during execution on 2026-11-14):** the build's "Running TypeScript" step now type-checks every file in `tsconfig.json` `include`, including Vitest files. 16.1.6 did not. The 6 pre-existing errors in `aircraftEngine.completeness.test.ts` therefore fail the build with `Failed to type check.` Fix applied: `tsconfig.build.json` (extends the root config, excludes `**/*.test.ts(x)`) plus `typescript.tsconfigPath: "tsconfig.build.json"` in `next.config.mjs`. `tsc --noEmit` and the editor still use the root tsconfig, so test files stay type-checked there. Do **not** use `typescript.ignoreBuildErrors`.
- Build time: on an 8 GB machine already deep in swap, with Spotlight indexing the fresh `node_modules`, compile took ~13–15 min versus 13.5 s at baseline. That is machine load, not Next. Judge build time on Vercel, not on such a machine.
- **PASS:** log contains `▲ Next.js 16.4.6`, `✓ Compiled successfully`, `ƒ Proxy (Middleware)`, 56 routes, route table diff is empty, exit code 0.
- Expected noise (ignore): Node `DEP0205` deprecation lines.
- **FAIL:** build error, route missing, or a route that changed from `ƒ` to `○` (would mean rendering mode changed — investigate before continuing).
- Build time should stay roughly 30–60 s. A build that hangs > 5 min: kill it, `rm -rf .next node_modules/.cache`, retry once, then report.

### 4.4 Lint (informational only)

`yarn lint` is broken before and after (pre-existing). Do **not** fix the `lint` script in this MR; mention it as follow-up in the report.

---

## 5. Runtime verification

### 5.1 HTTP-level smoke test (no login, no backend needed)

Run against the **production build** (`yarn start` uses the `.next` output from §4.3). Run this twice: once before the upgrade for a baseline if time allows, once after.

```bash
yarn start -p 3000 > /tmp/sams-start.log 2>&1 &
sleep 5
B=http://localhost:3000
chk() { printf "%-70s -> " "$1"; curl -s -o /dev/null -w "%{http_code} %{content_type} %{redirect_url}\n" "$1"; }

chk "$B/"                                              # expect 307 → /en  (proxy middleware)
chk "$B/en"                                            # expect 200
chk "$B/ar"                                            # baseline 500 (pre-existing: no messages/ar.json). 500 here is NOT a regression; 200 would be a bonus
chk "$B/en/auth/login"                                 # expect 200
chk "$B/ar/auth/login"                                 # baseline 500 (same pre-existing cause)
chk "$B/en/confirm-attendance"                         # expect 200 (public page)
chk "$B/en/this-route-does-not-exist"                  # baseline 200 (pre-existing; body is the not-found UI). 404 would be acceptable too
chk "$B/api/auth/providers"                            # expect 200 application/json
chk "$B/_next/image?url=%2Fsams-logo-new.png&w=256&q=75"                 # expect 200 image/*  ← proves the sharp pipeline loads
chk "$B/_next/image?url=%2Fvercel.svg&w=64&q=75"                         # expect 400  ← SVG optimisation blocked (dangerouslyAllowSVG unset)
chk "$B/_next/image?url=https%3A%2F%2Fnot-allowed.example.com%2Fx.png&w=64&q=75"   # expect 400 ← remotePatterns enforced
chk "$B/_next/image?url=https%3A%2F%2Fflight-storage.sams.aero%2Fx.png&w=64&q=75"  # baseline 403 from upstream; anything except 400 is fine (host is allow-listed)

curl -s "$B/en/auth/login" | grep -oE 'dir="[a-z]+"|lang="[a-z]+"' | sort -u   # expect dir="ltr" and lang="en"
curl -s "$B/en/auth/login" | grep -ci 'password'                              # expect >= 1 (login form rendered)
grep -iE "Connection closed|unhandled" /tmp/sams-start.log                    # expect no output
grep -c "Cannot find module '../messages/ar.json'" /tmp/sams-start.log        # expect 2 (one per /ar request above) — pre-existing
kill %1
```

Record every status code in the report and compare with the HTTP baseline table in §2. The three `_next/image` rows are the **security-relevant** ones. The `/ar` rows are pre-existing failures: only report them as a regression if the error message changes.

### 5.2 Dev server (Turbopack) sanity

```bash
yarn dev > /tmp/sams-dev.log 2>&1 &
sleep 8
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/auth/login   # expect 200
grep -iE "error|warn" /tmp/sams-dev.log | grep -v DEP0205 | head             # expect nothing new
kill %1
```

Then do one HMR check in §5.3 (edit a visible string in a page, confirm it hot-reloads, revert the edit).

### 5.3 Browser smoke test (requires dev backend + test account)

Prerequisites — if any is missing, mark this whole section **BLOCKED** (not PASS) and say which:
- `.env` has `NEXT_PUBLIC_ENVIRONTMENT` ≠ `production` and `NEXT_PUBLIC_DEVELOPMENT_API` pointing to a reachable backend.
- A test login (username/password) with broad permissions. Ask the user; **never** print credentials or tokens into logs, the report, or this file.
- A browser the agent can drive (Claude in Chrome tools, or Chrome DevTools MCP) or a human following the steps.

Use `yarn dev` (or `yarn start` after a build). Open DevTools console and network panel before starting. The pass criterion for every step: **page renders, no new console errors, no HTTP 5xx in network.**

| # | Step | URL / action | Expect |
|---|---|---|---|
| 1 | Unauthenticated redirect | open `/en/hr/staff` | redirected to `/en/auth/login` |
| 2 | Login | fill form, submit | redirected to the first viewable route (see `lib/auth/resolveAuthRedirect.ts`); sidebar renders; `localStorage` has `user`, `access_token` |
| 3 | Permission filtering | inspect sidebar | only menus the role may view are shown (compare with `documents/Technical/PERMISSION_CHECKLIST.md`) |
| 4 | Theme toggle | switch dark/light twice, reload | no flash of wrong theme; console has **no** `Encountered a script tag while rendering` (this is what the `next-themes` postinstall patch prevents) |
| 5 | Locale switch | `/en/...` ↔ `/ar/...` | **Known broken before the upgrade** (`/ar/*` → 500, no `messages/ar.json`). Confirm the error is still the same `Cannot find module` message and move on; do not count as regression |
| 6 | Dashboard | `/en/production-planner/dashboard` | charts render (ApexCharts / Chart.js / Recharts) |
| 7 | Flight list | `/en/flight/list` | table loads from API, pagination works |
| 8 | Flight timeline (fullscreen layout) | `/en/views-flight-timeline` | Planby timeline renders (uses `PLANBY_LICENSE_KEY`) |
| 9 | THF create | `/en/flight/thf/create` | form renders; dynamic imports (`next/dynamic`, 9 files, 6 with `ssr:false`) load without chunk errors |
| 10 | Staff list + detail | `/en/hr/staff` → open a staff → `/en/hr/staff/[id]` | profile loads; **staff photo renders** (goes through `/_next/image` → `flight-storage.sams.aero`); Employee Profile preview/print renders |
| 11 | Export paths | any page with Export/PDF/Excel buttons (e.g. staff detail, roster) | file downloads (jspdf / xlsx / exceljs / docx are client-side; this checks bundling) |
| 12 | Roster | `/en/roster/flight-roster`, `/en/roster/manpower` | calendars (FullCalendar) render, navigation between weeks works |
| 13 | QA | `/en/qa/authorization`, `/en/qa/training-scheduler` | matrices/tables render; drag-and-drop (dnd-kit) works where present |
| 14 | Master data (write path) | `/en/master-data/role` or `/en/master-data/station` | open an edit dialog, **cancel** (no real write needed) — Radix dialogs mount/unmount cleanly |
| 15 | Permission page | `/en/master-data/set-permission` | tree renders, toggling a child recalculates parent (pure logic, but confirms UI) |
| 16 | Route guard | with a low-privilege role, open a route the role lacks | `RoutePermissionGuard` redirects/blocks as before |
| 17 | HMR (dev only) | edit a visible string, save, revert | hot reload applies without full-page reload errors |
| 18 | Logout | header menu → logout | back on `/en/auth/login`; `localStorage` cleared |

Across all steps, filter the console for `Hydration`, `Connection closed`, `ChunkLoadError`, `Rendered more hooks` — none may appear.

If Claude in Chrome is available, record steps 2, 4, 10 as a GIF (`nextjs-16.4.6-smoke.gif`) for the MR.

---

## 6. Security closure check

```bash
# 1. advisories still open for the installed version — expect EMPTY output
V=$(node -p "require('./node_modules/next/package.json').version")
gh api "/advisories?ecosystem=npm&affects=next@$V&per_page=20" \
  --jq '.[] | "\(.ghsa_id) [\(.severity)] \(.summary)"'

# 2. sharp actually used by Next >= 0.35.5 (repeat of §3.4, keep as evidence)
node -e 'for (const p of ["sharp","next/node_modules/sharp"]) { try { console.log(p, require(`./node_modules/${p}/package.json`).version) } catch { console.log(p, "absent") } }'

# 3. dependency audit — report critical/high only; pre-existing unrelated findings go in the report, not in this MR
yarn audit --level high 2>&1 | tail -20
```

**PASS:** step 1 prints nothing for the seven advisories in §0 (other, unrelated advisories against 16.4.6 would be new information — report them). Step 2 shows ≥ 0.35.5.

---

## 7. Commit, MR, deploy

### 7.1 Commit

Keep it to **one** commit for the dependency change (plus at most one tiny follow-up commit if a type fix was unavoidable in §4.1).

Files expected in the diff: `package.json`, `yarn.lock`, and `package-lock.json` (deleted or regenerated). Nothing else unless §4.1 forced a fix. Run `git diff --stat` and justify every other file.

```bash
git add package.json yarn.lock package-lock.json
git commit -m "chore(deps): upgrade next to 16.4.6 and react to 19.2.9 for security advisories

Closes GHSA-673q-mjm6-r5xr, GHSA-2464-fhr4-w9xw, GHSA-2xp9-vwfh-vxw4,
GHSA-p3m5-59mp-jv5r, GHSA-cjq9-62q9-8jv4, GHSA-p293-qw3h-jr36.
Removes unused direct sharp dependency so Next's own sharp >= 0.35.5 is the only copy.
Removes package-lock.json; yarn.lock is the single lockfile (packageManager = yarn).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin chore/next-16.4.6-security-upgrade
```

Adjust the lockfile sentence if the alternative in §3.3 was chosen.

### 7.2 Merge request (GitLab)

Target `main`. The description must contain: the §0 table, the §2-vs-§4 comparison, the §5.1 status-code table, the §5.3 table with PASS/FAIL/BLOCKED per row, the §6 output, and the lockfile decision. Name the product **SAMS Engineering Maintenance System** (repository naming rule).

### 7.3 Vercel preview

After push, open the Vercel deployment for the branch and check the build log for:
- the installer line (`yarn install` — or `npm` if the alternative lockfile policy was chosen) and **no** "multiple lockfiles" warning,
- `▲ Next.js 16.4.6`,
- `✓ Compiled successfully`,
- same route count as local.

Repeat §5.1 against the preview URL (replace `B=`). `/_next/image` rows must behave identically.

### 7.4 Promote

1. Merge MR into `main` → Vercel preview/dev deployment → re-run §5.1 and a short §5.3 (steps 2, 4, 10, 18).
2. Merge `main` into `prod` (existing flow: `Merge branch 'main' into 'prod'`) → production deployment.
3. Within the first hour and again after 24 h: check Vercel runtime logs for `HTTP 500` with message **`Connection closed.`** — that signature is associated with exploitation attempts of the Flight/`use cache` bug. Any hit → notify the security owner with timestamps and request IDs.

---

## 8. Rollback

Framework-only change, so rollback is a revert:

```bash
git revert <merge-commit-sha>     # on main (and on prod if already promoted)
git push
```

Vercel alternative: "Promote previous deployment" on the last known-good 16.1.6 build. Rolling back **re-opens** every advisory in §0, so treat it as temporary and re-attempt within 24 h with the failure root-caused.

---

## 9. Out of scope (report as follow-ups, do not do here)

- Fixing the 10 pre-existing failing tests and the 6 TypeScript errors in `aircraftEngine.completeness.test.ts`.
- Replacing the dead `lint` script (`next lint` no longer exists; the repo still has a legacy `.eslintrc.json` with `eslint` 9).
- Deleting `scripts/patch-next-dev.js` (targets Next 14, unused).
- Fixing the `NEXT_PUBLIC_ENVIRONTMENT` spelling (contract with deployment config).
- The `ar` locale: every `/ar/*` route returns 500 because `messages/ar.json` is missing. Either add the file or drop `ar` from `config/index.ts` and the `proxy.ts` matcher.
- The catch-all not-found page returns HTTP 200 instead of 404.
- Updating `documents/Technical/PROJECT_KNOWLEDGE.md` §15 (its test counts are stale) — a one-line note that Next is now 16.4.6 **is** in scope if the agent touches that file anyway.

---

## 10. Report template (fill in and paste into the MR)

```
### Upgrade report — Next.js 16.1.6 → 16.4.6

Machine: <os / node -v / yarn -v>          Date: <YYYY-MM-DD>

| Gate                     | Before (16.1.6)                          | After (16.4.6)                            | Verdict |
|--------------------------|------------------------------------------|-------------------------------------------|---------|
| Installed versions       | next 16.1.6 / react 19.2.4 / sharp 0.34.5 | next ___ / react ___ / sharp ___          |         |
| tsc --noEmit             | 6 errors (completeness.test.ts)          | ___ errors (___)                          |         |
| vitest                   | 4 files / 10 tests failed (pre-existing) | ___ files / ___ tests failed              |         |
| yarn build               | OK, 56 routes, ~37 s                     | ___, ___ routes, ___ s                    |         |
| Route table diff         | —                                        | identical / differs: ___                  |         |
| HTTP smoke (§5.1)        | see §2 HTTP baseline table               | <paste status-code block>                 |         |
| /_next/image local PNG   | —                                        | ___ (expect 200 image/webp)               |         |
| /_next/image SVG         | —                                        | ___ (expect 400)                          |         |
| /_next/image bad host    | —                                        | ___ (expect 400)                          |         |
| Browser smoke (§5.3)     | —                                        | PASS ___ / FAIL ___ / BLOCKED ___ rows    |         |
| Advisories open (§6)     | 7                                        | ___                                       |         |
| Lockfile decision        | yarn.lock + package-lock.json            | ___                                       |         |

Regressions found: <none | list>
Unavoidable code changes outside package.json/lockfiles: <none | file + reason>
Blocked items and why: <…>
Follow-ups (not done here): see runbook §9
```

A row is **PASS** only when it was actually executed and matched the expectation. Anything not run is **BLOCKED** with a reason — never inferred.
