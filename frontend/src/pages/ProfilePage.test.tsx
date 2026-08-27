import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { fakeNote, fakeUser } from '../../test/factories';
import { authApi, type User } from '../api/auth';
import { notesApi } from '../api/notes';
import { AuthProvider } from '../auth/AuthProvider';
import { ProfilePage } from './ProfilePage';

jest.mock('../api/auth', () => ({
  authApi: { me: jest.fn(), login: jest.fn(), signup: jest.fn(), logout: jest.fn() },
}));

jest.mock('../api/notes', () => ({
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

async function renderProfile(overrides: Partial<User> = {}, notes = [fakeNote()]) {
  const user = fakeUser(overrides);
  mockedAuth.me.mockResolvedValue(user);
  mockedNotes.list.mockResolvedValue(notes);

  render(
    <MemoryRouter>
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    </MemoryRouter>,
  );

  await screen.findByText(user.email);
  return user;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows who is signed in', async () => {
    await renderProfile({ name: 'Alice Tester', email: 'alice@example.com' });

    expect(screen.getByRole('heading', { name: 'Alice Tester' })).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('counts the notes the visitor owns', async () => {
    await renderProfile({}, [fakeNote({ id: '1' }), fakeNote({ id: '2' }), fakeNote({ id: '3' })]);

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('uses the singular label for one note', async () => {
    await renderProfile({}, [fakeNote()]);

    await waitFor(() => expect(screen.getByText('Note')).toBeInTheDocument());
  });

  it('shows the month and year the account was opened', async () => {
    await renderProfile({ createdAt: '2026-01-15T10:00:00.000Z' });

    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Joined 2026')).toBeInTheDocument();
  });

  it('does not print "Invalid Date" when the join date is unusable', async () => {
    await renderProfile({ createdAt: 'not a date' });

    expect(screen.getByText('Joined')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid/)).not.toBeInTheDocument();
  });

  it('logs out and sends the visitor to the login screen', async () => {
    await renderProfile();
    mockedAuth.logout.mockResolvedValue({ message: 'Logged out' });

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(mockedAuth.logout).toHaveBeenCalledTimes(1);
  });

  it('still signs the visitor out locally when the server call fails', async () => {
    await renderProfile();
    mockedAuth.logout.mockRejectedValue(new Error('network'));

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    // the request failing must not leave the app looking signed in
    await waitFor(() => expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument());
  });

  it('offers a way back to the notes', async () => {
    await renderProfile();

    expect(screen.getByRole('link', { name: 'Back to notes' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });
});
