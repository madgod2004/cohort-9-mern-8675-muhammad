import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmLeave } from './ConfirmLeave';

function renderDialog() {
  const props = { onDiscard: jest.fn(), onStay: jest.fn() };
  render(<ConfirmLeave {...props} />);
  return props;
}

describe('ConfirmLeave', () => {
  it('says what is about to be lost', () => {
    renderDialog();

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('Leave without saving?');
    expect(dialog).toHaveAccessibleDescription(
      'The edits you have made to this note will be lost.',
    );
  });

  it('opens with the safer of the two choices focused', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
  });

  it('stays when asked to keep editing', async () => {
    const props = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    expect(props.onStay).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
  });

  it('treats Escape as keeping the edits', async () => {
    const props = renderDialog();

    await userEvent.keyboard('{Escape}');

    expect(props.onStay).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
  });

  it('leaves only when discarding is chosen outright', async () => {
    const props = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(props.onDiscard).toHaveBeenCalledTimes(1);
  });

  it('stops listening for Escape once it is gone', async () => {
    const props = { onDiscard: jest.fn(), onStay: jest.fn() };
    const { unmount } = render(<ConfirmLeave {...props} />);

    unmount();
    await userEvent.keyboard('{Escape}');

    expect(props.onStay).not.toHaveBeenCalled();
  });
});
