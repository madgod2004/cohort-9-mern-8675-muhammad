import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { AuthProvider } from '../auth/AuthProvider';
import { LoginPage } from './LoginPage';
import { fakeUser } from '../../test/factories';

jest.mock('../api/auth', () => ({
  authApi: { me: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn() },
}));

const mocked = authApi as jest.Mocked<typeof authApi>;

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.me.mockRejectedValue(new ApiError(401, 'Authentication required'));
  });

  it('renders the email and password fields', () => {
    renderPage();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('submits what the user typed', async () => {
    mocked.login.mockResolvedValue(fakeUser());
    renderPage();

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(mocked.login).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'supersecret',
    });
  });

  it('shows the server message when the credentials are rejected', async () => {
    mocked.login.mockRejectedValue(new ApiError(401, 'Invalid email or password'));
    renderPage();

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('re-enables the button after a failure so the user can retry', async () => {
    mocked.login.mockRejectedValue(new ApiError(401, 'Invalid email or password'));
    renderPage();

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });

  it('does not blame a single field for a rejected login', async () => {
    mocked.login.mockRejectedValue(new ApiError(401, 'Invalid email or password'));
    renderPage();

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Password')).not.toHaveAttribute('aria-invalid');
  });

  it('links to the signup screen', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });
});
