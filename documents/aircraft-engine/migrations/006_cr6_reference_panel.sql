-- ============================================================================
-- Migration 006 — CR-6: shared read-only reference panel
-- Baseline: schema.sql + migrations 001-005.
--
-- NO SCHEMA CHANGE. CR-6 is a presentation-layer component
-- (components/aircraft-engine/AircraftEngineRefPanel.tsx) embedded in M-02 and
-- M-03. It reads the existing master-data tables/columns (including the CR-4
-- engine_list_cached and CR-1 completeness_status added above); it introduces no
-- storage of its own. This file exists so every CR has a matching, reversible
-- migration; it is intentionally a no-op.
-- ============================================================================

-- +migrate Up
-- (no-op)

-- +migrate Down
-- (no-op)
