import { useAuth } from '../auth/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>Notes</h1>
      <p>Signed in as {user?.email}</p>
      <button className="btn" onClick={() => void logout()}>
        Log out
      </button>
    </main>
  );
}
