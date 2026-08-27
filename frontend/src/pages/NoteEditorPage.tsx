import { type ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { type Note, notesApi } from '../api/notes';
import { ConfirmLeave } from '../notes/ConfirmLeave';
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

function BackLink({ onIntercept }: { onIntercept?: () => boolean }) {
  return (
    <Link
      to="/dashboard"
      className={styles.back}
      onClick={(event) => {
        // the handler returns true when it has taken over the navigation
        if (onIntercept?.()) {
          event.preventDefault();
        }
      }}
    >
      <span className={styles.backIcon} aria-hidden="true">
        <BackIcon />
      </span>
      Back to notes
    </Link>
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
  const navigate = useNavigate();

  // the last version the server acknowledged, which the footer reports on
  const [saved, setSaved] = useState(note);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  // TipTap normalises whatever it is given, so the comparison is against the
  // content as last saved rather than against the note as it arrived
  const [baseline, setBaseline] = useState(note?.content ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);

  const isCreating = saved === null;
  const trimmedTitle = title.trim();
  const isDirty = title !== (saved?.title ?? '') || content !== baseline;
  const canSave = trimmedTitle.length > 0 && !isSaving && (isDirty || isCreating);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = saved
        ? await notesApi.update(saved.id, { title: trimmedTitle, content })
        : await notesApi.create({ title: trimmedTitle, content });

      setSaved(result);
      setTitle(result.title);
      setBaseline(content);

      if (!saved) {
        void navigate(`/notes/${result.id}`, { replace: true });
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the note.');
    } finally {
      setIsSaving(false);
    }
  }

  function interceptLeave(): boolean {
    if (!isDirty) {
      return false;
    }
    setIsConfirmingLeave(true);
    return true;
  }

  return (
    <>
      <BackLink onIntercept={interceptLeave} />

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
          <p className={styles.created}>{createdLabel(saved?.createdAt)}</p>
        </div>

        <NoteEditor content={note?.content ?? ''} onChange={setContent} />

        {saveError ? (
          <p className={`error-text ${styles.saveError}`} role="alert">
            {saveError}
          </p>
        ) : null}

        <div className={styles.footer}>
          <p className={styles.savedAt}>{savedLabel(saved, isDirty)}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (!interceptLeave()) void navigate('/dashboard');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canSave}
              onClick={() => void handleSave()}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {isConfirmingLeave ? (
        <ConfirmLeave
          onStay={() => setIsConfirmingLeave(false)}
          onDiscard={() => void navigate('/dashboard')}
        />
      ) : null}
    </>
  );
}

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  // the create route reuses this page, and carries no id to fetch
  const noteId = id === NEW_NOTE ? undefined : id;

  const { note, isLoading, error, isMissing } = useNote(noteId);

  const shell = (children: ReactNode) => <div className={styles.page}>{children}</div>;

  if (isLoading) {
    return shell(
      <>
        <BackLink />
        <p className={styles.status} role="status">
          Loading the note…
        </p>
      </>,
    );
  }

  if (error) {
    return shell(
      <>
        <BackLink />
        <div className={`panel ${styles.notice}`} role="alert">
          <p className={styles.noticeHeading}>{isMissing ? 'Note not found' : 'Something broke'}</p>
          <p className={styles.noticeText}>
            {isMissing ? 'It may have been deleted from another tab.' : error}
          </p>
          <Link to="/dashboard" className="btn">
            Back to notes
          </Link>
        </div>
      </>,
    );
  }

  return shell(<NoteSheet key={noteId ?? NEW_NOTE} note={note} />);
}
