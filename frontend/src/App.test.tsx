import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authApi from './api/auth';
import * as clientApi from './api/client';

describe('App & Authentication Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    // Default mock for health checks
    vi.spyOn(clientApi, 'checkHealth').mockResolvedValue({
      success: true,
      message: 'Service is up',
      data: {
        status: 'UP',
        service: 'sdlc-platform',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    vi.spyOn(clientApi, 'checkActuatorHealth').mockResolvedValue({
      status: 'UP',
      components: {
        db: {
          status: 'UP',
          details: { database: 'PostgreSQL' },
        },
      },
    });
  });

  it('renders sign in form by default when not authenticated', async () => {
    render(<App />);

    expect(screen.getByText('SDLC Platform')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Backend: Connected')).toBeInTheDocument());
  });

  it('allows toggling between Login and Register forms', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Backend: Connected')).toBeInTheDocument());

    // Click link to switch to Register
    const registerLink = screen.getByRole('button', { name: 'Register here' });
    fireEvent.click(registerLink);

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Assigned Role: Developer \/ Student/i)).toBeInTheDocument();

    // Click link to switch back to Sign In
    const signInLink = screen.getByRole('button', { name: 'Sign in here' });
    fireEvent.click(signInLink);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('handles successful login and transitions to authenticated workspace', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'mock-jwt-token-xyz',
      tokenType: 'Bearer',
      expiresIn: 86400000,
      user: {
        id: 'u-1234',
        email: 'alex.dev@example.com',
        username: 'alexdev',
        fullName: 'Alex Developer',
        roles: ['ROLE_DEVELOPER'],
      },
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Username or Email/i), {
      target: { value: 'alexdev' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'securePass123!' },
    });

    const form = screen.getByRole('button', { name: 'Sign In' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Alex Developer')).toBeInTheDocument();
      expect(screen.getByText('(@alexdev)')).toBeInTheDocument();
      expect(screen.getAllByText('Developer / Student').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Authenticated')).toBeInTheDocument();
    });
  });

  it('displays generic error message on failed login', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new Error('Invalid username/email or password.')
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Username or Email/i), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpass' },
    });

    const form = screen.getByRole('button', { name: 'Sign In' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Invalid username/email or password.')).toBeInTheDocument();
    });
  });

  it('handles successful registration flow', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({
      accessToken: 'mock-jwt-token-register',
      tokenType: 'Bearer',
      expiresIn: 86400000,
      user: {
        id: 'u-5678',
        email: 'newuser@example.com',
        username: 'newuser',
        fullName: 'New User',
        roles: ['ROLE_DEVELOPER'],
      },
    });

    render(<App />);

    // Switch to register form
    fireEvent.click(screen.getByRole('button', { name: 'Register here' }));

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123!' },
    });

    const form = screen.getByRole('button', { name: 'Create Account' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('New User')).toBeInTheDocument();
      expect(screen.getByText('(@newuser)')).toBeInTheDocument();
      expect(screen.getAllByText('Developer / Student').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('restores authenticated session when token exists on mount', async () => {
    vi.spyOn(authApi, 'getStoredToken').mockReturnValue('existing-valid-jwt');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({
      id: 'u-9999',
      email: 'saved.session@example.com',
      username: 'savedsession',
      fullName: 'Saved Session User',
      roles: ['ROLE_DEVELOPER'],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Saved Session User')).toBeInTheDocument();
      expect(screen.getByText('(@savedsession)')).toBeInTheDocument();
    });
  });

  it('handles logout and returns to sign in view', async () => {
    vi.spyOn(authApi, 'getStoredToken').mockReturnValue('existing-valid-jwt');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({
      id: 'u-9999',
      email: 'logout.user@example.com',
      username: 'logoutuser',
      fullName: 'Logout User',
      roles: ['ROLE_DEVELOPER'],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Logout User')).toBeInTheDocument();
    });

    // Find and click the workspace logout button
    const logoutButtons = screen.getAllByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });
  });

  it('preserves system health diagnostics and runtime service monitoring', async () => {
    render(<App />);

    // Switch to System Health tab
    const healthTabs = screen.getAllByRole('button', { name: /System Health/i });
    fireEvent.click(healthTabs[0]);

    expect(screen.getByText('System Diagnostics & Health Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Runtime Services')).toBeInTheDocument();
    expect(screen.getByText('Backend API')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot 3.4.1')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Frontend Client')).toBeInTheDocument();
    expect(screen.getByText('Java Runtime')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Backend: Connected')).toBeInTheDocument();
      expect(screen.getByText('UP (PostgreSQL 16)')).toBeInTheDocument();
    });
  });
});
