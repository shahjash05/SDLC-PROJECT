-- =============================================================
-- V9__test_case_traceability_schema.sql
-- Phase 5, Step 4: Requirements & Testing Traceability Schema
-- =============================================================

-- Add foreign key columns to test_cases for linking to user stories and requirement documents
ALTER TABLE test_cases
    ADD COLUMN IF NOT EXISTS user_story_id UUID REFERENCES user_stories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS requirement_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Performance indexes for fast traceability lookups and joins
CREATE INDEX IF NOT EXISTS idx_test_cases_user_story_id ON test_cases(user_story_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_requirement_id ON test_cases(requirement_id);
