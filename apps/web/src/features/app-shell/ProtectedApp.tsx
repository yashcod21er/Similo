import { RequireAuth } from '@/features/auth/RequireAuth';
import { AppLayout } from './AppLayout';

/** The /app route: signed-in check first, then the workspace layout. */
export function ProtectedApp() {
  return (
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  );
}
