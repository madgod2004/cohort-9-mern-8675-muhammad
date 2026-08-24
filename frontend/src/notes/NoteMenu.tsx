import { useCallback, useEffect, useRef, useState } from 'react';

import type { ExportFormat } from './export';
import styles from './NoteMenu.module.css';

interface NoteMenuProps {
  noteTitle: string;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: (format: ExportFormat) => void;
  onDelete: () => void;
}

export function NoteMenu({ noteTitle, onRename, onDuplicate, onExport, onDelete }: NoteMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsConfirmingDelete(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  function choose(action: () => void) {
    return () => {
      close();
      action();
    };
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Actions for ${noteTitle}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="5" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <circle cx="12" cy="19" r="1.6" fill="currentColor" />
        </svg>
      </button>

      {}
      {isOpen ? (
        <div className={styles.menu}>
          {isConfirmingDelete ? (
            <div className={styles.confirm}>
              <p className={styles.confirmText}>Delete this note?</p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={`${styles.item} ${styles.itemDanger}`}
                  onClick={choose(onDelete)}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" className={styles.item} onClick={choose(onRename)}>
                Rename
              </button>
              <button type="button" className={styles.item} onClick={choose(onDuplicate)}>
                Duplicate
              </button>
              <button
                type="button"
                className={styles.item}
                onClick={choose(() => onExport('markdown'))}
              >
                Export as Markdown
              </button>
              <button
                type="button"
                className={styles.item}
                onClick={choose(() => onExport('text'))}
              >
                Export as text
              </button>
              <button
                type="button"
                className={`${styles.item} ${styles.itemDanger}`}
                onClick={() => setIsConfirmingDelete(true)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
