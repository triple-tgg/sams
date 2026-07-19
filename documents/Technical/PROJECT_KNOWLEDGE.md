# SAMS Engineering Maintenance System — Project Knowledge

> Repository knowledge snapshot for developers and coding agents.
> Verified from the frontend source on 2026-07-19. Treat this file as a map,
> then confirm behavior in the linked source before changing it.

## 1. What this repository is

This repository is the web frontend for **SAMS Engineering Maintenance System**
(short name: **SAMS**). It supports airline engineering/maintenance operations,
with the main business areas below:

- Flight schedule, flight timeline, Excel flight import, and flight cancellation
- Technical Handling Form (THF) / line-maintenance recording
- Airline contracts, service pricing, pre-invoice/draft invoice, and reports
- QA training courses, scheduling, enrollment, attendance, certificates, and monitoring
- Staff profile, employment/training/experience/logbook, and document verification
- SAMS/customer/authority authorization and CRS monitoring
- Organization, user, role, station, airline, staff, and aircraft/engine master data
- Production/revenue planning UI (currently mostly mock or placeholder)

The repository is frontend-only. It calls an external API selected by public
environment variables. Backend code, deployment topology, database migrations
(except an aircraft/engine design specification), production credentials, and
real operational data are not in this repository.

## 2. Non-negotiable repository rules

Source: `.agents/AGENTS.md`.

1. Always call the product **SAMS Engineering Maintenance System** or **SAMS**.
   Do not introduce historical names such as “SAM Airline Maintenance”.
2. New API integrations use the two-file pattern:
   - `lib/api/{category}/{feature}.ts`: types and pure async API functions
   - `lib/api/{category}/{feature}.hooks.ts`: React Query hooks, query keys,
     mutations, and cache invalidation
3. Pages/components consume hooks; they should not call Axios directly.
4. Creating or changing a UI mockup also requires an API specification under
   `documents/api-spec/`.
5. Preserve unrelated working-tree changes. At the time of this snapshot,
   QA Customer Authorization files had user changes in progress.

The codebase predates rule 2 in several places. `lib/api/hooks/` is the legacy
shared-hook location, and some old API files construct URLs or call Axios
directly. Follow the current rule for new work; migrate legacy code only when it
is in scope.

## 3. Architecture at a glance

```text
Browser
  |
  | Next.js App Router, locale-prefixed routes (/en, /ar)
  v
Root locale layout
  React Query -> next-intl -> Redux/AuthGuard -> Theme -> Direction -> page
  |
  +-- public/auth pages
  |
  +-- protected layout
       PermissionGuard -> Header + Sidebar -> RoutePermissionGuard -> page
       |
       +-- Redux: session identity + permission tree
       +-- React Query: server/cache state
       +-- local component/context state: forms, filters, pagination, layout
       |
       v
  Axios instance (`lib/axios.config.ts`)
       | Bearer access token + single-flight refresh queue
       v
  External SAMS API (development or production base URL from env)
```

This is a client-heavy modular frontend, not a server-rendered business logic
application. Most business pages begin with `"use client"`; the Next server is
mainly used for routing, layouts, middleware, static assets, and a compatibility
session endpoint.

## 4. Technology stack

| Concern | Current choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict mode |
| Styling | Tailwind CSS 4, Radix UI primitives, local `components/ui` |
| Server state | TanStack React Query 5 |
| App/session state | Redux Toolkit + React Redux |
| Forms/validation | React Hook Form, Zod |
| HTTP | Axios |
| Localization | next-intl; route locales configured as `en` and `ar` |
| Dates | Day.js with UTC/timezone/Buddhist Era plugins; some legacy Moment/date-fns |
| Tables | TanStack Table |
| Charts | Chart.js/react-chartjs-2, Recharts, ApexCharts |
| Calendar/timeline | FullCalendar, Planby, custom flight timeline |
| Documents/data | XLSX, ExcelJS, jsPDF, jsPDF-AutoTable, DOCX tooling |
| Tests | Vitest, Node environment, currently pure logic only |

