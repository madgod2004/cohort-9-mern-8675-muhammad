import { type ReactNode, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { Note } from '../api/notes';
import { NoteEditor } from '../notes/NoteEditor';
import { useNote } from '../notes/useNote';
import { relativeTime } from '../notes/relativeTime';
import styles from './NoteEditorPage.module.css';

const NEW_NOTE = 'new';

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function savedLabel(note: Note | null, isDirty: boolean): string {
  if (isDirty) {
    return 'Unsaved changes';
  }
  return note ? `Saved ${relativeTime(note.updatedAt)}` : 'Not saved yet';
}

function createdLabel(iso: string | undefined): string {
  if (!iso) {
    return 'Not saved yet';
  }
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) {
    return '';
  }
  return `Created ${created.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}`;
}

function NoteSheet({ note }: { note: Note | null }) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const isCreating = note === null;
  const [baseline] = useState(note?.content ?? '');
  const isDirty = title !== (note?.title ?? '') || content !== baseline;

  return (
    <div className={`panel ${styles.sheet}`}>
      <div className={styles.head}>
        <label className="visually-hidden" htmlFor="note-title">
          Note title
        </label>
        <input
          id="note-title"
          className={styles.title}
          value={title}
          placeholder="Untitled note"
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
        />
        <p className={styles.created}>{createdLabel(note?.createdAt)}</p>
      </div>

      <NoteEditor content={note?.content ?? ''} onChange={setContent} />

      <div className={styles.footer}>
        <p className={styles.savedAt}>{savedLabel(note, isDirty)}</p>
        <div className={styles.actions}>
          <Link to="/dashboard" className="btn">
            Cancel
          </Link>
          <button type="button" className="btn btn--primary" disabled={isCreating && !title.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  // the create route reuses this page, and carries no id to fetch
  const noteId = id === NEW_NOTE ? undefined : id;

  const { note, isLoading, error, isMissing } = useNote(noteId);

  const shell = (children: ReactNode) => (
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.back}>
        <span className={styles.backIcon} aria-hidden="true">
          <BackIcon />
        </span>
        Back to notes
      </Link>
      {children}
    </div>
  );

  if (isLoading) {
    return shell(
      <p className={styles.status} role="status">
        Loading the note…
      </p>,
    );
  }

  if (error) {
    return shell(
      <div className={`panel ${styles.notice}`} role="alert">
        <p className={styles.noticeHeading}>{isMissing ? 'Note not found' : 'Something broke'}</p>
        <p className={styles.noticeText}>
          {isMissing ? 'It may have been deleted from another tab.' : error}
        </p>
        <Link to="/dashboard" className="btn">
          Back to notes
        </Link>
      </div>,
    );
  }

  return shell(<NoteSheet note={note} />);
}
