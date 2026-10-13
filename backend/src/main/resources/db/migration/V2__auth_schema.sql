-- =============================================================
-- V2__auth_schema.sql
-- Phase 1: Authentication & Permissions Schema
-- Roles: Developer, Team Leader, Faculty, Client, Admin
-- =============================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User-Roles mapping table (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Pre-seed standard roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_DEVELOPER', 'Student or developer team member'),
    ('ROLE_TEAM_LEADER', 'Team leader managing sprints and project deliverables'),
    ('ROLE_FACULTY', 'Faculty mentor or academic supervisor'),
    ('ROLE_CLIENT', 'External client or stakeholder reviewer'),
    ('ROLE_ADMIN', 'Platform administrator with management privileges')
ON CONFLICT (name) DO NOTHING;
