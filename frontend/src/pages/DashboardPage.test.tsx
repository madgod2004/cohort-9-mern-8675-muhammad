import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { fakeNote, fakeUser } from '../../test/factories';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { notesApi } from '../api/notes';
import { AuthProvider } from '../auth/AuthProvider';
import { DashboardPage } from './DashboardPage';

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

const groceries = fakeNote({ id: 'a', title: 'Groceries', updatedAt: '2026-08-20T09:00:00.000Z' });
const trip = fakeNote({ id: 'b', title: 'Trip planning', updatedAt: '2026-08-10T09:00:00.000Z' });

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function renderLoaded(notes = [groceries, trip]) {
  mockedNotes.list.mockResolvedValue(notes);
  renderDashboard();
  await waitForElementToBeRemoved(() => screen.queryByText('Loading your notes…'));
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.me.mockResolvedValue(fakeUser({ name: 'Alice' }));
  });

  describe('while and after loading', () => {
    it('says it is loading before the notes arrive', () => {
      mockedNotes.list.mockReturnValue(new Promise(() => {}));

      renderDashboard();

      expect(screen.getByRole('status')).toHaveTextContent('Loading your notes…');
    });

    it('shows no count until it knows the count', () => {
      mockedNotes.list.mockReturnValue(new Promise(() => {}));

      renderDashboard();

      expect(screen.queryByText(/notes?,|No notes yet/)).not.toBeInTheDocument();
    });

    it('lists a card per note', async () => {
      await renderLoaded();

      expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Trip planning' })).toBeInTheDocument();
    });

    it('counts the notes and says when the newest changed', async () => {
      await renderLoaded();

      expect(screen.getByText(/2 notes/)).toBeInTheDocument();
      expect(screen.getByText(/last edited/)).toBeInTheDocument();
    });

    it('uses the singular for one note', async () => {
      await renderLoaded([groceries]);

      expect(screen.getByText(/1 note/)).toBeInTheDocument();
    });
  });

  describe('when there is nothing to show', () => {
    it('invites the visitor to write their first note', async () => {
      await renderLoaded([]);

      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Write your first note' })).toBeInTheDocument();
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });
  });

  describe('when the list cannot be loaded', () => {
    it('shows the reason and offers a retry', async () => {
      mockedNotes.list.mockRejectedValue(
        new ApiError(0, 'Cannot reach the server. Is it running?'),
      );

      renderDashboard();

      expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('does not show the empty state as well as the error', async () => {
      mockedNotes.list.mockRejectedValue(new ApiError(500, 'Something went wrong.'));

      renderDashboard();
      await screen.findByRole('alert');

      expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument();
    });

    it('recovers when the retry succeeds', async () => {
      mockedNotes.list.mockRejectedValueOnce(new ApiError(500, 'Something went wrong.'));
      renderDashboard();
      await screen.findByRole('alert');

      mockedNotes.list.mockResolvedValue([groceries]);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByRole('button', { name: 'Groceries' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('the header', () => {
    it('links to the profile using the signed-in name', async () => {
      await renderLoaded();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/profile');
      expect(link).toHaveTextContent('Alice');
    });
  });

  describe('acting on a note', () => {
    it('removes the card once the note is deleted', async () => {
      await renderLoaded();
      mockedNotes.remove.mockResolvedValue(undefined);

      await userEvent.click(screen.getByRole('button', { name: 'Actions for Groceries' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(mockedNotes.remove).toHaveBeenCalledWith('a');
      expect(screen.queryByRole('button', { name: 'Groceries' })).not.toBeInTheDocument();
    });

    it('shows a renamed note under its new title', async () => {
      await renderLoaded();
      mockedNotes.update.mockResolvedValue({ ...groceries, title: 'Weekly shop' });

      await userEvent.click(screen.getByRole('button', { name: 'Actions for Groceries' }));
      await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
      const input = screen.getByLabelText('Note title');
      await userEvent.clear(input);
      await userEvent.type(input, 'Weekly shop{Enter}');

      expect(await screen.findByRole('button', { name: 'Weekly shop' })).toBeInTheDocument();
    });
  });
});
