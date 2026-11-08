import { Loader2, ServerCrash } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useSession } from './api';

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
      {children}
    </div>
  );
}

/**
 * Wraps the signed-in area. Visitors without a session are sent to sign in and
 * brought back afterwards. This only decides what to *show*: every API call
 * behind it checks the session and permissions on the server as well.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = useSession();

  if (session.isPending) {
    return (
      <FullScreen>
        <Loader2 aria-hidden className="size-6 animate-spin text-muted" />
        <p role="status" className="text-muted">
          Opening your workspace…
        </p>
      </FullScreen>
    );
  }

  if (session.isError) {
    return (
      <FullScreen>
        <ServerCrash aria-hidden className="size-8 text-crimson-dark" />
        <h1 className="text-title font-semibold">Similo can&apos;t be reached right now</h1>
        <p className="max-w-md text-muted">{session.error.message}</p>
        <Button variant="dark" onClick={() => void session.refetch()}>
          Try again
        </Button>
      </FullScreen>
    );
  }

  if (!session.data) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }

  return children;
}
