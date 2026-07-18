-- ============================================================================
-- SAMS Engineering Maintenance System — Aircraft & Engine master data
-- DDL for the six tables described in data-model.md.
--
-- Dialect: written for PostgreSQL. SQL Server notes are inline where types
-- differ (BOOLEAN -> BIT, TIMESTAMPTZ -> DATETIMEOFFSET, BIGSERIAL -> BIGINT
-- IDENTITY, TEXT -> NVARCHAR(MAX)). All timestamps are stored in UTC.
-- ============================================================================

-- ── aircraft_family ─────────────────────────────────────────────────────────
CREATE TABLE aircraft_family (
    family_code   VARCHAR(16)  NOT NULL,
    family_name   VARCHAR(128) NOT NULL,
    CONSTRAINT pk_aircraft_family PRIMARY KEY (family_code)
);

-- ── engine_master (controlled vocabulary) ───────────────────────────────────
CREATE TABLE engine_master (
    engine_code    VARCHAR(24)  NOT NULL,
    engine_name    VARCHAR(128) NOT NULL,
    manufacturer   VARCHAR(128) NOT NULL DEFAULT '',
    notes          VARCHAR(256) NOT NULL DEFAULT '',
    updated_by     VARCHAR(128) NOT NULL,
    updated_at_utc TIMESTAMPTZ  NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT pk_engine_master PRIMARY KEY (engine_code),
    -- One authored spelling per engine — kills "V500" vs "V2500" drift.
    CONSTRAINT uq_engine_name UNIQUE (engine_name)
);

-- ── aircraft_engine_combination (SINGLE SOURCE OF TRUTH) ────────────────────
CREATE TABLE aircraft_engine_combination (
    id             BIGSERIAL    NOT NULL,          -- SQL Server: BIGINT IDENTITY(1,1)
    family_code    VARCHAR(16)  NOT NULL,
    series         VARCHAR(32)  NOT NULL DEFAULT '',
    engine_code    VARCHAR(24)  NOT NULL,
    display_label  VARCHAR(192) NOT NULL,          -- derived: {family}{-series?} ({engine_name})
    updated_by     VARCHAR(128) NOT NULL,
    updated_at_utc TIMESTAMPTZ  NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT pk_aircraft_engine_combination PRIMARY KEY (id),
    CONSTRAINT fk_combination_family
        FOREIGN KEY (family_code) REFERENCES aircraft_family (family_code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    -- Engine is ALWAYS an FK, never free text.
    CONSTRAINT fk_combination_engine
        FOREIGN KEY (engine_code) REFERENCES engine_master (engine_code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    -- Same family+series+engine can't be entered twice.
    CONSTRAINT uq_combination UNIQUE (family_code, series, engine_code)
);
CREATE INDEX ix_combination_family ON aircraft_engine_combination (family_code);
CREATE INDEX ix_combination_engine ON aircraft_engine_combination (engine_code);

-- ── authorization_type_group (+ review workflow) ────────────────────────────
CREATE TABLE authorization_type_group (
    group_id        VARCHAR(32)  NOT NULL,
    group_label     VARCHAR(128) NOT NULL,
    -- Draft -> review -> publish. Only PUBLISHED feeds CRS scope downstream.
    review_status   VARCHAR(16)  NOT NULL DEFAULT 'DRAFT'
        CHECK (review_status IN ('DRAFT', 'IN_REVIEW', 'PUBLISHED')),
    submitted_by    VARCHAR(128) NULL,
    submitted_at_utc TIMESTAMPTZ NULL,
    reviewed_by     VARCHAR(128) NULL,
    published_by    VARCHAR(128) NULL,
    published_at_utc TIMESTAMPTZ NULL,
    updated_by      VARCHAR(128) NOT NULL,
    updated_at_utc  TIMESTAMPTZ  NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT pk_authorization_type_group PRIMARY KEY (group_id)
);

-- ── authorization_group_member (junction) ───────────────────────────────────
CREATE TABLE authorization_group_member (
    group_id       VARCHAR(32) NOT NULL,
    combination_id BIGINT      NOT NULL,
    CONSTRAINT pk_authorization_group_member PRIMARY KEY (group_id, combination_id),
    CONSTRAINT fk_agm_group
        FOREIGN KEY (group_id) REFERENCES authorization_type_group (group_id)
        ON UPDATE CASCADE ON DELETE CASCADE,             -- deleting a group drops its membership
    CONSTRAINT fk_agm_combination
        FOREIGN KEY (combination_id) REFERENCES aircraft_engine_combination (id)
        ON UPDATE CASCADE ON DELETE RESTRICT             -- combination can't be deleted while a member
);
CREATE INDEX ix_agm_combination ON authorization_group_member (combination_id);

-- ── aircraft_system_config ──────────────────────────────────────────────────
CREATE TABLE aircraft_system_config (
    icao_code       VARCHAR(8)   NOT NULL,
    family_code     VARCHAR(16)  NOT NULL,
    model_variant   VARCHAR(128) NOT NULL,
    classic_neo     VARCHAR(8)   NOT NULL CHECK (classic_neo IN ('CLASSIC', 'NEO')),
    engine_count    INT          NOT NULL DEFAULT 2,
    generator_count INT          NOT NULL DEFAULT 2,
    hydraulic_count INT          NOT NULL DEFAULT 3,
    has_apu         BOOLEAN      NOT NULL DEFAULT TRUE,  -- SQL Server: BIT
    updated_by      VARCHAR(128) NOT NULL,
    updated_at_utc  TIMESTAMPTZ  NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT pk_aircraft_system_config PRIMARY KEY (icao_code),
    CONSTRAINT fk_sysconfig_family
        FOREIGN KEY (family_code) REFERENCES aircraft_family (family_code)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX ix_sysconfig_family ON aircraft_system_config (family_code);

-- ============================================================================
-- Notes
--   • display_label is written by the app/service layer on every insert/update
--     of a combination, and re-written for all referencing rows when an engine's
--     engine_name changes. It is denormalised for display/search only; the
--     engine_code FK remains authoritative.
--   • ON DELETE RESTRICT on the engine and combination FKs is what produces the
--     "soft-block" delete behaviour surfaced in the UI.
--   • The legacy_engine_label import-staging column referenced in data-model.md
--     is intentionally NOT part of the clean schema. If a staging/import table is
--     needed during migration, model it separately (e.g. stg_engine_label_import)
--     and drop it once reconciliation completes.
-- ============================================================================
