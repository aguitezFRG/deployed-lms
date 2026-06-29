import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it } from 'vitest';
import App from '../src/App';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
const renderAt = (path = '/login') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
async function login(email = 'student@library.demo') { const user = userEvent.setup(); renderAt(); await user.clear(screen.getByLabelText('Email')); await user.type(screen.getByLabelText('Email'), email); await user.click(screen.getByRole('button', { name: 'Sign in' })); return user; }

it('guards protected routes', () => { renderAt('/dashboard'); expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument(); });
it('shows credential errors', async () => { const user = userEvent.setup(); renderAt(); await user.clear(screen.getByLabelText('Password')); await user.type(screen.getByLabelText('Password'), 'bad'); await user.click(screen.getByRole('button', { name: 'Sign in' })); expect(await screen.findByRole('alert')).toHaveTextContent('incorrect'); });
it('renders the student onboarding dashboard', async () => { await login(); expect(await screen.findByText('Start exploring the LMS Demo')).toBeInTheDocument(); });
it('renders staff dashboard request tabs', async () => { await login('superadmin@library.demo'); expect(await screen.findByRole('tab', { name: /Borrow Requests/ })).toBeInTheDocument(); expect(screen.getByRole('tab', { name: /Access Requests/ })).toBeInTheDocument(); });
it('selects another demo account from the credential modal', async () => { const user = userEvent.setup(); renderAt(); await user.click(screen.getByRole('button', { name: 'View other users' })); expect(screen.getByRole('dialog', { name: 'Choose a demo user' })).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: /Faculty/ })); expect(screen.getByLabelText('Email')).toHaveValue('faculty@library.demo'); });
it('shows and hides the password', async () => { const user = userEvent.setup(); renderAt(); const password = screen.getByLabelText('Password'); await user.click(screen.getByRole('button', { name: 'Show password' })); expect(password).toHaveAttribute('type', 'text'); await user.click(screen.getByRole('button', { name: 'Hide password' })); expect(password).toHaveAttribute('type', 'password'); });
it('opens the notification popover and profile route', async () => { const user = await login('faculty@library.demo'); await user.click(screen.getByRole('button', { name: 'Notifications' })); expect(screen.getByText('View all notifications')).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'Open account menu' })); await user.click(screen.getByRole('link', { name: 'Profile' })); expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument(); });
