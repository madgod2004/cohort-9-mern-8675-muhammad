import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from './useAuth';

export function GuestRoute({ children }: Readonly<{ children: ReactNode }>) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className="visually-hidden">Loading</p>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
