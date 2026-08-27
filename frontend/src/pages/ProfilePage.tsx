import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import { useNotes } from '../notes/useNotes';
import styles from './ProfilePage.module.css';

function LogOutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notes, isLoading } = useNotes();

  const joined = new Date(user?.createdAt ?? '');
  const joinedIsValid = !Number.isNaN(joined.getTime());

  async function handleLogout() {
    await logout();
    void navigate('/login', { replace: true });
  }

  return (
    <div className={styles.page}>
      <div className={`panel ${styles.card}`}>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">
            {user?.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className={styles.names}>
            <h1 className={styles.name}>{user?.name}</h1>
            <p className={styles.email}>{user?.email}</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={`${styles.stat} ${styles.statNotes}`}>
            <span className={styles.statValue}>{isLoading ? '—' : notes.length}</span>
            <span className={styles.statLabel}>{notes.length === 1 ? 'Note' : 'Notes'}</span>
          </div>
          <div className={`${styles.stat} ${styles.statJoined}`}>
            <span className={styles.statValue}>
              {joinedIsValid ? joined.toLocaleString('en', { month: 'short' }) : '—'}
            </span>
            <span className={styles.statLabel}>
              {joinedIsValid ? `Joined ${joined.getFullYear()}` : 'Joined'}
            </span>
          </div>
        </div>

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt className={styles.detailLabel}>Display name</dt>
            <dd className={styles.detailValue}>{user?.name}</dd>
          </div>
        </dl>

        <button
          type="button"
          className={`btn btn--danger ${styles.logout}`}
          onClick={() => void handleLogout()}
        >
          <LogOutIcon />
          Log out
        </button>

        <Link to="/dashboard" className={styles.back}>
          Back to notes
        </Link>
      </div>
    </div>
  );
}
