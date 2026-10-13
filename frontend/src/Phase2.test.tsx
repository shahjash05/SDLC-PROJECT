import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationSection } from './components/workspace/OrganizationSection';
import { TeamSection } from './components/workspace/TeamSection';
import { ProjectSection } from './components/workspace/ProjectSection';
import * as orgApi from './api/organizations';
import * as teamApi from './api/teams';
import * as projectApi from './api/projects';

describe('Phase 2: Organizations, Teams & Projects Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('OrganizationSection', () => {
    it('renders empty state when user has no organizations', async () => {
      vi.spyOn(orgApi, 'getOrganizations').mockResolvedValue([]);

      render(<OrganizationSection />);

      await waitFor(() => {
        expect(screen.getByText('No organizations found')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /New Organization/i })).toBeInTheDocument();
    });

    it('displays organization cards and opens creation form', async () => {
      vi.spyOn(orgApi, 'getOrganizations').mockResolvedValue([
        {
          id: 'org-1',
          name: 'Acme Software',
          slug: 'acme-soft',
          description: 'Acme engineering workspace',
          currentUserRole: 'OWNER',
          memberCount: 3,
          teamCount: 2,
          projectCount: 4,
          createdAt: new Date().toISOString(),
        },
      ]);

      render(<OrganizationSection />);

      await waitFor(() => {
        expect(screen.getByText('Acme Software')).toBeInTheDocument();
        expect(screen.getByText('/acme-soft')).toBeInTheDocument();
        expect(screen.getByText('OWNER')).toBeInTheDocument();
        expect(screen.getByText('3 members')).toBeInTheDocument();
        expect(screen.getByText('2 teams')).toBeInTheDocument();
        expect(screen.getByText('4 projects')).toBeInTheDocument();
      });

      // Toggle creation form
      fireEvent.click(screen.getByRole('button', { name: /New Organization/i }));
      expect(screen.getByLabelText(/Organization Name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument();
    });

    it('submits new organization and updates directory', async () => {
      vi.spyOn(orgApi, 'getOrganizations').mockResolvedValue([]);
      const createSpy = vi.spyOn(orgApi, 'createOrganization').mockResolvedValue({
        id: 'org-created',
        name: 'Beta Labs',
        slug: 'beta-labs',
        description: 'Testing division',
        currentUserRole: 'OWNER',
        members: [
          {
            id: 'm-1',
            userId: 'u-1',
            username: 'tester',
            fullName: 'Test User',
            email: 'test@example.com',
            role: 'OWNER',
            joinedAt: new Date().toISOString(),
          },
        ],
        memberCount: 1,
        teamCount: 0,
        projectCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(<OrganizationSection />);

      await waitFor(() => {
        expect(screen.getByText('No organizations found')).toBeInTheDocument();
      });

      // Open form
      fireEvent.click(screen.getByRole('button', { name: /New Organization/i }));

      fireEvent.change(screen.getByLabelText(/Organization Name \*/i), {
        target: { value: 'Beta Labs' },
      });
      fireEvent.change(screen.getByLabelText(/Slug/i), {
        target: { value: 'beta-labs' },
      });

      const form = screen.getByLabelText(/Organization Name \*/i).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({
          name: 'Beta Labs',
          slug: 'beta-labs',
          description: undefined,
        });
      });
    });
  });

  describe('TeamSection', () => {
    it('renders teams in selected organization and creates team', async () => {
      vi.spyOn(orgApi, 'getOrganizations').mockResolvedValue([
        {
          id: 'org-1',
          name: 'Acme Software',
          slug: 'acme-soft',
          memberCount: 2,
          teamCount: 1,
          projectCount: 1,
          createdAt: new Date().toISOString(),
        },
      ]);

      vi.spyOn(teamApi, 'getTeams').mockResolvedValue([
        {
          id: 'team-1',
          organizationId: 'org-1',
          name: 'Platform Core',
          description: 'Core backend team',
          leaderUsername: 'lead_dev',
          memberCount: 4,
          projectCount: 2,
          createdAt: new Date().toISOString(),
        },
      ]);

      render(<TeamSection initialOrgId="org-1" />);

      await waitFor(() => {
        expect(screen.getByText('Platform Core')).toBeInTheDocument();
        expect(screen.getByText('Leader: lead_dev')).toBeInTheDocument();
        expect(screen.getByText('4 members')).toBeInTheDocument();
        expect(screen.getByText('2 projects')).toBeInTheDocument();
      });

      // Click New Team
      fireEvent.click(screen.getByRole('button', { name: /New Team/i }));
      expect(screen.getByLabelText(/Team Name \*/i)).toBeInTheDocument();
    });
  });

  describe('ProjectSection', () => {
    it('renders project list with key, team, and status badges', async () => {
      vi.spyOn(orgApi, 'getOrganizations').mockResolvedValue([
        {
          id: 'org-1',
          name: 'Acme Software',
          slug: 'acme-soft',
          memberCount: 2,
          teamCount: 1,
          projectCount: 1,
          createdAt: new Date().toISOString(),
        },
      ]);

      vi.spyOn(projectApi, 'getAllProjects').mockResolvedValue([
        {
          id: 'p-1',
          organizationId: 'org-1',
          organizationName: 'Acme Software',
          teamId: 'team-1',
          teamName: 'Platform Core',
          name: 'SDLC Microservices',
          projectKey: 'SDLC',
          description: 'Phase 2 project tracking',
          status: 'ACTIVE',
          createdByUsername: 'architect',
          createdAt: new Date().toISOString(),
        },
      ]);

      render(<ProjectSection />);

      await waitFor(() => {
        expect(screen.getByText('SDLC')).toBeInTheDocument();
        expect(screen.getByText('SDLC Microservices')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('Team: Platform Core')).toBeInTheDocument();
      });
    });

    it('submits a new project with key validation', async () => {
      vi.spyOn(orgApi, 'getOrganizations').mockResolvedValue([
        {
          id: 'org-1',
          name: 'Acme Software',
          slug: 'acme-soft',
          memberCount: 2,
          teamCount: 0,
          projectCount: 0,
          createdAt: new Date().toISOString(),
        },
      ]);

      vi.spyOn(teamApi, 'getTeams').mockResolvedValue([]);
      vi.spyOn(projectApi, 'getAllProjects').mockResolvedValue([]);
      const createProjSpy = vi.spyOn(projectApi, 'createProject').mockResolvedValue({
        id: 'p-new',
        organizationId: 'org-1',
        organizationName: 'Acme Software',
        teamId: null,
        teamName: null,
        name: 'Sprint Tracker',
        projectKey: 'TRACK',
        description: 'Issue tracker',
        status: 'PLANNING',
        createdByUsername: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(<ProjectSection initialOrgId="org-1" />);

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /New Project/i }));

      fireEvent.change(screen.getByLabelText(/Project Key/i), {
        target: { value: 'TRACK' },
      });
      fireEvent.change(screen.getByLabelText(/Project Name \*/i), {
        target: { value: 'Sprint Tracker' },
      });

      const form = screen.getByLabelText(/Project Name \*/i).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(createProjSpy).toHaveBeenCalledWith(
          'org-1',
          expect.objectContaining({
            projectKey: 'TRACK',
            name: 'Sprint Tracker',
            status: 'PLANNING',
          })
        );
      });
    });
  });
});
