-- =============================================================
-- V6__test_management_schema.sql
-- Phase 5: Test Case Management & Quality Assurance Schema
-- =============================================================

-- Test Suites table
CREATE TABLE IF NOT EXISTS test_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_suite_name UNIQUE (project_id, name)
);

-- Test Cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    suite_id UUID REFERENCES test_suites(id) ON DELETE SET NULL,
    case_number INT NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    preconditions TEXT,
    test_steps TEXT,
    expected_result TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_case_number UNIQUE (project_id, case_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON test_suites(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_suite_id ON test_cases(suite_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
