import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SprintBoardView } from './components/workspace/SprintBoardView';
import * as orgApi from './api/organizations';
import * as projectApi from './api/projects';
import * as sprintApi from './api/sprints';
import * as reqApi from './api/requirements';

describe('Phase 3: Requirements & Sprint Planning Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(orgApi, 'getOrganizations').mockResolvedValue([
      {
        id: 'org-1',
        name: 'Engineering Division',
        slug: 'eng-div',
        memberCount: 3,
        teamCount: 1,
        projectCount: 1,
        createdAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(projectApi, 'getAllProjects').mockResolvedValue([
      {
        id: 'proj-1',
        organizationId: 'org-1',
        organizationName: 'Engineering Division',
        name: 'Design System V2',
        projectKey: 'DSV2',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  it('renders sprint board with Kanban columns and active sprint metrics', async () => {
    vi.spyOn(sprintApi, 'getSprints').mockResolvedValue([
      {
        id: 'sprint-1',
        projectId: 'proj-1',
        name: 'Sprint 1 - Foundation',
        goal: 'Deliver auth and components',
        status: 'ACTIVE',
        storyCount: 2,
        completedStoryCount: 0,
        totalStoryPoints: 8,
        createdAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(reqApi, 'getStories').mockResolvedValue([
      {
        id: 'story-1',
        projectId: 'proj-1',
        projectKey: 'DSV2',
        sprintId: 'sprint-1',
        sprintName: 'Sprint 1 - Foundation',
        storyNumber: 1,
        storyKey: 'DSV2-1',
        title: 'Create button variants and icon system',
        status: 'TODO',
        priority: 'HIGH',
        storyPoints: 5,
        assigneeUsername: 'alexdev',
        taskCount: 2,
        completedTaskCount: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'story-2',
        projectId: 'proj-1',
        projectKey: 'DSV2',
        sprintId: 'sprint-1',
        sprintName: 'Sprint 1 - Foundation',
        storyNumber: 2,
        storyKey: 'DSV2-2',
        title: 'Implement modal drawer animations',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        storyPoints: 3,
        assigneeUsername: 'samdev',
        taskCount: 1,
        completedTaskCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<SprintBoardView initialProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Sprint 1 - Foundation (ACTIVE)')).toBeInTheDocument();
      expect(screen.getByText('Deliver auth and components')).toBeInTheDocument();
      expect(screen.getByText('Points: 8')).toBeInTheDocument();
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('In Review')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText('DSV2-1')).toBeInTheDocument();
      expect(screen.getByText('Create button variants and icon system')).toBeInTheDocument();
      expect(screen.getByText('DSV2-2')).toBeInTheDocument();
      expect(screen.getByText('Implement modal drawer animations')).toBeInTheDocument();
    });
  });

  it('updates story status forward on Kanban board', async () => {
    vi.spyOn(sprintApi, 'getSprints').mockResolvedValue([
      {
        id: 'sprint-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        storyCount: 1,
        completedStoryCount: 0,
        totalStoryPoints: 5,
        createdAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(reqApi, 'getStories').mockResolvedValue([
      {
        id: 'story-1',
        projectId: 'proj-1',
        projectKey: 'DSV2',
        sprintId: 'sprint-1',
        sprintName: 'Sprint 1',
        storyNumber: 1,
        storyKey: 'DSV2-1',
        title: 'Moveable story',
        status: 'TODO',
        priority: 'MEDIUM',
        storyPoints: 5,
        taskCount: 0,
        completedTaskCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    const statusSpy = vi.spyOn(reqApi, 'updateStoryStatus').mockResolvedValue({
      id: 'story-1',
      projectId: 'proj-1',
      projectKey: 'DSV2',
      sprintId: 'sprint-1',
      sprintName: 'Sprint 1',
      storyNumber: 1,
      storyKey: 'DSV2-1',
      title: 'Moveable story',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      storyPoints: 5,
      taskCount: 0,
      completedTaskCount: 0,
      createdAt: new Date().toISOString(),
    });

    render(<SprintBoardView initialProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Moveable story')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(statusSpy).toHaveBeenCalledWith('story-1', 'IN_PROGRESS');
    });
  });

  it('switches to Product Backlog view and displays unassigned stories', async () => {
    vi.spyOn(sprintApi, 'getSprints').mockResolvedValue([]);
    vi.spyOn(reqApi, 'getStories').mockResolvedValue([
      {
        id: 'backlog-1',
        projectId: 'proj-1',
        projectKey: 'DSV2',
        sprintId: null,
        sprintName: null,
        storyNumber: 3,
        storyKey: 'DSV2-3',
        title: 'Dark mode color tokens and theme switcher',
        status: 'BACKLOG',
        priority: 'LOW',
        storyPoints: 2,
        taskCount: 0,
        completedTaskCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<SprintBoardView initialProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Product Backlog/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Product Backlog/i }));

    await waitFor(() => {
      expect(screen.getByText('Dark mode color tokens and theme switcher')).toBeInTheDocument();
      expect(screen.getByText('DSV2-3')).toBeInTheDocument();
    });
  });

  it('submits a new sprint form', async () => {
    vi.spyOn(sprintApi, 'getSprints').mockResolvedValue([]);
    vi.spyOn(reqApi, 'getStories').mockResolvedValue([]);
    const createSprintSpy = vi.spyOn(sprintApi, 'createSprint').mockResolvedValue({
      id: 'sprint-new',
      projectId: 'proj-1',
      projectName: 'Design System V2',
      projectKey: 'DSV2',
      name: 'Sprint 2 - Components',
      goal: 'Build card and form components',
      status: 'PLANNED',
      storyCount: 0,
      completedStoryCount: 0,
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<SprintBoardView initialProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Sprint/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Sprint/i }));

    expect(screen.getByLabelText(/Sprint Name \*/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Sprint Name \*/i), {
      target: { value: 'Sprint 2 - Components' },
    });
    fireEvent.change(screen.getByLabelText(/Sprint Goal/i), {
      target: { value: 'Build card and form components' },
    });

    const form = screen.getByLabelText(/Sprint Name \*/i).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createSprintSpy).toHaveBeenCalledWith('proj-1', {
        name: 'Sprint 2 - Components',
        goal: 'Build card and form components',
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  it('opens Story Details modal displaying Acceptance Criteria and tasks', async () => {
    vi.spyOn(sprintApi, 'getSprints').mockResolvedValue([
      {
        id: 'sprint-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
        storyCount: 1,
        completedStoryCount: 0,
        totalStoryPoints: 5,
        createdAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(reqApi, 'getStories').mockResolvedValue([
      {
        id: 'story-1',
        projectId: 'proj-1',
        projectKey: 'DSV2',
        sprintId: 'sprint-1',
        sprintName: 'Sprint 1',
        storyNumber: 1,
        storyKey: 'DSV2-1',
        title: 'Detailed story item',
        status: 'TODO',
        priority: 'HIGH',
        storyPoints: 5,
        taskCount: 1,
        completedTaskCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(reqApi, 'getStory').mockResolvedValue({
      id: 'story-1',
      projectId: 'proj-1',
      projectName: 'Design System V2',
      projectKey: 'DSV2',
      sprintId: 'sprint-1',
      sprintName: 'Sprint 1',
      storyNumber: 1,
      storyKey: 'DSV2-1',
      title: 'Detailed story item',
      description: 'As a developer I need consistent buttons',
      acceptanceCriteria: 'Given primary variant, When clicked, Then ripple effect triggers',
      status: 'TODO',
      priority: 'HIGH',
      storyPoints: 5,
      taskCount: 1,
      completedTaskCount: 0,
      tasks: [
        {
          id: 'task-1',
          storyId: 'story-1',
          title: 'Export Button component in index.ts',
          status: 'TODO',
          estimatedHours: 2.5,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<SprintBoardView initialProjectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Detailed story item')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Detailed story item'));

    await waitFor(() => {
      expect(screen.getByText('User Story Description')).toBeInTheDocument();
      expect(screen.getByText(/As a developer I need consistent buttons/i)).toBeInTheDocument();
      expect(screen.getByText(/Given primary variant, When clicked, Then ripple effect triggers/i)).toBeInTheDocument();
      expect(screen.getByText('Export Button component in index.ts')).toBeInTheDocument();
      expect(screen.getByText('2.5h')).toBeInTheDocument();
    });
  });
});
