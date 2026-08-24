import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from '../api/auth';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { fakeUser } from '../../test/factories';

jest.mock('../api/auth', () => ({
  authApi: {
    me: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
  },
}));

const mocked = authApi as jest.Mocked<typeof authApi>;
const alice = fakeUser();

function Probe() {
  const { user, isLoading, login, logout } = useAuth();

  return (
    <div>
      <p>{isLoading ? 'loading' : (user?.email ?? 'anonymous')}</p>
      <button onClick={() => void login({ email: 'a@b.com', password: 'pw' })}>log in</button>
      <button onClick={() => void logout()}>log out</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in a loading state rather than reporting nobody is signed in', async () => {
    mocked.me.mockReturnValue(new Promise(() => {}));

    renderProbe();

    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('restores the session from the cookie on mount', async () => {
    mocked.me.mockResolvedValue(alice);

    renderProbe();

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
  });

  it('treats a rejected session check as signed out, not an error', async () => {
    mocked.me.mockRejectedValue(new Error('401'));

    renderProbe();

    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('stores the user after logging in', async () => {
    mocked.me.mockRejectedValue(new Error('401'));
    mocked.login.mockResolvedValue(alice);

    renderProbe();
    await screen.findByText('anonymous');

    await userEvent.click(screen.getByRole('button', { name: 'log in' }));

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
  });

  it('clears the user on logout', async () => {
    mocked.me.mockResolvedValue(alice);
    mocked.logout.mockResolvedValue({ message: 'Logged out' });

    renderProbe();
    await screen.findByText('alice@example.com');

    await userEvent.click(screen.getByRole('button', { name: 'log out' }));

    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('clears the user even when the logout request fails', async () => {
    mocked.me.mockResolvedValue(alice);
    mocked.logout.mockRejectedValue(new Error('network'));

    renderProbe();
    await screen.findByText('alice@example.com');

    await userEvent.click(screen.getByRole('button', { name: 'log out' }));

    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
  });
});
