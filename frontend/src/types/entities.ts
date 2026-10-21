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

export type UserStory = StorySummary;

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

export type DocumentStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'DEPRECATED'
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SUPERSEDED';

export type DiagramSyntax = 'MERMAID' | 'PLANTUML' | 'NONE';

// ============================================================================
// Specialized Structured Content Models for Phase 4 Categories
// ============================================================================

export interface FunctionalRequirementItem {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface NonFunctionalRequirementItem {
  category: string;
  requirement: string;
}

export interface ProductRequirementContent {
  problemStatement: string;
  scope: {
    inScope: string[];
    outOfScope: string[];
  };
  functionalRequirements: FunctionalRequirementItem[];
  nonFunctionalRequirements: NonFunctionalRequirementItem[];
  acceptanceCriteria: string[];
  linkedStoryIds?: string[];
}

export interface ApiParameterItem {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  required: boolean;
  description: string;
}

export interface ApiResponseItem {
  statusCode: number;
  description: string;
  exampleJson?: string;
}

export interface ApiErrorCodeItem {
  code: string;
  reason: string;
  exampleJson?: string;
}

export interface ApiEndpointItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  parameters: ApiParameterItem[];
  requestBody?: {
    contentType: string;
    schemaDescription: string;
    exampleJson: string;
  };
  responses: ApiResponseItem[];
  errorCodes: ApiErrorCodeItem[];
}

export interface ApiDesignContent {
  basePath: string;
  version: string;
  lifecycle: 'PROPOSED' | 'DRAFT' | 'IMPLEMENTED' | 'DEPRECATED';
  endpoints: ApiEndpointItem[];
}

export interface TechChoiceItem {
  technology: string;
  role: string;
  rationale: string;
}

export interface ComponentResponsibilityItem {
  component: string;
  responsibility: string;
}

export interface TechnicalSpecContent {
  architectureOverview: string;
  technologyChoices: TechChoiceItem[];
  componentResponsibilities: ComponentResponsibilityItem[];
  databaseDesign: string;
  dataFlow: string;
  securityConsiderations: string;
  implementationDetails: string;
  linkedDiagramIds?: string[];
  linkedRequirementIds?: string[];
}

export interface AdrOptionItem {
  option: string;
  pros: string;
  cons: string;
}

export interface DecisionRecordContent {
  context: string;
  problemDrivers: string[];
  optionsConsidered: AdrOptionItem[];
  decision: string;
  rationale: string;
  consequences: {
    positive: string[];
    negative: string[];
  };
  authors?: string[];
  deciders?: string[];
  statusDate?: string;
  supersededById?: string;
}

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

// ==========================================
// Phase 5: Testing & QA Management Entities
// ==========================================

export type TestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TestCaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PASSED'
  | 'FAILED'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'DEPRECATED';

export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  testCaseCount: number;
  createdByUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseSummary {
  id: string;
  projectId: string;
  projectKey: string;
  suiteId?: string | null;
  suiteName?: string | null;
  caseNumber: number;
  caseKey: string;
  title: string;
  priority: TestPriority;
  status: TestCaseStatus;
  createdByUsername?: string;
  createdAt: string;
  updatedAt: string;
  userStoryId?: string | null;
  userStoryKey?: string | null;
  userStoryTitle?: string | null;
  requirementId?: string | null;
  requirementTitle?: string | null;
}

export interface TestCaseDetail extends TestCaseSummary {
  projectName: string;
  description?: string;
  preconditions?: string;
  testSteps?: string;
  expectedResult?: string;
}

export interface CreateTestSuitePayload {
  name: string;
  description?: string;
}

export interface UpdateTestSuitePayload {
  name: string;
  description?: string;
}

export interface CreateTestCasePayload {
  title: string;
  description?: string;
  preconditions?: string;
  testSteps?: string;
  expectedResult?: string;
  priority?: TestPriority;
  status?: TestCaseStatus;
  suiteId?: string | null;
  userStoryId?: string | null;
  requirementId?: string | null;
}

export interface UpdateTestCasePayload {
  title: string;
  description?: string;
  preconditions?: string;
  testSteps?: string;
  expectedResult?: string;
  priority?: TestPriority;
  status?: TestCaseStatus;
  suiteId?: string | null;
  userStoryId?: string | null;
  requirementId?: string | null;
}

export interface LinkTestCasePayload {
  userStoryId?: string | null;
  requirementId?: string | null;
}

export interface UpdateTestCaseStatusPayload {
  status: TestCaseStatus;
}

// ============================================================================
// Phase 5, Step 2: Test Execution Models
// ============================================================================

export type TestExecutionStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

export interface TestExecution {
  id: string;
  testCaseId: string;
  testCaseKey: string;
  testCaseTitle: string;
  projectId: string;
  status: TestExecutionStatus;
  actualResult: string;
  notes?: string | null;
  durationMs?: number | null;
  executedByUsername?: string | null;
  executedAt: string;
}

export interface ExecuteTestCasePayload {
  status: TestExecutionStatus;
  actualResult: string;
  notes?: string | null;
  durationMs?: number | null;
}

export interface ProjectExecutionSummary {
  projectId: string;
  totalExecutions: number;
  passedExecutions: number;
  failedExecutions: number;
  blockedExecutions: number;
  skippedExecutions: number;
  passRate: number;
  recentExecutions: TestExecution[];
}

