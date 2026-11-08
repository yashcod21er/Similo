import { Lock } from 'lucide-react';
import { useSession } from '@/features/auth/api';

/** Shown when a role can't see a page. The API would refuse the data anyway. */
export function NoAccess({ what }: { what: string }) {
  const { data: me } = useSession();
  return (
    <div className="mt-8 flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-line">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-cream ring-1 ring-line">
        <Lock aria-hidden className="size-5 text-muted" />
      </span>
      <h2 className="text-title mt-5 font-semibold">You don&apos;t have access to {what}</h2>
      <p className="mt-2 max-w-md text-muted">
        Your role{me ? ` (${me.roleLabel})` : ''} doesn&apos;t include this. Ask an Owner or Admin
        if you need it.
      </p>
    </div>
  );
}
