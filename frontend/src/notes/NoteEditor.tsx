import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { EditorToolbar } from './EditorToolbar';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function NoteEditor({ content, onChange }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          protocols: ['http', 'https', 'mailto'],
          HTMLAttributes: { target: null, rel: null },
        },
      }),
    ],
    content,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: {
      attributes: {
        class: styles.surface,
        'aria-label': 'Note content',
      },

      handleClick(_view, _pos, event) {
        const href = (event.target as HTMLElement).closest('a')?.getAttribute('href');
        if (!href) {
          return false;
        }
        window.open(href, '_blank', 'noopener,noreferrer');
        return true;
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className={styles.content} />
    </div>
  );
}
