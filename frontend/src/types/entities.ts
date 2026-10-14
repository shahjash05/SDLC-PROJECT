/**
 * Phase 2 domain entity types: Organizations, Teams, and Projects.
 */

export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface OrgMember {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: OrgMemberRole;
  joinedAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  currentUserRole?: OrgMemberRole | null;
  memberCount: number;
  teamCount: number;
  projectCount: number;
  createdAt: string;
}

export interface OrganizationDetail extends OrganizationSummary {
  members: OrgMember[];
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationPayload {
  name: string;
  description?: string;
}

export interface AddOrgMemberPayload {
  usernameOrEmail: string;
  role: OrgMemberRole;
}

export type TeamMemberRole = 'LEADER' | 'MEMBER';

export interface TeamMember {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: TeamMemberRole;
  joinedAt: string;
}

export interface TeamSummary {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  leaderId?: string | null;
  leaderUsername?: string | null;
  leaderFullName?: string | null;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export interface TeamDetail extends TeamSummary {
  members: TeamMember[];
  updatedAt: string;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  leaderId?: string;
}

export interface UpdateTeamPayload {
  name: string;
  description?: string;
  leaderId?: string;
}

export interface AddTeamMemberPayload {
  usernameOrEmail: string;
  role: TeamMemberRole;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface ProjectSummary {
  id: string;
  organizationId: string;
  organizationName: string;
  teamId?: string | null;
  teamName?: string | null;
  name: string;
  projectKey: string;
  description?: string;
  status: ProjectStatus;
  createdByUsername?: string | null;
  createdAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  projectKey: string;
  description?: string;
  teamId?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
  teamId?: string;
}

/**
 * Phase 3 domain entity types: Sprints, Requirements (User Stories), and Tasks.
 */

export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export interface SprintSummary {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  storyCount: number;
  completedStoryCount: number;
  totalStoryPoints: number;
  createdAt: string;
}

export interface SprintDetail extends SprintSummary {
  projectName: string;
  projectKey: string;
  completedStoryPoints: number;
  createdByUsername?: string;
  updatedAt: string;
}

export interface CreateSprintPayload {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintPayload {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
}

export type StoryStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type StoryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskItem {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  estimatedHours?: number;
  actualHours?: number;
  assigneeId?: string;
  assigneeUsername?: string;
  createdAt: string;
}

export interface StorySummary {
  id: string;
  projectId: string;
  projectKey: string;
  sprintId?: string | null;
  sprintName?: string | null;
  storyNumber: number;
  storyKey: string;
  title: string;
  status: StoryStatus;
  priority: StoryPriority;
  storyPoints?: number | null;
  assigneeId?: string | null;
  assigneeUsername?: string | null;
  assigneeFullName?: string | null;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
}

export interface StoryDetail extends StorySummary {
  projectName: string;
  description?: string;
  acceptanceCriteria?: string;
  createdByUsername?: string;
  tasks: TaskItem[];
  updatedAt: string;
}

export interface CreateStoryPayload {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: StoryPriority;
  storyPoints?: number;
  sprintId?: string;
  assigneeId?: string;
}

export interface UpdateStoryPayload {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  status?: StoryStatus;
  priority?: StoryPriority;
  storyPoints?: number;
  sprintId?: string;
  assigneeId?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  estimatedHours?: number;
  assigneeId?: string;
}

export interface UpdateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  estimatedHours?: number;
  actualHours?: number;
  assigneeId?: string;
}

// ============================================================================
// Phase 4: Architecture Diagrams, Design Documents & Versioning
// ============================================================================

export type DocumentType =
  | 'ARCHITECTURE_DIAGRAM'
  | 'TECHNICAL_SPEC'
  | 'API_DESIGN'
  | 'DECISION_RECORD'
  | 'PRODUCT_REQUIREMENTS'
  | 'GENERAL';

export type DocumentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'DEPRECATED';

export type DiagramSyntax = 'MERMAID' | 'PLANTUML' | 'NONE';

export interface DocumentSummary {
  id: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  title: string;
  type: DocumentType;
  diagramSyntax?: DiagramSyntax;
  currentVersion: number;
  status: DocumentStatus;
  createdByUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  content: string;
  diagramSyntax?: DiagramSyntax;
  changeSummary?: string;
  createdByUsername?: string;
  createdAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  content?: string;
  recentVersions: DocumentVersion[];
}

export interface CreateDocumentPayload {
  title: string;
  type?: DocumentType;
  content?: string;
  diagramSyntax?: DiagramSyntax;
}

export interface UpdateDocumentPayload {
  title: string;
  type?: DocumentType;
  content?: string;
  diagramSyntax?: DiagramSyntax;
  status?: DocumentStatus;
  changeSummary?: string;
}

export interface UpdateDocumentStatusPayload {
  status: DocumentStatus;
}


