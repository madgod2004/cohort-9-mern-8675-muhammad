import { type FormEvent, type KeyboardEvent, useCallback, useRef, useState } from 'react';

import type { Note } from '../api/notes';
import { downloadNote, type ExportFormat } from './export';
import { NoteMenu } from './NoteMenu';
import styles from './NoteCard.module.css';
import { relativeTime } from './relativeTime';

const PREVIEW_LENGTH = 180;
const TINT_COUNT = 4;

function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return `var(--tint-${(hash % TINT_COUNT) + 1})`;
}

function previewOf(note: Note): string {
  const text = note.contentText.trim();
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…` : text;
}

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  onRename: (id: string, title: string) => Promise<unknown>;
  onDuplicate: (note: Note) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function NoteCard({ note, onOpen, onRename, onDuplicate, onDelete }: NoteCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [error, setError] = useState<string | null>(null);

  const settled = useRef(false);

  const selectOnMount = useCallback((input: HTMLInputElement | null) => {
    input?.focus();
    input?.select();
  }, []);

  function startRename() {
    settled.current = false;
    setDraftTitle(note.title);
    setIsRenaming(true);
  }

  function cancelRename() {
    settled.current = true;
    setIsRenaming(false);
  }

  async function commitRename() {
    if (settled.current) {
      return;
    }
    settled.current = true;
    setIsRenaming(false);

    const title = draftTitle.trim();
    // an emptied box means "changed my mind", not "save a blank title"
    if (!title || title === note.title) {
      return;
    }

    try {
      setError(null);
      await onRename(note.id, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename the note.');
    }
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      cancelRename();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      void commitRename();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void commitRename();
  }

  async function run(action: () => Promise<unknown>, fallbackMessage: string) {
    try {
      setError(null);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackMessage);
    }
  }

  function handleExport(format: ExportFormat) {
    downloadNote(note, format);
  }

  const preview = previewOf(note);

  return (
    <article
      className={`card ${styles.card}`}
      style={{ background: tintFor(note.id) }}
      onClick={() => {
        if (!isRenaming) onOpen(note);
      }}
    >
      <div className={styles.header}>
        {isRenaming ? (
          <form className={styles.renameForm} onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor={`rename-${note.id}`}>
              Note title
            </label>
            <input
              id={`rename-${note.id}`}
              ref={selectOnMount}
              className={styles.renameInput}
              value={draftTitle}
              maxLength={200}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={() => void commitRename()}
            />
          </form>
        ) : (
          // a button as well as the card click, so the note opens from the
          // keyboard too; the click stops here or the card would open it twice
          <button
            type="button"
            className={styles.title}
            onClick={(event) => {
              event.stopPropagation();
              onOpen(note);
            }}
          >
            {note.title}
          </button>
        )}

        <div
          className={styles.menuSlot}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <NoteMenu
            noteTitle={note.title}
            onRename={startRename}
            onDuplicate={() => void run(() => onDuplicate(note), 'Could not duplicate the note.')}
            onExport={handleExport}
            onDelete={() => void run(() => onDelete(note.id), 'Could not delete the note.')}
          />
        </div>
      </div>

      {preview ? (
        <p className={styles.preview}>{preview}</p>
      ) : (
        <p className={`${styles.preview} ${styles.previewEmpty}`}>Empty note</p>
      )}

      {error ? (
        <p className={`error-text ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}

      <p className={styles.timestamp}>
        <time dateTime={note.updatedAt}>{relativeTime(note.updatedAt)}</time>
      </p>
    </article>
  );
}
