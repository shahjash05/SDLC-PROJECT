-- =============================================================
-- V7__test_execution_schema.sql
-- Phase 5, Step 2: Test Execution & History Schema
-- =============================================================

-- Test Executions table
CREATE TABLE IF NOT EXISTS test_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- PASSED, FAILED, BLOCKED, SKIPPED
    actual_result TEXT NOT NULL,
    notes TEXT,
    duration_ms INT,
    executed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for execution history and project reporting
CREATE INDEX IF NOT EXISTS idx_test_executions_case_id ON test_executions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_project_id ON test_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_executed_at ON test_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
