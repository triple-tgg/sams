-- ============================================================================
-- Migration 003 — CR-4: precomputed engine-list roll-up cache
-- Baseline: schema.sql + migrations 001-002.
--
-- The engine list of a group changes rarely but is read on every FM-CM-063 issue.
-- Store the roll-up on the group and regenerate it at the SAME trigger point as
-- completeness_status (any membership/engine change). Read paths consume this
-- column; the junction is touched only when membership is edited or regenerated.
--
-- Type: JSONB array of engine_name strings (SQL Server: NVARCHAR(MAX) holding JSON).
-- ============================================================================

-- +migrate Up
BEGIN;

ALTER TABLE authorization_type_group
    ADD COLUMN engine_list_cached JSONB NOT NULL DEFAULT '[]'::jsonb;

-- One-time backfill from the source-of-truth roll-up (active members only).
-- Kept as SQL so an existing DB is correct immediately after migrating; the
-- service uses the identical logic on subsequent membership changes.
UPDATE authorization_type_group g
SET    engine_list_cached = COALESCE((
           SELECT jsonb_agg(en ORDER BY en)
           FROM (
               SELECT DISTINCT em.engine_name AS en
               FROM   authorization_group_member agm
               JOIN   aircraft_engine_combination c
                      ON c.id = agm.combination_id AND c.valid_to IS NULL
               JOIN   engine_master em ON em.engine_code = c.engine_code
               WHERE  agm.group_id = g.group_id AND agm.valid_to IS NULL
           ) s
       ), '[]'::jsonb);

COMMIT;

-- +migrate Down
BEGIN;
ALTER TABLE authorization_type_group DROP COLUMN engine_list_cached;
COMMIT;
