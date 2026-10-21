-- =============================================================
-- V8__defect_tracking_schema.sql
-- Phase 5, Step 3: Defect Tracking & Bug Management Schema
-- =============================================================

-- Defects table
CREATE TABLE IF NOT EXISTS defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    defect_number INT NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    steps_to_reproduce TEXT,
    expected_result TEXT,
    actual_result TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',     -- OPEN, IN_PROGRESS, IN_REVIEW, RESOLVED, CLOSED, REOPENED
    test_case_id UUID REFERENCES test_cases(id) ON DELETE SET NULL,
    test_execution_id UUID REFERENCES test_executions(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    CONSTRAINT uq_project_defect_number UNIQUE (project_id, defect_number)
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_defects_project_id ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_priority ON defects(priority);
CREATE INDEX IF NOT EXISTS idx_defects_test_case_id ON defects(test_case_id);
CREATE INDEX IF NOT EXISTS idx_defects_test_execution_id ON defects(test_execution_id);
CREATE INDEX IF NOT EXISTS idx_defects_assignee_id ON defects(assignee_id);
CREATE INDEX IF NOT EXISTS idx_defects_reporter_id ON defects(reporter_id);
CREATE INDEX IF NOT EXISTS idx_defects_created_at ON defects(created_at DESC);
