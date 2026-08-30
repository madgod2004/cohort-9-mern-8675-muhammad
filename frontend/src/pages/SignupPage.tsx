import { type SyntheticEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Field } from '../components/Field';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from './AuthLayout';
import styles from './AuthLayout.module.css';

const MIN_PASSWORD_LENGTH = 8;

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setError(null);

    // mirrors the server's rule so the user finds out before a round trip
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setPasswordError(null);
    setIsSubmitting(true);

    try {
      await signup({ name, email, password });
      void navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      heading="Create account"
      subheading="Somewhere to keep every half-formed thought."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <Field label="Name" value={name} onChange={setName} autoComplete="name" required />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={passwordError ?? undefined}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          required
        />
        {/* the server does not say which field is at fault, so this belongs to
            the form rather than being pinned to an arbitrary input */}
        {error ? (
          <p className={`error-text ${styles.formError}`} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