// ============================================================================
// Phase 5, Step 3: Defect Tracking & Bug Management Models
// ============================================================================

export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DefectStatus = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export interface DefectSummary {
  id: string;
  projectId: string;
  projectKey: string;
  defectNumber: number;
  defectKey: string;
  title: string;
  severity: DefectSeverity;
  priority: TestPriority;
  status: DefectStatus;
  assigneeId?: string | null;
  assigneeUsername?: string | null;
  assigneeFullName?: string | null;
  reporterUsername?: string | null;
  testCaseId?: string | null;
  testCaseKey?: string | null;
  testCaseTitle?: string | null;
  testExecutionId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface DefectDetail {
  id: string;
  projectId: string;
  projectName: string;
  projectKey: string;
  defectNumber: number;
  defectKey: string;
  title: string;
  description?: string | null;
  stepsToReproduce?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  severity: DefectSeverity;
  priority: TestPriority;
  status: DefectStatus;
  assigneeId?: string | null;
  assigneeUsername?: string | null;
  assigneeFullName?: string | null;
  reporterId?: string | null;
  reporterUsername?: string | null;
  reporterFullName?: string | null;
  testCaseId?: string | null;
  testCaseKey?: string | null;
  testCaseTitle?: string | null;
  testExecutionId?: string | null;
  testExecutionStatus?: TestExecutionStatus | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface CreateDefectPayload {
  title: string;
  description?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  severity?: DefectSeverity;
  priority?: TestPriority;
  status?: DefectStatus;
  assigneeId?: string | null;
  testCaseId?: string | null;
  testExecutionId?: string | null;
}

export interface UpdateDefectPayload {
  title: string;
  description?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  severity?: DefectSeverity;
  priority?: TestPriority;
  status?: DefectStatus;
  assigneeId?: string | null;
  testCaseId?: string | null;
  testExecutionId?: string | null;
}

export interface ProjectDefectSummary {
  totalDefects: number;
  openDefects: number;
  inProgressDefects: number;
  inReviewDefects: number;
  resolvedDefects: number;
  closedDefects: number;
  reopenedDefects: number;
  criticalDefects: number;
  highDefects: number;
  recentDefects: DefectSummary[];
}

// ============================================================================
// Phase 5, Step 4: Requirements & Testing Traceability Models
// ============================================================================

export interface TraceabilityTestCase {
  id: string;
  caseNumber: number;
  caseKey: string;
  title: string;
  priority: TestPriority;
  status: TestCaseStatus;
  latestExecutionStatus?: TestExecutionStatus | null;
  latestExecutionDate?: string | null;
  latestExecutionDurationMs?: number | null;
  latestExecutionNotes?: string | null;
  defects: DefectSummary[];
}

export interface TraceabilityItem {
  id: string;
  key: string;
  title: string;
  type: 'USER_STORY' | 'PRODUCT_REQUIREMENTS' | string;
  status: string;
  priority: string;
  testCases: TraceabilityTestCase[];
  hasCoverage: boolean;
}

export interface UnlinkedTestCase {
  id: string;
  caseNumber: number;
  caseKey: string;
  title: string;
  priority: TestPriority;
  status: TestCaseStatus;
  latestExecutionStatus?: TestExecutionStatus | null;
  latestExecutionDate?: string | null;
  defects: DefectSummary[];
}

export interface TraceabilitySummary {
  totalRequirements: number;
  coveredRequirements: number;
  uncoveredRequirements: number;
  coveragePercentage: number;
  totalTestCases: number;
  executedTestCases: number;
  neverExecutedTestCases: number;
  executionPercentage: number;
  totalDefects: number;
  openDefects: number;
}

export interface ProjectTraceabilityMatrix {
  projectId: string;
  projectKey: string;
  projectName: string;
  summary: TraceabilitySummary;
  items: TraceabilityItem[];
  unlinkedTestCases: UnlinkedTestCase[];
}

// ============================================================================
// Phase 5, Step 5: Release Readiness & Quality Gates Models
// ============================================================================

export type ReadinessStatus = 'READY' | 'NEEDS_ATTENTION' | 'BLOCKED';

export interface TestExecutionStats {
  totalTests: number;
  executedTests: number;
  neverExecutedTests: number;
  passedTests: number;
  failedTests: number;
  blockedTests: number;
  skippedTests: number;
  totalExecutions: number;
  passRate: number;
}

export interface DefectStats {
  totalDefects: number;
  unresolvedTotal: number;
  unresolvedCritical: number;
  unresolvedHigh: number;
  unresolvedMedium: number;
  unresolvedLow: number;
  resolvedTotal: number;
}

export interface RequirementCoverageStats {
  totalRequirements: number;
  coveredRequirements: number;
  uncoveredRequirements: number;
  coveragePercentage: number;
}

export interface ReadinessCriterion {
  id: string;
  name: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  isBlocker: boolean;
  summary: string;
  actualValue: string;
  targetValue: string;
}

export interface ReleaseReadinessSummary {
  projectId: string;
  projectKey: string;
  projectName: string;
  status: ReadinessStatus;
  isReady: boolean;
  summary: string;
  blockers: string[];
  warnings: string[];
  testStats: TestExecutionStats;
  defectStats: DefectStats;
  requirementStats: RequirementCoverageStats;
  criteria: ReadinessCriterion[];
  evaluatedAt: string;
}


