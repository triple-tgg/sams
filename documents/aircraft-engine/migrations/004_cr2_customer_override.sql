-- ============================================================================
-- Migration 004 — CR-2: per-customer (airline) override
-- Baseline: schema.sql + migrations 001-003.
--
-- Adds an optional airline scope to authorization_type_group:
--   customer_id NULL  → global default, shared by all airlines
--   customer_id = X   → override that applies only to airline X
-- Resolution (in the service layer): for a given airline, prefer that airline's
-- own group over the global one of the same scope; otherwise fall back to global.
--
-- FK target: the existing airlines table (airlines.id) — the same ~18-row master
-- the Customer/Airline screen manages.
-- ============================================================================

-- +migrate Up
BEGIN;

ALTER TABLE authorization_type_group
    ADD COLUMN customer_id BIGINT NULL;

ALTER TABLE authorization_type_group
    ADD CONSTRAINT fk_atg_customer
        FOREIGN KEY (customer_id) REFERENCES airlines (id)
        ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX ix_atg_customer ON authorization_type_group (customer_id);

-- Existing rows are global defaults (customer_id stays NULL).

COMMIT;

-- +migrate Down
BEGIN;
DROP INDEX IF EXISTS ix_atg_customer;
ALTER TABLE authorization_type_group DROP CONSTRAINT fk_atg_customer;
ALTER TABLE authorization_type_group DROP COLUMN customer_id;
COMMIT;
