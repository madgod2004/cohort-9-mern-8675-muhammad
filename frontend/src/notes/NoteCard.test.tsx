import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { fakeNote } from '../../test/factories';
import { ApiError } from '../api/client';
import { downloadNote } from './export';
import { NoteCard } from './NoteCard';

jest.mock('./export', () => ({
  ...jest.requireActual<object>('./export'),
  downloadNote: jest.fn(),
}));

const mockedDownload = downloadNote as jest.MockedFunction<typeof downloadNote>;

function renderCard(note = fakeNote(), overrides: Record<string, jest.Mock> = {}) {
  const props = {
    onOpen: jest.fn(),
    onRename: jest.fn().mockResolvedValue(note),
    onDuplicate: jest.fn().mockResolvedValue(note),
    onDelete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(<NoteCard note={note} {...props} />);
  return props;
}

async function openMenu(title = 'Groceries') {
  await userEvent.click(screen.getByRole('button', { name: `Actions for ${title}` }));
}

describe('NoteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('what it shows', () => {
    it('shows the title, a preview and when it changed', () => {
      renderCard(
        fakeNote({ contentText: 'Coffee and oats.', updatedAt: new Date().toISOString() }),
      );

      expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();
      expect(screen.getByText('Coffee and oats.')).toBeInTheDocument();
      expect(screen.getByText(/ago|now/)).toBeInTheDocument();
    });

    it('says so when there is nothing in the note', () => {
      renderCard(fakeNote({ contentText: '' }));

      expect(screen.getByText('Empty note')).toBeInTheDocument();
    });

    it('trims a long preview instead of rendering the whole note', () => {
      renderCard(fakeNote({ contentText: 'x'.repeat(500) }));

      expect(screen.getByText(/^x+…$/).textContent).toHaveLength(181);
    });

    it('opens the note when the title is pressed', async () => {
      const note = fakeNote();
      const props = renderCard(note);

      await userEvent.click(screen.getByRole('button', { name: 'Groceries' }));

      expect(props.onOpen).toHaveBeenCalledWith(note);
    });

    it('does not open the note when the menu is used', async () => {
      const props = renderCard();

      await openMenu();

      expect(props.onOpen).not.toHaveBeenCalled();
    });
  });

  describe('renaming', () => {
    async function startRename() {
      await openMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
      return screen.getByLabelText('Note title');
    }

    it('swaps the title for an input holding the current title', async () => {
      renderCard();

      expect(await startRename()).toHaveValue('Groceries');
    });

    it('saves on Enter', async () => {
      const props = renderCard();

      const input = await startRename();
      await userEvent.clear(input);
      await userEvent.type(input, 'Weekly shop{Enter}');

      expect(props.onRename).toHaveBeenCalledWith('note-1', 'Weekly shop');
      expect(screen.queryByLabelText('Note title')).not.toBeInTheDocument();
    });

    it('throws the edit away on Escape', async () => {
      const props = renderCard();

      const input = await startRename();
      await userEvent.clear(input);
      await userEvent.type(input, 'Discard me{Escape}');

      expect(props.onRename).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();
    });

    it('treats an emptied box as a change of mind, not a blank title', async () => {
      const props = renderCard();

      const input = await startRename();
      await userEvent.clear(input);
      await userEvent.type(input, '   {Enter}');

      expect(props.onRename).not.toHaveBeenCalled();
    });

    it('does not call the server when the title is unchanged', async () => {
      const props = renderCard();

      const input = await startRename();
      await userEvent.type(input, '{Enter}');

      expect(props.onRename).not.toHaveBeenCalled();
    });

    it('saves when focus leaves the input', async () => {
      const props = renderCard();

      const input = await startRename();
      await userEvent.clear(input);
      await userEvent.type(input, 'Weekly shop');
      await userEvent.tab();

      expect(props.onRename).toHaveBeenCalledWith('note-1', 'Weekly shop');
    });

    it('saves once when Enter and a blur both land on the same edit', async () => {
      const props = renderCard();

      const input = await startRename();
      await userEvent.clear(input);
      await userEvent.type(input, 'Weekly shop');

      // both events reach the still-mounted input before React re-renders,
      // which is the case the settled guard exists for
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.blur(input);
        await Promise.resolve();
      });

      expect(props.onRename).toHaveBeenCalledTimes(1);
    });

    it('does not save the discarded text if a blur follows Escape', async () => {
      const props = renderCard();

      const input = await startRename();
      await userEvent.clear(input);
      await userEvent.type(input, 'Discard me');

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Escape' });
        fireEvent.blur(input);
        await Promise.resolve();
      });

      expect(props.onRename).not.toHaveBeenCalled();
    });

    it('shows the reason on the card when the rename fails', async () => {
      const props = renderCard(fakeNote(), {
        onRename: jest.fn().mockRejectedValue(new ApiError(404, 'Note not found')),
      });

      const input = await startRename();
      await userEvent.clear(input);
      await userEvent.type(input, 'Weekly shop{Enter}');

      expect(await screen.findByRole('alert')).toHaveTextContent('Note not found');
      expect(props.onRename).toHaveBeenCalled();
    });
  });

  describe('the other actions', () => {
    it('duplicates the note', async () => {
      const note = fakeNote();
      const props = renderCard(note);

      await openMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

      expect(props.onDuplicate).toHaveBeenCalledWith(note);
    });

    it('deletes after the prompt is confirmed', async () => {
      const props = renderCard();

      await openMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(props.onDelete).toHaveBeenCalledWith('note-1');
    });

    it('reports a failed delete on the card', async () => {
      renderCard(fakeNote(), {
        onDelete: jest.fn().mockRejectedValue(new ApiError(500, 'Something went wrong.')),
      });

      await openMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
    });

    it('exports in the format that was chosen', async () => {
      const note = fakeNote();
      renderCard(note);

      await openMenu();
      await userEvent.click(screen.getByRole('button', { name: 'Export as Markdown' }));

      expect(mockedDownload).toHaveBeenCalledWith(note, 'markdown');
    });
  });
});