`package.json` declares Yarn 1 as the package manager, but `package-lock.json`
also exists and `npm test` works. Avoid casually regenerating either lockfile;
confirm which package manager the team wants for dependency changes.

## 5. Repository map

| Path | Responsibility |
|---|---|
| `app/[locale]/` | Locale-aware App Router pages and layouts |
| `app/[locale]/(protected)/` | Main shell: auth, permission, header/sidebar/footer |
| `app/[locale]/(protected-fullscreen)/` | Protected pages without the main shell |
| `app/api/auth/[...nextauth]/route.ts` | Empty session compatibility endpoint; not the real auth system |
| `components/ui/` | Shared UI primitives |
| `components/partials/` | Application shell, auth, sidebar, header, footer |
| `components/flight-timeline/` | Timeline/table views and Excel preview/import UI |
| `providers/` | React Query, Redux/auth, theme, direction, layout providers |
| `store/` | Redux store and root reducer |
| `lib/api/` | API functions, interfaces, and React Query hooks |
| `lib/menus.ts` | Static sidebar structure and permission codes |
| `lib/route-permissions.ts` | URL-to-menu-code route guard map |
| `hooks/` | Shared UI/import/menu hooks |
| `i18n/`, `messages/` | next-intl routing and translations |
| `public/flie/` | Import templates, example documents, and flowchart images (`flie` is the existing spelling) |
| `documents/` | Technical notes, API specs, UAT, verification, and aircraft/engine design |
| `scripts/` | Theme/dev patches and document/UAT generation utilities |

There are roughly 1,000 tracked/discoverable files. The largest business pages
are staff creation, training schedule detail, role/permission management, and
document verification. Prefer extracting behavior into hooks/components rather
than adding more logic to these already-large page files.

## 6. Runtime bootstrap and provider order

Primary source: `app/[locale]/layout.tsx`.

1. `proxy.ts` applies next-intl middleware to `/` and `/(ar|en)/:path*`.
2. `app/[locale]/layout.tsx` determines text direction and mounts providers in
   this order:
   - `ReactQueryProviders`
   - `NextIntlClientProvider`
   - `AuthProvider` (Redux `Provider`, compatibility `SessionProvider`, AuthGuard)
   - `ThemeProvider`
   - `MountedProvider`
   - `DirectionProvider`
3. Protected pages add `LayoutProvider`, `PermissionGuard`, header/sidebar,
   `LayoutContentProvider`, `RoutePermissionGuard`, and footer.
4. Fullscreen protected pages use only `PermissionGuard` and
   `RoutePermissionGuard`; flight timeline uses this shell.

The root locale page is a loading screen. Client-side `AuthGuard` decides where
to navigate after localStorage restoration.

## 7. Routing and page map

All normal URLs have a locale prefix, normally `/en` or `/ar`.

| Area | Routes | Current purpose/status |
|---|---|---|
| Auth | `/auth/login` | Email/password login |
| Public action | `/confirm-attendance?token=...` | Training attendance confirmation; intended public, but see risks |
| Flight | `/flight/list`, `/views-flight-timeline` | API-backed list and fullscreen timeline/table |
| THF | `/flight/thf/create?flightInfosId=...` | Five-step line-maintenance form |
| Contract | `/contract` | API-backed contract list/create/edit/view/delete |
| Invoice | `/invoice` | API-backed pre-invoice/draft invoice, preview/export |
| Report | `/report` | THF/equipment/parts-tools report filters and downloads |
| Production Planner | `/production-planner/*` | Dashboard uses bundled sample data; other pages are placeholders |
| QA Training | `/qa/monitoring`, `/qa/course-management`, `/qa/training-scheduler`, `/qa/training-scheduler/[id]` | API-backed core mixed with local fallback/mock data |
| QA Authorization | `/qa/authorization` | Mixed: SAMS Auth and Customer Auth use APIs; several overview/authority/CRS views use mock data |
| QA Documents | `/qa/qa-document/*`, `/qa/document-generation` | History/logbook previews; document-generation page is placeholder |
| HR | `/hr/staff`, `/hr/staff/new`, `/hr/staff/[id]`, `/hr/employee-income`, `/hr/document-verification` | Mostly API-backed; some profile editing/display paths remain local/mock/TODO |
| Master Data | `/master-data/staff`, `/department`, `/manager-mapping`, `/aircraft-engine`, `/customer-airline`, `/station`, `/user-login`, `/role` | CRUD APIs; aircraft/engine uses its dedicated REST API, except Aircraft Family CRUD is not provided |

