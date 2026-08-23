import { render, screen } from '@testing-library/react';

import { authApi } from './api/auth';
import App from './App';

jest.mock('./api/auth', () => ({
  authApi: { me: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn() },
}));

const mocked = authApi as jest.Mocked<typeof authApi>;

describe('App routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('sends an anonymous visitor to the login screen', async () => {
    mocked.me.mockRejectedValue(new Error('401'));

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('sends a signed-in visitor to the dashboard', async () => {
    mocked.me.mockResolvedValue({ id: '1', email: 'alice@example.com', name: 'Alice' });

    render(<App />);

    expect(await screen.findByText(/alice@example.com/)).toBeInTheDocument();
  });

  it('keeps a signed-in visitor away from the login screen', async () => {
    mocked.me.mockResolvedValue({ id: '1', email: 'alice@example.com', name: 'Alice' });
    window.history.pushState({}, '', '/login');

    render(<App />);

    expect(await screen.findByText(/alice@example.com/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
  });

  it('shows neither screen while the session is still being checked', () => {
    mocked.me.mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
    expect(screen.queryByText(/alice@example.com/)).not.toBeInTheDocument();
  });
});
