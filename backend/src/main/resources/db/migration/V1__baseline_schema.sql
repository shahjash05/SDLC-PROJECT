-- =============================================================
-- V1__baseline_schema.sql
-- Phase 0 baseline — establishes Flyway schema_version table
-- and creates the initial extensions needed by the platform.
--
-- All application tables will be added in Phase 1 onward.
-- =============================================================

-- Enable UUID generation (pgcrypto provides gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable citext for case-insensitive text columns (email, username)
CREATE EXTENSION IF NOT EXISTS citext;
