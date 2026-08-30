import { Link, useNavigate } from 'react-router-dom';

import type { Note } from '../api/notes';
import { useAuth } from '../auth/useAuth';
import { APP_NAME } from '../config';
import { NoteCard } from '../notes/NoteCard';
import { relativeTime } from '../notes/relativeTime';
import { useNotes } from '../notes/useNotes';
import styles from './DashboardPage.module.css';

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notes, isLoading, error, reload, renameNote, duplicateNote, deleteNote } = useNotes();

  const openNote = (note: Note) => void navigate(`/notes/${note.id}`);
  const openBlankEditor = () => void navigate('/notes/new');

  // notes arrive newest-first, so the first one carries the last edit
  const lastEdited = notes.length > 0 ? relativeTime(notes[0].updatedAt) : null;
  const countLabel = notes.length === 1 ? '1 note' : `${notes.length} notes`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.wordmark}>{APP_NAME}</h1>
          {!isLoading && !error ? (
            <p className={styles.summary}>
              {notes.length === 0 ? 'No notes yet' : countLabel}
              {/* the "last edited" half is dropped on phones, where the header is tight */}
              {lastEdited ? (
                <span className={styles.lastEdited}>, last edited {lastEdited}</span>
              ) : null}
            </p>
          ) : null}
        </div>

        <Link to="/profile" className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">
            {user?.name.trim().charAt(0).toUpperCase()}
          </span>
          <span className={styles.accountName}>{user?.name}</span>
        </Link>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          className={`btn btn--primary ${styles.newNote}`}
          onClick={openBlankEditor}
        >
          <PlusIcon />
          <span className={styles.newNoteLabel}>New note</span>
        </button>
      </div>

      {isLoading ? <output className={styles.status}>Loading your notes…</output> : null}

      {error ? (
        <div className={`panel ${styles.notice}`} role="alert">
          <p className={styles.noticeText}>{error}</p>
          <button type="button" className="btn" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !error && notes.length === 0 ? (
        <div className={`panel ${styles.notice}`}>
          <p className={styles.noticeHeading}>Nothing here yet</p>
          <p className={styles.noticeText}>Your first note is one click away.</p>
          <button type="button" className="btn btn--primary" onClick={openBlankEditor}>
            Write your first note
          </button>
        </div>
      ) : null}

      {notes.length > 0 ? (
        <div className={styles.grid}>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={openNote}
              onRename={renameNote}
              onDuplicate={duplicateNote}
              onDelete={deleteNote}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
