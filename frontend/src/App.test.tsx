import { render, screen } from '@testing-library/react';

import { authApi } from './api/auth';
import { notesApi } from './api/notes';
import { fakeUser } from '../test/factories';
import App from './App';

jest.mock('./api/auth', () => ({
  authApi: { me: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn() },
}));

jest.mock('./api/notes', () => ({
  notesApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

const mockedAuth = authApi as jest.Mocked<typeof authApi>;
const mockedNotes = notesApi as jest.Mocked<typeof notesApi>;
const dashboardMarker = { name: 'New note' } as const;

describe('App routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotes.list.mockResolvedValue([]);
    window.history.pushState({}, '', '/');
  });

  it('sends an anonymous visitor to the login screen', async () => {
    mockedAuth.me.mockRejectedValue(new Error('401'));

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('sends a signed-in visitor to the dashboard', async () => {
    mockedAuth.me.mockResolvedValue(fakeUser());

    render(<App />);

    expect(await screen.findByRole('button', dashboardMarker)).toBeInTheDocument();
  });

  it('keeps a signed-in visitor away from the login screen', async () => {
    mockedAuth.me.mockResolvedValue(fakeUser());
    window.history.pushState({}, '', '/login');

    render(<App />);

    expect(await screen.findByRole('button', dashboardMarker)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
  });

  it('shows neither screen while the session is still being checked', () => {
    mockedAuth.me.mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', dashboardMarker)).not.toBeInTheDocument();
  });
});
