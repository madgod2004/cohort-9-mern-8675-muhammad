import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { fakeNote } from '../../test/factories';
import { ApiError } from '../api/client';
import { notesApi } from '../api/notes';
import { NoteEditorPage } from './NoteEditorPage';

jest.mock('../api/notes', () => ({
  notesApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../notes/NoteEditor', () => ({
  NoteEditor: ({ content, onChange }: { content: string; onChange: (html: string) => void }) => (
    <textarea
      aria-label="Note content"
      defaultValue={content}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const mocked = notesApi as jest.Mocked<typeof notesApi>;

const groceries = fakeNote({
  id: 'a',
  title: 'Groceries',
  content: '<p>Coffee and oats.</p>',
  createdAt: '2026-07-07T09:00:00.000Z',
});

function ShowPath() {
  const location = useLocation();
  return <span data-testid="path">{location.pathname}</span>;
}

function renderEditor(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ShowPath />
      <Routes>
        <Route path="/notes/:id" element={<NoteEditorPage />} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const path = () => screen.getByTestId('path').textContent;
const titleField = () => screen.getByLabelText('Note title');
const bodyField = () => screen.getByLabelText('Note content');
const saveButton = () => screen.getByRole('button', { name: /Save|Saving/ });

async function renderExisting(note = groceries) {
  mocked.get.mockResolvedValue(note);
  renderEditor(`/notes/${note.id}`);
  await waitForElementToBeRemoved(() => screen.queryByText('Loading the note…'));
}

describe('NoteEditorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('opening a note', () => {
    it('waits while it loads', () => {
      mocked.get.mockReturnValue(new Promise(() => {}));

      renderEditor('/notes/a');

      expect(screen.getByRole('status')).toHaveTextContent('Loading the note…');
    });

    it('fills the title and body from the note', async () => {
      await renderExisting();

      expect(titleField()).toHaveValue('Groceries');
      expect(bodyField()).toHaveValue('<p>Coffee and oats.</p>');
    });

    it('shows when the note was created and last saved', async () => {
      await renderExisting();

      expect(screen.getByText('Created 07 July 2026')).toBeInTheDocument();
      expect(screen.getByText(/^Saved /)).toBeInTheDocument();
    });

    it('says plainly when the note is not there', async () => {
      mocked.get.mockRejectedValue(new ApiError(404, 'Note not found'));

      renderEditor('/notes/gone');

      expect(await screen.findByText('Note not found')).toBeInTheDocument();
    });

    it('separates a missing note from a broken server', async () => {
      mocked.get.mockRejectedValue(new ApiError(500, 'Something went wrong.'));

      renderEditor('/notes/a');

      expect(await screen.findByText('Something broke')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    });
  });

  describe('writing a new note', () => {
    it('starts empty and asks for nothing from the server', () => {
      renderEditor('/notes/new');

      expect(titleField()).toHaveValue('');
      expect(screen.getAllByText('Not saved yet').length).toBeGreaterThan(0);
      expect(mocked.get).not.toHaveBeenCalled();
    });

    it('will not save without a title', async () => {
      renderEditor('/notes/new');

      expect(saveButton()).toBeDisabled();

      await userEvent.type(titleField(), '   ');

      expect(saveButton()).toBeDisabled();
    });

    it('saves once there is a title', async () => {
      renderEditor('/notes/new');
      mocked.create.mockResolvedValue(fakeNote({ id: 'fresh', title: 'Shopping' }));

      await userEvent.type(titleField(), 'Shopping');
      await userEvent.type(bodyField(), '<p>Oats.</p>');
      await userEvent.click(saveButton());

      expect(mocked.create).toHaveBeenCalledWith({ title: 'Shopping', content: '<p>Oats.</p>' });
    });

    it('trims the title before sending it', async () => {
      renderEditor('/notes/new');
      mocked.create.mockResolvedValue(fakeNote({ id: 'fresh' }));

      await userEvent.type(titleField(), '  Shopping  ');
      await userEvent.click(saveButton());

      expect(mocked.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Shopping' }));
    });

    it('moves to the saved note, so a reload lands on it', async () => {
      renderEditor('/notes/new');
      mocked.create.mockResolvedValue(fakeNote({ id: 'fresh', title: 'Shopping' }));
      mocked.get.mockResolvedValue(fakeNote({ id: 'fresh', title: 'Shopping' }));

      await userEvent.type(titleField(), 'Shopping');
      await userEvent.click(saveButton());

      await waitFor(() => expect(path()).toBe('/notes/fresh'));
    });
  });

  describe('editing an existing note', () => {
    it('patches rather than creating', async () => {
      await renderExisting();
      mocked.update.mockResolvedValue({ ...groceries, title: 'Weekly shop' });

      await userEvent.clear(titleField());
      await userEvent.type(titleField(), 'Weekly shop');
      await userEvent.click(saveButton());

      expect(mocked.update).toHaveBeenCalledWith('a', {
        title: 'Weekly shop',
        content: '<p>Coffee and oats.</p>',
      });
      expect(mocked.create).not.toHaveBeenCalled();
    });

    it('has nothing to save until something changes', async () => {
      await renderExisting();

      expect(saveButton()).toBeDisabled();
    });

    it('reports the reason when the save is refused, and keeps the edit', async () => {
      await renderExisting();
      mocked.update.mockRejectedValue(new ApiError(404, 'Note not found'));

      await userEvent.type(titleField(), ' extra');
      await userEvent.click(saveButton());

      expect(await screen.findByRole('alert')).toHaveTextContent('Note not found');
      expect(titleField()).toHaveValue('Groceries extra');
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });

  describe('tracking unsaved work', () => {
    it('says so as soon as the title changes', async () => {
      await renderExisting();

      await userEvent.type(titleField(), '!');

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('says so as soon as the body changes', async () => {
      await renderExisting();

      await userEvent.type(bodyField(), 'more');

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('goes quiet again once the save lands', async () => {
      await renderExisting();
      mocked.update.mockResolvedValue({ ...groceries, title: 'Groceries!' });

      await userEvent.type(titleField(), '!');
      await userEvent.click(saveButton());

      expect(await screen.findByText(/^Saved /)).toBeInTheDocument();
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  describe('leaving with unsaved work', () => {
    async function makeDirtyThenCancel() {
      await renderExisting();
      await userEvent.type(titleField(), '!');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    }

    it('asks before leaving', async () => {
      await makeDirtyThenCancel();

      expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Leave without saving?');
      expect(path()).toBe('/notes/a');
    });

    it('asks when the back link is used too', async () => {
      await renderExisting();
      await userEvent.type(titleField(), '!');

      await userEvent.click(screen.getByRole('link', { name: /Back to notes/ }));

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(path()).toBe('/notes/a');
    });

    it('stays put when told to keep editing', async () => {
      await makeDirtyThenCancel();

      await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(titleField()).toHaveValue('Groceries!');
    });

    it('leaves once discarding is chosen', async () => {
      await makeDirtyThenCancel();

      await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

      expect(path()).toBe('/dashboard');
    });

    it('does not ask when there is nothing to lose', async () => {
      await renderExisting();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(path()).toBe('/dashboard');
    });

    it('warns the browser about closing the tab while dirty', async () => {
      const addListener = jest.spyOn(window, 'addEventListener');
      await renderExisting();

      await userEvent.type(titleField(), '!');

      expect(addListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      addListener.mockRestore();
    });
  });
});
