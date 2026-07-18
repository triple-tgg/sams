# Authorization group "regenerate" — reference for the QA module

This note explains how an authorization type group's **engine list** is produced
and kept current, so the QA module (Authorization & Certification / M-03,
Authorization Certificate / FM-CM-063) can rely on it instead of re-deriving or
re-typing engine data.

## TL;DR

> An authorization group never stores an engine list. Its engines are **rolled
> up** (regenerated) from the `engine_code`s of its member combinations, every
> time it is read. A group's engines therefore cannot drift from the source of
> truth, and adding a new series to a member combination flows into the group
> with no manual step.

## What a group actually stores

- `authorization_type_group`: id, label, review status/audit columns.
- `authorization_group_member`: which `aircraft_engine_combination` rows belong
  to the group.

It does **not** store engine names. That is the whole point.

## The regenerate (roll-up) algorithm

Given a group `G`:

1. Collect `G`'s member combination ids from `authorization_group_member`.
2. Load those `aircraft_engine_combination` rows.
3. Take the **distinct** set of their `engine_code`s.
4. Resolve each `engine_code → engine_name` via `engine_master`.
5. Sort by `engine_name` for stable display.

Reference implementation (already used by the master-data screen):
`rollUpGroupEngines(group, combinations, engines)` in
`lib/api/master/aircraft-engine/aircraftEngine.validation.ts`. It is a pure
function — safe to call from the QA module or to port server-side unchanged.

```
engines(G) = sort( distinct( engine_name(c.engine_code)
                             for c in combinations
                             if c.id in members(G) ) )
```

Equivalent SQL:

```sql
SELECT DISTINCT em.engine_name
FROM   authorization_group_member agm
JOIN   aircraft_engine_combination c ON c.id = agm.combination_id
JOIN   engine_master em              ON em.engine_code = c.engine_code
WHERE  agm.group_id = :group_id
ORDER  BY em.engine_name;
```

## When is it "regenerated"?

There is no cached engine column to rebuild — the roll-up is computed on read, so
it is always current the moment any of the following changes:

- a combination is added to / removed from the group (membership edit),
- a member combination's `engine_code` changes,
- an engine's `engine_name` changes in `engine_master`.

If a backend chooses to **materialise** the engine list for performance, it must
recompute on exactly those three events. Prefer computing on read unless a
profiler says otherwise.

## What the QA module should consume

- **Only `PUBLISHED` groups.** `DRAFT` and `IN_REVIEW` groups are in-flight
  changes to CRS scope and must not be certified against. Filter
  `review_status = 'PUBLISHED'`.
- The rolled-up engine list (above), not any stored/typed text.
- The group's `published_by` / `published_at_utc` for the audit trail on a CRS.

## Why changes are gated (draft → review → publish)

A group's membership defines the **CRS scope** of certifying staff. Editing a
published group therefore does not take effect immediately: the edit creates a
new `DRAFT`, which must be **submitted** and then **published** by an approver
before the QA module sees it. Full lifecycle and permission mapping are in
[`data-model.md`](./data-model.md) §4. Practically, for QA this means: the engine
list you read for a published group is stable until a human explicitly publishes
a new version — it will not shift under you mid-certification.

## Data-quality guarantees the QA module can assume

The master-data screen runs a continuous data-quality scan
(`computeDataQuality`). Two of its checks directly protect QA:

- **ORPHAN** — every combination is expected to belong to at least one group;
  orphans are flagged for the master-data owner to place. (A combination in no
  group means an aircraft/engine no one is authorized on.)
- **NAMING** — any legacy engine label that doesn't resolve to `engine_master` is
  flagged, so a published group's roll-up only ever contains vocabulary-clean
  names.

If a finding is unresolved it is visible in the banner on
`/master-data/aircraft-engine`; QA can treat a clean banner as "the master set is
internally consistent".
