import { type SyntheticEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Field } from '../components/Field';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from './AuthLayout';
import styles from './AuthLayout.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // send them back to wherever ProtectedRoute intercepted them
      const from = (location.state as { from?: string } | null)?.from;
      void navigate(from ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Log in to pick up where you left off."
      footer={
        <>
          No account yet? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
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
          autoComplete="current-password"
          required
        />
        {/* "Invalid email or password" deliberately does not say which one, so
            it cannot be attached to a single field */}
        {error ? (
          <p className={`error-text ${styles.formError}`} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