Redirect pages:

- `/flight` -> `/flight/list`
- `/qa` -> `/qa/monitoring`
- `/master-data/set-permission` -> `/master-data/role`

Production Planner also contains `/service-category-rules`, but it is not in the
sidebar or route permission map.

## 8. Authentication lifecycle

The real application auth is **Redux + localStorage + external API**, not
NextAuth. `SessionProvider` and `app/api/auth/[...nextauth]` exist only for
compatibility and return an empty object.

### Login

1. `LoginForm` validates `email` and `password`.
2. `useLogin` calls `POST /user/login` through the shared Axios instance.
3. The response is stored as:
   - `user`: raw response data, including role and `menuPermissions`
   - `access_token`
   - `refresh_token`
4. A normalized user identity is stored in Redux `auth`.
5. Permissions are stored in Redux `permission`.
6. `getFirstViewableRoute` flattens/sorts permissions and navigates to the first
   viewable route; fallback is `/flight/list`.

### Refresh/page reload

`AuthGuard` restores identity from `user` + `access_token`. `PermissionGuard`
first uses permissions cached inside `user`, then refreshes them from
`GET /permission/menus/{roleId}` and rewrites the cache.

### API request and token refresh

`lib/axios.config.ts` adds `Authorization: Bearer <access_token>` except on login
and refresh endpoints. On the first HTTP 401 it:

1. Locks refresh with an `isRefreshing` flag.
2. Queues concurrent failed requests.
3. Calls `POST /user/refresh-token` with the refresh token.
4. Replaces tokens/user data, releases the queue, and retries requests.
5. If refresh fails, clears local state, dispatches logout/permission reset, and
   performs a hard redirect to the locale login page.

### Logout

`useLogout` attempts `POST /user/logout`, but always clears tokens, cached user,
Redux auth, and permissions, then routes to login even if the API call fails.

### Storage caveat

Two generations of storage keys coexist: current flow uses `user`, while the
Redux slice also reads/writes legacy `users` and `isAuth`. The logout flow clears
both generations. Do not introduce another storage source of truth.

## 9. Permission model

Permissions arrive as a nested menu tree. Each item has:

`canView`, `canCreate`, `canEdit`, `canDelete`, and `canExport`.

The frontend enforces them at three layers:

1. **Sidebar visibility** — `useFilteredMenuList` filters `lib/menus.ts` by
   `menuCode` and `canView`.
2. **Route visibility** — `RoutePermissionGuard` strips the locale, finds the
   first matching prefix in `ROUTE_PERMISSION_MAP`, and requires `canView` for at
   least one mapped code.
3. **Action visibility** — `PermissionActionGuard` + `useMenuPermission` hide
   buttons/actions unless the required granular permission is true.

Important behavior: an authenticated route absent from
`ROUTE_PERMISSION_MAP` is allowed. Therefore every new protected page must add
both a menu entry (if navigable) and a route mapping. Parent and child permission
codes must stay aligned with the backend `menus` table.

## 10. State ownership

| State type | Owner | Examples |
|---|---|---|
| Identity/session | Redux + localStorage | Current user, isAuth |
| Permission tree | Redux + cached `user` payload | Menu/action rights |
| Remote API/cache | React Query | Lists, detail data, mutations, invalidation |
| Form state | React Hook Form/local component state | THF, contracts, staff, course/schedule forms |
| Page workflow | Local context/state | Flight list filters, THF step navigation |
| UI preferences | Jotai/hooks/localStorage where used | Layout/sidebar/theme/comment box |

