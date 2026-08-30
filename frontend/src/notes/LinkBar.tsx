import { type SyntheticEvent, type KeyboardEvent, useCallback, useState } from 'react';

import { normaliseHref } from './linkHref';
import styles from './NoteEditor.module.css';

const DEFAULT_DRAFT = 'https://';

interface LinkBarProps {
  onApply: (href: string) => void;
  onCancel: () => void;
}

export function LinkBar({ onApply, onCancel }: Readonly<LinkBarProps>) {
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const focusOnMount = useCallback((input: HTMLInputElement | null) => {
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }, []);

  function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();

    const href = normaliseHref(draft);
    if (!href) {
      setError('Enter a web or email address.');
      return;
    }

    onApply(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form className={styles.linkBar} onSubmit={handleSubmit} aria-label="Add link">
      <label className="visually-hidden" htmlFor="link-href">
        Link address
      </label>
      <input
        id="link-href"
        ref={focusOnMount}
        className={`field ${styles.linkInput}`}
        value={draft}
        type="text"
        inputMode="url"
        placeholder="https://example.com"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'link-href-error' : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
      />
      <div className={styles.linkActions}>
        <button type="submit" className="btn btn--primary">
          Add link
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {error ? (
        <p id="link-href-error" className={`error-text ${styles.linkError}`} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
