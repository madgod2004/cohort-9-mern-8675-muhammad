import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { type User, authApi } from '../api/auth';
import { AuthContext, type AuthState } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        // a 401 here just means "not signed in", which is not an error
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(async (input: { name: string; email: string; password: string }) => {
    setUser(await authApi.signup(input));
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    setUser(await authApi.login(input));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignored on purpose: a failed request must not leave the UI signed in
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isLoading, signup, login, logout }),
    [user, isLoading, signup, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
