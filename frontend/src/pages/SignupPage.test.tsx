import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { AuthProvider } from '../auth/AuthProvider';
import { SignupPage } from './SignupPage';

jest.mock('../api/auth', () => ({
  authApi: { me: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn() },
}));

const mocked = authApi as jest.Mocked<typeof authApi>;

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function fillForm(password = 'supersecret') {
  await userEvent.type(screen.getByLabelText('Name'), 'Alice');
  await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
  await userEvent.type(screen.getByLabelText('Password'), password);
}

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.me.mockRejectedValue(new ApiError(401, 'Authentication required'));
  });

  it('renders all three fields', () => {
    renderPage();

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows the password rule before the user submits', () => {
    renderPage();

    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
  });

  it('submits what the user typed', async () => {
    mocked.signup.mockResolvedValue({ id: '1', email: 'alice@example.com', name: 'Alice' });
    renderPage();

    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(mocked.signup).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'supersecret',
    });
  });

  it('rejects a short password without calling the server', async () => {
    renderPage();

    await fillForm('short');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('at least 8 characters');
    expect(mocked.signup).not.toHaveBeenCalled();
  });

  it('shows the server message when the email is already taken', async () => {
    mocked.signup.mockRejectedValue(new ApiError(409, 'Email already registered'));
    renderPage();

    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
  });

  it('does not blame a field for an error the server did not attribute', async () => {
    mocked.signup.mockRejectedValue(new ApiError(409, 'Email already registered'));
    renderPage();

    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByRole('alert');

    for (const label of ['Name', 'Email', 'Password']) {
      expect(screen.getByLabelText(label)).not.toHaveAttribute('aria-invalid');
    }
  });

  it('marks only the password field when the password is too short', async () => {
    renderPage();

    await fillForm('short');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('links to the login screen', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });
});
