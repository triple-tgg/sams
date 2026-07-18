-- ============================================================================
-- Migration 002 — CR-1: auto-computed completeness status + staleness clock
-- Baseline: schema.sql + migration 001.
--
-- `completeness_status` is INDEPENDENT of the manual `review_status` workflow:
-- downstream (FM-CM-063) requires BOTH review_status = 'PUBLISHED' AND
-- completeness_status = 'complete'. It is recomputed by the service layer on every
-- membership/validation change — never set by hand. `incomplete_since_utc` records
-- when the group last left 'complete', so the data-quality banner can escalate
-- amber → red after the 3-day SLA.
-- ============================================================================

-- +migrate Up
BEGIN;

ALTER TABLE authorization_type_group
    ADD COLUMN completeness_status  VARCHAR(16) NOT NULL DEFAULT 'draft'
        CHECK (completeness_status IN ('draft', 'incomplete', 'complete')),
    ADD COLUMN incomplete_since_utc TIMESTAMPTZ NULL;

-- Data backfill: leave rows at the 'draft' default; the service performs a first
-- recompute pass over every group on deploy (same code path as a membership edit),
-- which sets the correct status and stamps incomplete_since_utc where needed.
-- (Left as an application step so the roll-up logic lives in exactly one place.)

COMMIT;

-- +migrate Down
BEGIN;
ALTER TABLE authorization_type_group
    DROP COLUMN completeness_status,
    DROP COLUMN incomplete_since_utc;
COMMIT;
