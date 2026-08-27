import { type Ref, useRef, useState } from 'react';
import { type Editor, useEditorState } from '@tiptap/react';

import { LinkBar } from './LinkBar';
import styles from './NoteEditor.module.css';

const icons = {
  bold: <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />,
  italic: <path d="M19 4h-9M14 20H5M15 4L9 20" />,
  heading: <path d="M4 18V6M12 18V6M4 12h8M17 18v-8M17 10h4" />,
  bulletList: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  orderedList: (
    <>
      <path d="M10 6h11M10 12h11M10 18h11" />
      {}
      <g fill="currentColor" stroke="none" fontSize="8.5" fontWeight="700">
        <text x="1" y="9">
          1
        </text>
        <text x="1" y="15">
          2
        </text>
        <text x="1" y="21">
          3
        </text>
      </g>
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </>
  ),
};

type IconName = keyof typeof icons;

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
}

interface ToolbarButtonProps {
  label: string;
  icon: IconName;
  isActive: boolean;
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  isExpanded?: boolean;
}

function ToolbarButton({
  label,
  icon,
  isActive,
  onClick,
  buttonRef,
  isExpanded,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      ref={buttonRef}
      className={`${styles.tool} ${isActive ? styles.toolActive : ''}`}
      aria-label={label}
      aria-pressed={isActive}
      aria-expanded={isExpanded}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [hasWord, setHasWord] = useState(false);
  const linkButtonRef = useRef<HTMLButtonElement>(null);

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      heading: current.isActive('heading', { level: 2 }),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      link: current.isActive('link'),
    }),
  });


  function selectWordAtCursor(): boolean {
    const { $from, empty } = editor.state.selection;
    if (!empty) {
      return true;
    }

    const text = $from.parent.textContent;
    const offset = $from.parentOffset;
    let start = offset;
    let end = offset;

    while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
    while (end < text.length && !/\s/.test(text[end])) end += 1;

    if (start === end) {
      return false;
    }

    const blockStart = $from.start();
    editor.commands.setTextSelection({ from: blockStart + start, to: blockStart + end });
    return true;
  }

  function toggleLink() {
    if (active.link) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    setHasWord(selectWordAtCursor());
    setIsAddingLink(true);
  }

  function closeLinkBar() {
    setIsAddingLink(false);
    linkButtonRef.current?.focus();
  }

  function applyLink(href: string) {
    setIsAddingLink(false);

    if (hasWord) {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    } else {
      // nothing to attach the link to, so the address becomes the text
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: href,
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run();
    }

    linkButtonRef.current?.focus();
  }

  return (
    <>
      <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
        <ToolbarButton
          label="Bold"
          icon="bold"
          isActive={active.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          icon="italic"
          isActive={active.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Heading"
          icon="heading"
          isActive={active.heading}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="Bullet list"
          icon="bulletList"
          isActive={active.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Numbered list"
          icon="orderedList"
          isActive={active.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label={active.link ? 'Remove link' : 'Add link'}
          icon="link"
          isActive={active.link}
          onClick={toggleLink}
          buttonRef={linkButtonRef}
          isExpanded={active.link ? undefined : isAddingLink}
        />
      </div>

      {isAddingLink ? <LinkBar onApply={applyLink} onCancel={closeLinkBar} /> : null}
    </>
  );
}