The root React Query client currently uses library defaults. Individual hooks
define retry/refetch/cache behavior selectively; there is no global stale-time
or error policy.

## 11. API integration conventions

The shared authenticated client is `lib/axios.config.ts`. The base URL is:

```text
NEXT_PUBLIC_ENVIRONTMENT !== "production"
  ? NEXT_PUBLIC_DEVELOPMENT_API
  : NEXT_PUBLIC_PRODUCTION_API
```

Common API response shape is:

```ts
{
  message: string;
  responseData: T;
  error: string;
  // list endpoints may also include total/page/perPage
}
```

New integrations should expose typed pure functions and React Query hooks with
central query keys and relevant invalidation in `onSuccess`.

Current endpoint families include:

- `/user/*` — login, logout, refresh, user management
- `/permission/*` — menu permissions and batch upsert
- `/flight/*` — list, planby list, import, update, cancel
- `/lineMaintenances/*` — THF detail, service/equipment/parts/files/personnel
- `/contract/*` — contract CRUD/upload, pre-invoice/draft-invoice
- `/training/*` — dashboard, courses, schedules, enrollments, attendance,
  certificates, monitoring, email
- `/authorization/*` — authority, SAMS auth, customer auth
- `/master/*` — airlines, stations, staff, users, roles, organization, lookup data
- `/staffs/{id}/*` — training history, experience preview, logbook, print preview

Some public attendance endpoints intentionally use raw Axios without bearer
auth. Several legacy modules manually construct the same base URL; normalize
only when touching those paths and verify that public/auth behavior is retained.

## 12. Core business flows

### 12.1 Flight schedule and import

- `/flight/list` owns pagination and filters in `FlightListProvider`.
- `useFlightListQuery` posts date/station/airline/flight filters to the API.
- Users with action permission can add/edit/cancel flights, open THF, preview
  email, download an Excel template, and import Excel.
- `useFlightExcelImport` parses multi-sheet workbooks, maps master data, validates
  rows locally and against API expectations, previews errors, uploads, then
  invalidates flight queries.
- The fullscreen timeline fetches both standard and Planby-shaped flight data,
  supports station/date/view/scale filters, table/timeline modes, and fullscreen.

### 12.2 THF / line maintenance

`/flight/thf/create` loads a flight by `flightInfosId` and presents five steps:

1. Flight — airline, station, aircraft, routes/times, THF metadata
2. Services — aircraft checks, defects, fluids, personnel, photos
3. Equipment — equipment usage/loan/return information
4. Parts & Tools — parts/tools usage, serials, loans, returns
5. Attach file — maintenance evidence and completion

Master options (airline, station, aircraft type, status, equipment, parts/tools,
staff) are loaded through hooks. Existing maintenance data determines whether
the flow is initial creation or editing. Each step has its own schema/types,
data transformers, and submission hook.

### 12.3 Contract, invoice, and report

- Contracts are paginated/filterable and use a multi-step dialog: general info,
  operational contacts, and service pricing. Delete/edit actions use permission
  guards and credential confirmation where implemented.
- Invoice requests produce pre-invoice and draft-invoice datasets, with print
  preview and Excel export.
- Reports cover THF, equipment, and parts/tools. Filter forms call report APIs
  and download generated output/files.

### 12.4 QA training lifecycle

1. Course Management defines courses, categories, department/position needs,
   recurrence, and training matrix rules.
2. Training Scheduler creates sessions and offers calendar/list/Gantt views.
3. Schedule detail manages status, enrolled staff, email, evidence, attendance
   sheets, grading/pass-fail, and certificates.
4. Email links target `/confirm-attendance?token=...`; the page confirms the
   token, looks up attendance type, and may send a follow-up confirmation email.
5. Monitoring combines dashboard/calendar APIs with local fallback/mock datasets
   for compliance and employee drill-downs.

Training statuses come from API master data and are richer than some older UAT
documents. Do not hard-code a lifecycle without checking the current API values.

