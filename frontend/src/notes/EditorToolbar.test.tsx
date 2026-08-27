import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import { useEffect } from 'react';

import { editorExtensions } from './editorExtensions';
import { EditorToolbar } from './EditorToolbar';

function Harness({ content, onReady }: { content: string; onReady: (editor: Editor) => void }) {
  const editor = useEditor({ extensions: editorExtensions, content });

  useEffect(() => {
    if (editor) {
      onReady(editor);
    }
  }, [editor, onReady]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}

function renderToolbar(content = '<p>Paris and Prague</p>') {
  let editor!: Editor;
  render(
    <Harness
      content={content}
      onReady={(instance) => {
        editor = instance;
      }}
    />,
  );
  return () => editor;
}

const tool = (name: string) => screen.getByRole('button', { name });

describe('EditorToolbar', () => {
  describe('marks and blocks', () => {
    it('makes the selection bold', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      await userEvent.click(tool('Bold'));

      expect(editor().getHTML()).toContain('<strong>');
    });

    it('makes the selection italic', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      await userEvent.click(tool('Italic'));

      expect(editor().getHTML()).toContain('<em>');
    });

    it('turns a paragraph into a heading and back', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      await userEvent.click(tool('Heading'));
      expect(editor().getHTML()).toContain('<h2>');

      await userEvent.click(tool('Heading'));
      expect(editor().getHTML()).toContain('<p>');
    });

    it('makes a bullet list', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      await userEvent.click(tool('Bullet list'));

      expect(editor().getHTML()).toContain('<ul>');
    });

    it('makes a numbered list', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      await userEvent.click(tool('Numbered list'));

      expect(editor().getHTML()).toContain('<ol>');
    });
  });

  describe('showing what is active', () => {
    it('presses the button while the cursor sits in that formatting', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      expect(tool('Bold')).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(tool('Bold'));

      expect(tool('Bold')).toHaveAttribute('aria-pressed', 'true');
    });

    it('leaves the other buttons alone', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      await userEvent.click(tool('Bold'));

      expect(tool('Italic')).toHaveAttribute('aria-pressed', 'false');
      expect(tool('Heading')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('linking', () => {
    async function addLink(address = 'https://example.com/plans') {
      await userEvent.click(tool('Add link'));
      const field = screen.getByLabelText('Link address');
      await userEvent.clear(field);
      await userEvent.type(field, `${address}{Enter}`);
    }

    it('opens the link bar rather than a browser prompt', async () => {
      const prompt = jest.spyOn(window, 'prompt');
      renderToolbar();

      await userEvent.click(tool('Add link'));

      expect(screen.getByLabelText('Link address')).toBeInTheDocument();
      expect(prompt).not.toHaveBeenCalled();
      prompt.mockRestore();
    });

    it('links the word the cursor is in, with nothing selected', async () => {
      const editor = renderToolbar();
      // a collapsed cursor part way through "Prague"
      editor().commands.setTextSelection(12);

      await addLink();

      expect(editor().getHTML()).toContain('<a href="https://example.com/plans">Prague</a>');
    });

    it('links a selection that spans several words', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();

      await addLink();

      expect(editor().getHTML()).toContain('href="https://example.com/plans"');
    });

    it('stores no target attribute, which the server would keep without its rel', async () => {
      const editor = renderToolbar();
      editor().commands.setTextSelection(12);

      await addLink();

      expect(editor().getHTML()).not.toContain('target=');
    });

    it('offers to remove the link once the cursor is inside one', async () => {
      const editor = renderToolbar();
      editor().commands.setTextSelection(12);
      await addLink();

      expect(tool('Remove link')).toBeInTheDocument();
    });

    it('removes the link', async () => {
      const editor = renderToolbar();
      editor().commands.setTextSelection(12);
      await addLink();

      await userEvent.click(tool('Remove link'));

      expect(editor().getHTML()).not.toContain('<a ');
    });

    it('removes the whole of a multi-word link from a cursor inside it', async () => {
      const editor = renderToolbar();
      editor().commands.selectAll();
      await addLink();
      // collapse into the middle of the link rather than selecting it
      editor().commands.setTextSelection(6);

      await userEvent.click(tool('Remove link'));

      expect(editor().getHTML()).toBe('<p>Paris and Prague</p>');
    });

    it('links the same word again straight after removing it', async () => {
      const editor = renderToolbar();
      editor().commands.setTextSelection(12);
      await addLink();
      await userEvent.click(tool('Remove link'));

      await addLink();

      expect(editor().getHTML()).toContain('<a href="https://example.com/plans">Prague</a>');
    });

    it('leaves the document alone when the link bar is cancelled', async () => {
      const editor = renderToolbar();
      editor().commands.setTextSelection(12);
      const before = editor().getHTML();

      await userEvent.click(tool('Add link'));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(editor().getHTML()).toBe(before);
      expect(screen.queryByLabelText('Link address')).not.toBeInTheDocument();
    });

    it('inserts the address as its own text when there is no word to link', async () => {
      const editor = renderToolbar('<p></p>');

      await addLink();

      expect(editor().getHTML()).toContain('<a href="https://example.com/plans">');
      expect(editor().getHTML()).toContain('https://example.com/plans</a>');
    });
  });
});
