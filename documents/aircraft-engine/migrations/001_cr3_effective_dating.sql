-- ============================================================================
-- Migration 001 — CR-3: effective dating (temporal, append-only)
-- Baseline: documents/aircraft-engine/schema.sql
-- Dialect: PostgreSQL (SQL Server notes inline). Timestamps stored in UTC.
--
-- Makes aircraft_engine_combination and authorization_group_member append-only
-- and effective-dated so a FM-CM-063 / CRS issued in the past can be reconstructed
-- against the master data as it was on that date (CAAT / EASA Part-145).
--
-- Model note: `id` on aircraft_engine_combination becomes the STABLE LOGICAL key
-- (unchanged across edits); a new surrogate `version_id` is the physical PK. At
-- most one version per `id` is active (valid_to IS NULL). Because a temporal table
-- cannot be the target of a plain FK on a non-unique column, the member→combination
-- FK is enforced against the "one active version per id" partial unique via a
-- trigger/app-layer check rather than a declarative FK (documented below).
-- ============================================================================

-- +migrate Up
BEGIN;

-- ── aircraft_engine_combination → versioned ─────────────────────────────────
ALTER TABLE aircraft_engine_combination
    ADD COLUMN version_id BIGSERIAL,                                   -- SQL Server: BIGINT IDENTITY
    ADD COLUMN valid_from TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    ADD COLUMN valid_to   TIMESTAMPTZ NULL;

-- Backfill effective dates for existing rows (§CR-3.5): valid_from = updated_at_utc
-- (no created_at in baseline), valid_to = NULL (all existing rows are active).
UPDATE aircraft_engine_combination SET valid_from = updated_at_utc WHERE valid_from IS NULL;

-- Swap the primary key from id → version_id, keep id as the logical key.
ALTER TABLE aircraft_engine_combination DROP CONSTRAINT pk_aircraft_engine_combination;
ALTER TABLE aircraft_engine_combination ADD CONSTRAINT pk_aircraft_engine_combination PRIMARY KEY (version_id);

-- The (family, series, engine) uniqueness now applies to the ACTIVE version only.
ALTER TABLE aircraft_engine_combination DROP CONSTRAINT uq_combination;
CREATE UNIQUE INDEX uq_combination_active
    ON aircraft_engine_combination (family_code, series, engine_code)
    WHERE valid_to IS NULL;

-- Exactly one active version per logical id — the target the member FK resolves to.
CREATE UNIQUE INDEX uq_combination_active_id
    ON aircraft_engine_combination (id)
    WHERE valid_to IS NULL;

CREATE INDEX ix_combination_valid_to ON aircraft_engine_combination (valid_to);

-- ── authorization_group_member → temporal junction ─────────────────────────
-- The old FK to combination(id) can no longer be declarative (id is not unique
-- across versions). Drop it; integrity against the active version is enforced by
-- app/trigger (see uq_combination_active_id).
ALTER TABLE authorization_group_member DROP CONSTRAINT fk_agm_combination;

ALTER TABLE authorization_group_member
    ADD COLUMN valid_from TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    ADD COLUMN valid_to   TIMESTAMPTZ NULL;

-- Re-key so history can accumulate (a combo can be removed then re-added).
ALTER TABLE authorization_group_member DROP CONSTRAINT pk_authorization_group_member;
ALTER TABLE authorization_group_member
    ADD CONSTRAINT pk_authorization_group_member PRIMARY KEY (group_id, combination_id, valid_from);

-- One active membership row per (group, combination).
CREATE UNIQUE INDEX uq_agm_active
    ON authorization_group_member (group_id, combination_id)
    WHERE valid_to IS NULL;
CREATE INDEX ix_agm_valid_to ON authorization_group_member (valid_to);

COMMIT;

-- +migrate Down
BEGIN;

-- Collapse history: keep only active rows, then restore the baseline shape.
DELETE FROM authorization_group_member WHERE valid_to IS NOT NULL;
DROP INDEX IF EXISTS uq_agm_active;
DROP INDEX IF EXISTS ix_agm_valid_to;
ALTER TABLE authorization_group_member DROP CONSTRAINT pk_authorization_group_member;
ALTER TABLE authorization_group_member
    ADD CONSTRAINT pk_authorization_group_member PRIMARY KEY (group_id, combination_id);
ALTER TABLE authorization_group_member DROP COLUMN valid_from, DROP COLUMN valid_to;
ALTER TABLE authorization_group_member
    ADD CONSTRAINT fk_agm_combination
        FOREIGN KEY (combination_id) REFERENCES aircraft_engine_combination (id)
        ON UPDATE CASCADE ON DELETE RESTRICT;

DELETE FROM aircraft_engine_combination WHERE valid_to IS NOT NULL;
DROP INDEX IF EXISTS uq_combination_active;
DROP INDEX IF EXISTS uq_combination_active_id;
DROP INDEX IF EXISTS ix_combination_valid_to;
ALTER TABLE aircraft_engine_combination DROP CONSTRAINT pk_aircraft_engine_combination;
ALTER TABLE aircraft_engine_combination
    ADD CONSTRAINT pk_aircraft_engine_combination PRIMARY KEY (id);
ALTER TABLE aircraft_engine_combination
    ADD CONSTRAINT uq_combination UNIQUE (family_code, series, engine_code);
ALTER TABLE aircraft_engine_combination
    DROP COLUMN version_id, DROP COLUMN valid_from, DROP COLUMN valid_to;

COMMIT;