### 12.5 Staff and HR

- `/hr/staff` lists operational staff from the staff-management API.
- `/hr/staff/new` is the full FM-CM-036-style onboarding/profile form with
  personal, contact, employment, education, document, authorization, and upload
  fields.
- `/hr/staff/[id]` aggregates profile, training dashboard/history, experience,
  logbook, and print preview. Some edit/display paths still contain mock/local
  behavior; verify the exact tab before promising persistence.
- Updating its profile photo is a two-step write: upload the base64 image to
  `POST /master/staff-management/uploadfile`, then send the returned `filePath`
  as `profileImagePath` in a complete aggregate payload to
  `POST /master/staff-management/upsert`. Never send a profile-only partial
  upsert because the endpoint also owns the nested staff collections.
- `/hr/document-verification` lists staff documents and approves/rejects them.
- `/hr/employee-income` manages income rules and calculation previews; one write
  path still uses a placeholder `current_user` audit value.

There is also a smaller `/master-data/staff` CRUD screen. It is not equivalent to
the full HR profile form; clarify which is authoritative before merging flows.

### 12.6 QA authorization and CRS

The authorization screen contains overview, CRS monitoring, SAMS authorization,
customer authorization, authority authorization, and mechanic views.

- SAMS Authorization: API-backed list/detail/upsert. The monitoring list uses
  `POST /authorization/sams-auth/listdata` with server-side search, status, page,
  and page-size fields. Its list identity is `authorizationSamsId` (nullable for
  staff whose status is `Not Issued`), not `staffAuthorizationId`. Detail reads
  use `GET /authorization/sams-auth/byid/{id}` and return nested
  `authorizationSamses`, `authorizationSamsAircraftTypeLicens` (backend spelling),
  and `staff` objects. Upserts use `POST /authorization/sams-auth/upsert` with a
  nested `authorizationSamses` object and the selected ID array named
  `authorizationSamsAircraftTypeLicenId` (a different backend spelling).
- Customer Authorization: API-backed list/detail/upsert, with airline and
  aircraft-license master data; currently under active development
- Mechanic view: staff API-backed
- Overview, authority authorization, and CRS views: substantially mock/local

Do not assume CRS eligibility or authority certification rules are enforced by
the backend based only on their UI representation. Verify both positive and
negative runtime cases.

### 12.7 Aircraft and engine master

`/master-data/aircraft-engine` is a four-tab API-backed implementation for:

- Engine controlled vocabulary
- Aircraft-family/series/engine combinations
- Authorization type groups and review/publish workflow
- Aircraft system configuration

The production hooks call the dedicated master-data REST API. The in-memory mock
is retained only for pure-logic tests. The desired schema, temporal behavior,
completeness rules, customer overrides, roll-up cache, events, and referential
integrity are documented under `documents/aircraft-engine/`. Only published and
complete authorization groups should feed downstream QA. Aircraft Family CRUD
and server-side reference-preflight endpoints are not present in the supplied
API collection or the detailed specs under `documents/api-spec/master-data/`.
When creating an authorization group, omit `groupId`; the backend generates it.
Edits send the existing ID. An authenticated read-only staging probe on
2026-07-19 reached every Aircraft-Engine controller, but all returned HTTP 500 /
PostgreSQL `42P01` because relations `engineMasters`, `aircraftSystemConfigs`,
`aircraftEngineCombinations`, and `authorizationTypeGroups` did not exist. The
reference SQL uses snake_case singular names, so backend migrations and ORM table
mappings must be aligned before successful payloads or writes can be verified.

### 12.8 Production Planner

The revenue comparison dashboard is a self-contained Chart.js module using
bundled sample data and localStorage comments. Its date picker is cosmetic unless
an `onPeriodsChange` callback is wired. Production plan, revenue plan, monthly
frequency, flight import, and service-category-rules pages are placeholders.

## 13. Date, time, locale, and direction

`lib/dayjs.ts` defines the intended time strategy:

