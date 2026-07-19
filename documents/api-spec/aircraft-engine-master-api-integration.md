# Aircraft-Engine Master Data — API Integration

Verified against the supplied Postman collection **SAM API - Master Data** on
2026-07-19.

## Frontend implementation

- Pure API functions and runtime response normalization:
  `lib/api/master/aircraft-engine/aircraftEngine.ts`
- React Query hooks, cache keys, invalidation, and cross-module update event:
  `lib/api/master/aircraft-engine/aircraftEngine.hooks.ts`
- Domain types:
  `lib/api/master/aircraft-engine/aircraftEngine.types.ts`
- Contract tests:
  `lib/api/master/aircraft-engine/aircraftEngine.api.test.ts`

All authenticated requests use `lib/axios.config.ts`, so the existing bearer
token and refresh-token queue apply automatically.

## Connected endpoints

| Capability | Method | Endpoint | Frontend function |
|---|---|---|---|
| List system configs | GET | `/master/aircraft-system-config` | `fetchSystemConfigs` |
| Create/update system config | POST | `/master/aircraft-system-config` | `upsertSystemConfig` |
| Delete system config | DELETE | `/master/aircraft-system-config/{icaoCode}` | `deleteSystemConfig` |
| List engines | GET | `/master/engine` | `fetchEngines` |
| Create/update engine | POST | `/master/engine` | `upsertEngine` |
| Delete engine | DELETE | `/master/engine/{engineCode}` | `deleteEngine` |
| List active combinations | GET | `/master/aircraft-engine-combination` | `fetchCombinations()` |
| List combinations as-of | GET | `/master/aircraft-engine-combination?asOf=...` | `fetchCombinations(asOf)` |
| Create/update combination | POST | `/master/aircraft-engine-combination` | `upsertCombination` |
| Delete combination | DELETE | `/master/aircraft-engine-combination/{id}` | `deleteCombination` |
| List all groups | GET | `/master/authorization-group` | `fetchAuthGroups()` |
| Downstream published/complete groups | GET | `/master/authorization-group?downstream=true` | `fetchAuthGroups({downstream:true})` |
| Groups for customer | GET | `/master/authorization-group?customerId={id}` | `fetchAuthGroups({customerId})` |
| Groups as-of | GET | `/master/authorization-group?asOf=...` | `fetchAuthGroups({asOf})` |
| Save group draft | POST | `/master/authorization-group/draft` | `saveAuthGroupDraft` |
| Submit/publish/reject group | POST | `/master/authorization-group/{groupId}/transition` | `transitionAuthGroup` |

The group transition request supports `SUBMIT`, `PUBLISH`, and `REJECT`.

## Response boundary

The Postman collection contains request examples but no saved response examples.
The frontend therefore accepts the repository's standard envelope:

```ts
{ message: string; responseData: T; error: string }
```

It also normalizes common camelCase, snake_case, and legacy audit-field variants.
Malformed list responses fail visibly instead of being converted to an empty
array. If group `completenessStatus` is missing, the adapter fails closed:
non-empty groups become `incomplete`, never `complete`.

## Not available in the supplied API

### 1. Aircraft Family CRUD

No `/master/aircraft-family` endpoint is present. The UI now derives a read-only
family picker from existing combination and system-config records. Adding a new
family has been removed from the combination dialog because silently assuming
that Combination POST creates the FK master would be unsafe.

Backend endpoints needed to restore full family management:

```text
GET    /master/aircraft-family
POST   /master/aircraft-family
DELETE /master/aircraft-family/{familyCode}  (if deletion is allowed)
```

### 2. Reference-check endpoints

No preflight endpoint is present for checking whether an engine or combination
is referenced. The UI derives the warning from its currently loaded API data.
This preserves the confirmation UX but is not concurrency-safe; the backend
DELETE endpoints must remain authoritative and return a conflict when referenced.

Recommended optional endpoints:

```text
GET /master/engine/{engineCode}/references
GET /master/aircraft-engine-combination/{id}/references
```

### 3. Live response/runtime verification

No bearer token or response examples were included with the collection. The
request paths and bodies are contract-tested locally, but a real authenticated
environment is still required to verify:

- actual response field names and nesting;
- backend conflict/error payloads;
- authorization for create/edit/delete/publish;
- temporal `asOf` results and customer override behavior;
- server-side completeness/engine-roll-up regeneration.

