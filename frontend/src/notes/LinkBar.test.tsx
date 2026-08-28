import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LinkBar } from './LinkBar';

function renderBar() {
  const props = { onApply: jest.fn(), onCancel: jest.fn() };
  render(<LinkBar {...props} />);
  return props;
}

const input = () => screen.getByLabelText('Link address');

describe('LinkBar', () => {
  it('opens focused and ready to type an address', () => {
    renderBar();

    expect(input()).toHaveValue('https://');
    expect(input()).toHaveFocus();
  });

  it('applies what was typed', async () => {
    const props = renderBar();

    await userEvent.clear(input());
    await userEvent.type(input(), 'https://example.com/plans{Enter}');

    expect(props.onApply).toHaveBeenCalledWith('https://example.com/plans');
  });

  it('accepts a bare domain and fills in the scheme', async () => {
    const props = renderBar();

    await userEvent.clear(input());
    await userEvent.type(input(), 'example.com{Enter}');

    expect(props.onApply).toHaveBeenCalledWith('https://example.com/');
  });

  it('applies from the button as well as from Enter', async () => {
    const props = renderBar();

    await userEvent.clear(input());
    await userEvent.type(input(), 'https://example.com/');
    await userEvent.click(screen.getByRole('button', { name: 'Add link' }));

    expect(props.onApply).toHaveBeenCalledWith('https://example.com/');
  });

  describe('an address it will not take', () => {
    it('refuses a javascript: address and says why', async () => {
      const props = renderBar();

      await userEvent.clear(input());
      await userEvent.type(input(), 'javascript:alert(1){Enter}');

      expect(await screen.findByRole('alert')).toHaveTextContent('Enter a web or email address.');
      expect(props.onApply).not.toHaveBeenCalled();
    });

    it('marks the field itself as invalid', async () => {
      renderBar();

      await userEvent.clear(input());
      await userEvent.type(input(), 'javascript:alert(1){Enter}');
      await screen.findByRole('alert');

      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(input()).toHaveAccessibleDescription('Enter a web or email address.');
    });

    it('stays open so the address can be corrected', async () => {
      renderBar();

      await userEvent.clear(input());
      await userEvent.type(input(), 'javascript:alert(1){Enter}');
      await screen.findByRole('alert');

      expect(input()).toBeInTheDocument();
    });

    it('clears the complaint as soon as typing resumes', async () => {
      renderBar();

      await userEvent.clear(input());
      await userEvent.type(input(), 'javascript:alert(1){Enter}');
      await screen.findByRole('alert');

      await userEvent.type(input(), 'x');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(input()).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('backing out', () => {
    it('cancels on Escape', async () => {
      const props = renderBar();

      await userEvent.type(input(), '{Escape}');

      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onApply).not.toHaveBeenCalled();
    });

    it('cancels from the button', async () => {
      const props = renderBar();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(props.onCancel).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the field is emptied and submitted', async () => {
      const props = renderBar();

      await userEvent.clear(input());
      await userEvent.click(screen.getByRole('button', { name: 'Add link' }));

      expect(props.onApply).not.toHaveBeenCalled();
      expect(await screen.findByRole('alert')).toBeInTheDocument();
    });
  });
});