- Display using the browser's local timezone.
- Convert datetime values to UTC when submitting to APIs.
- Parse UTC API timestamps back to local time for display.
- Treat date-only values as local calendar dates where appropriate.

`NEXT_PUBLIC_APP_TIMEZONE` is used by aircraft/engine shared UI with a fallback
of `Asia/Bangkok`; it is not a global Day.js default.

Localization currently has a mismatch:

- Configured locales: `en`, `ar`
- Translation files present: `messages/en.json` only
- Some UI is English, some comments/docs are Thai, and some time formatting uses
  `th-TH`

Visiting `/ar` can fail when `messages/ar.json` is loaded. There is no configured
Thai locale despite Thai operational context and older requirements mentioning
TH/EN.

## 14. Environment and local commands

Required/known variable names (values intentionally omitted):

- `NEXT_PUBLIC_ENVIRONTMENT` (existing misspelling is part of the contract)
- `NEXT_PUBLIC_DEVELOPMENT_API`
- `NEXT_PUBLIC_PRODUCTION_API`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_TIMEZONE`
- `PLANBY_LICENSE_KEY`
- `AUTH_SECRET`, GitHub/Google auth variables (legacy/compatibility)
- `VERCEL_OIDC_TOKEN` may exist in `.env.local`; never copy it into docs/logs

Commands:

```bash
npm run dev
npm run build
npm run start
npm test
npm run test:watch
```

`npm run lint` currently maps to `next lint`, which is not supported by modern
Next.js 16 CLI behavior; use build/type checking as the current executable gate
until a real ESLint command/configuration is established.

Postinstall patches `next-themes`. There is also a `patch-next-dev.js`; inspect
scripts before framework upgrades because the project carries compatibility
workarounds.

## 15. Test and verification status

Vitest is configured for `lib/**/*.test.ts` in a Node environment. As of this
snapshot:

- 5 test files
- 29 tests
- all pass via `npm test`
- all current tests cover aircraft/engine pure logic (temporal behavior,
  completeness, customer override, event emission, and roll-up caching)
- `./node_modules/.bin/tsc --noEmit --pretty false` passes
- `npm run lint` fails before linting because Next.js 16 treats the removed
  `next lint` subcommand as a project directory argument
- `npm run build` was attempted, but Turbopack remained in the optimize/compile
  stage for more than five minutes without new diagnostics and was stopped;
  this snapshot therefore does not claim a successful production build

There are no automated component, browser/E2E, auth, permission, flight, THF,
contract, invoice, training, or HR tests in the configured suite. UAT documents
and scripts exist under `documents/UAT/`, but they are not an automated gate.

## 16. Known risks and inconsistencies

These are observations, not automatically authorized fixes:

1. **Intended public attendance route is guarded.** `AuthGuard` only allowlists
   auth pages. `/confirm-attendance` is described and implemented as public but
   an unauthenticated visitor is also redirected toward login.
2. **Permission map is allow-by-default for unknown routes.** New or forgotten
   routes can be reached by any authenticated user. `service-category-rules` is
   a current example.
3. **Locale mismatch.** `ar` is configured without `messages/ar.json`; `th` is
   not configured.
4. **Mixed live/mock UI.** Production Planner, parts of QA
   Authorization/Monitoring, employee history logbook, and staff profile
   contain mock/fallback/local data.
5. **Auth documentation drift.** `AUTH_SYSTEM_DOCS.md` includes stale username
   and old component examples; current login uses email.
6. **Legacy API patterns.** Some API modules bypass the central two-file pattern,
   build base URLs repeatedly, or keep hooks in `lib/api/hooks/`.
7. **Storage duplication.** `user` and legacy `users`/`isAuth` coexist.
8. **Large client pages.** Several pages exceed 500–1,200 lines, increasing
   regression risk and making isolated testing difficult.
9. **Timer mismatch.** Flight timeline says “update every minute” but uses a
   600 ms interval, creating unnecessary renders/API-adjacent work.
10. **Metadata/branding remnants.** Some metadata and `theme.config.tsx` retain
    DashCode/template or old “SAMs” labels despite the official naming rule.
11. **Potential pagination bug.** Flight table's page-size branch calls
    `goToPage(next.pageSize)` rather than a page-size updater; reproduce before
    changing.
12. **Backend behavior is not verifiable offline.** API contracts are inferred
    from frontend types and existing docs; production authorization, DB rules,
    email retry, and deployment behavior require backend/runtime evidence.

## 17. Safe change checklists

### Add a protected page

1. Add the locale App Router page under the correct protected group.
2. Add sidebar structure and `permCode` in `lib/menus.ts` if navigable.
3. Add the most-specific route mapping before parent mappings in
   `lib/route-permissions.ts`.
4. Ensure the backend menus table returns the same code.
5. Add action-level guards for create/edit/delete/export.
6. Test direct URL access with allowed and denied roles, not only sidebar hiding.
7. Add/update `documents/api-spec/` when the work is a UI mockup.

### Add an API feature

1. Put types and pure functions in `feature.ts`.
2. Put query keys/hooks/invalidation in `feature.hooks.ts`.
3. Use the shared Axios client unless the endpoint is intentionally public.
4. Normalize `responseData`, pagination, and error behavior at the API boundary.
5. Use stable query keys containing every filter that changes the result.
6. Invalidate all affected list/detail/summary keys after mutations.
7. Test token/public behavior and empty/error responses.

### Change auth or permissions

Trace and test the complete chain:

```text
login response -> localStorage -> Redux auth/permission
-> sidebar filter -> route guard -> action guard
-> refresh-token response -> cached permissions -> logout cleanup
```

Test page reload and concurrent 401s in addition to login/logout.

### Change dates

Classify each field as date-only, local datetime, or UTC timestamp before editing.
Use `dateTimeUtils`; test an overnight flight/training session and a browser in a
timezone other than Asia/Bangkok.

## 18. High-value source index

| Topic | Start here |
|---|---|
| Root/provider chain | `app/[locale]/layout.tsx` |
| Protected shells | `app/[locale]/(protected)/layout.tsx`, `(protected-fullscreen)/layout.tsx` |
| Auth restoration | `providers/auth.provider.tsx` |
| Login/logout | `lib/api/hooks/useLogin.ts`, `useLogout.ts` |
| Axios/refresh queue | `lib/axios.config.ts` |
| Permission loading | `components/partials/auth/PermissionGuard.tsx` |
| Route permission | `components/partials/auth/RoutePermissionGuard.tsx`, `lib/route-permissions.ts` |
| Sidebar permission | `lib/menus.ts`, `hooks/use-filtered-menu-list.ts` |
| Action permission | `PermissionActionGuard.tsx`, `hooks/use-menu-permission.ts` |
| Flight list | `app/[locale]/(protected)/flight/list/` |
| Timeline/import | `components/flight-timeline/`, `hooks/use-flight-excel-import.ts` |
| THF | `app/[locale]/(protected)/flight/thf/create/components/` |
| Training APIs | `lib/api/qa/course.ts`, `scheduler.ts`, `enrollment.ts` and hooks |
| Staff aggregate API | `lib/api/qa/staff-management.ts` |
| Aircraft/engine design | `documents/aircraft-engine/data-model.md`, `schema.sql` |
| Project verification gaps | `documents/Verification/SAMS-Doc-Verification-Report-v1.0.md` |

## 19. What is still unknown

Confirm these outside this frontend repository when a task depends on them:

- Backend service ownership and exact .NET/database versions
- Production topology, CI/CD, observability, backup, and rollback procedures
- Canonical API/OpenAPI schema and backward-compatibility policy
- Final role/permission matrix and whether unmapped routes should be deny-by-default
- Which mock modules are approved designs versus abandoned prototypes
- Canonical staff source of truth (HR full profile vs Master Data quick CRUD)
- Final localization scope (English/Arabic/Thai)
- Compliance acceptance rules for CRS and authorization issuance
- Official package manager and lockfile policy
