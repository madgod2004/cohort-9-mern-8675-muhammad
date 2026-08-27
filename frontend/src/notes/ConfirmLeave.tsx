import { useCallback, useEffect } from 'react';

import styles from './ConfirmLeave.module.css';

interface ConfirmLeaveProps {
  onDiscard: () => void;
  onStay: () => void;
}

export function ConfirmLeave({ onDiscard, onStay }: ConfirmLeaveProps) {
  const focusOnMount = useCallback((button: HTMLButtonElement | null) => {
    button?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onStay();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onStay]);

  return (
    <div className={styles.backdrop}>
      <div
        className={`panel ${styles.card}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-leave-title"
        aria-describedby="confirm-leave-body"
      >
        <h2 id="confirm-leave-title" className={styles.heading}>
          Leave without saving?
        </h2>
        <p id="confirm-leave-body" className={styles.body}>
          The edits you have made to this note will be lost.
        </p>
        <div className={styles.actions}>
          <button type="button" className="btn btn--primary" ref={focusOnMount} onClick={onStay}>
            Keep editing
          </button>
          <button type="button" className="btn btn--danger" onClick={onDiscard}>
            Discard changes
          </button>
        </div>
      </div>
    </div>
  );
}
