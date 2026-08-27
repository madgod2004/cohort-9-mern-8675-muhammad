import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NoteMenu } from './NoteMenu';

function renderMenu(overrides: Partial<Parameters<typeof NoteMenu>[0]> = {}) {
  const props = {
    noteTitle: 'Groceries',
    onRename: jest.fn(),
    onDuplicate: jest.fn(),
    onExport: jest.fn(),
    onDelete: jest.fn(),
    ...overrides,
  };
  render(
    <div>
      <button type="button">outside</button>
      <NoteMenu {...props} />
    </div>,
  );
  return props;
}

const trigger = () => screen.getByRole('button', { name: 'Actions for Groceries' });

describe('NoteMenu', () => {
  it('starts closed', () => {
    renderMenu();

    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument();
  });

  it('opens on click and offers every action', async () => {
    renderMenu();

    await userEvent.click(trigger());

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    for (const label of ['Rename', 'Duplicate', 'Export as Markdown', 'Export as text', 'Delete']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('names the note it belongs to, so several menus are tellable apart', () => {
    renderMenu({ noteTitle: 'Trip planning' });

    expect(screen.getByRole('button', { name: 'Actions for Trip planning' })).toBeInTheDocument();
  });

  it('calls back and closes when an action is picked', async () => {
    const props = renderMenu();

    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));

    expect(props.onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument();
  });

  it('passes the chosen format to the export handler', async () => {
    const props = renderMenu();

    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Export as text' }));

    expect(props.onExport).toHaveBeenCalledWith('text');
  });

  it('closes on Escape and puts focus back on the trigger', async () => {
    renderMenu();

    await userEvent.click(trigger());
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it('closes when something outside is clicked', async () => {
    renderMenu();

    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'outside' }));

    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument();
  });

  describe('deleting', () => {
    it('asks before deleting rather than acting on the first click', async () => {
      const props = renderMenu();

      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(screen.getByText('Delete this note?')).toBeInTheDocument();
      expect(props.onDelete).not.toHaveBeenCalled();
    });

    it('deletes once the second Delete is pressed', async () => {
      const props = renderMenu();

      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(props.onDelete).toHaveBeenCalledTimes(1);
    });

    it('goes back to the actions when the prompt is cancelled', async () => {
      const props = renderMenu();

      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByText('Delete this note?')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
      expect(props.onDelete).not.toHaveBeenCalled();
    });

    it('does not keep the prompt open behind a reopened menu', async () => {
      renderMenu();

      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.keyboard('{Escape}');
      await userEvent.click(trigger());

      expect(screen.queryByText('Delete this note?')).not.toBeInTheDocument();
    });
  });
});
