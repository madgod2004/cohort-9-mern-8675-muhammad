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
}: Readonly<FieldProps>) {
  const id = useId();
  const messageId = `${id}-message`;

  // one message slot, so the error and the hint never both claim messageId
  let message = null;
  if (error) {
    message = (
      <span id={messageId} className="error-text" role="alert">
        {error}
      </span>
    );
  } else if (hint) {
    message = (
      <span id={messageId} className="hint-text">
        {hint}
      </span>
    );
  }

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
      {message}
    </div>
  );
}
