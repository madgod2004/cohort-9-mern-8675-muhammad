import { useId } from 'react';

import styles from './Field.module.css';

interface FieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
}

export function Field({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  autoComplete,
  required,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={styles.field}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`field ${error ? 'field--invalid' : ''}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
      />
      {error ? (
        <span id={messageId} className="error-text" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={messageId} className="hint-text">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
