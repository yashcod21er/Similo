import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/form';
import { PageHeader } from '@/features/app-shell/AppLayout';
import { NoAccess } from '@/features/app-shell/NoAccess';
import { useCan, useSession } from '@/features/auth/api';
import { formatDateTime } from '@/lib/format';
import { useAuditEvents } from './api';
import { describeAuditEvent } from './audit-text';

export function AuditLogPage() {
  const { data: me } = useSession();
  const can = useCan();
  const audit = useAuditEvents();
  if (!me) return null;

  const header = (
    <PageHeader
      title="Audit log"
      description={`A permanent record of sign-ins and changes in ${me.organization.name}. Entries can't be edited or deleted.`}
    />
  );
  if (!can('audit:read')) {
    return (
      <>
        {header}
        <NoAccess what="the audit log" />
      </>
    );
  }

  const events = audit.data?.pages.flatMap((page) => page.events) ?? [];

  return (
    <>
      {header}
      <div className="mt-8 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {audit.isPending && <p className="p-6 text-muted">Loading the audit log…</p>}
        {audit.isError && <FormAlert className="m-4">{audit.error.message}</FormAlert>}
        {audit.data && events.length === 0 && (
          <p className="p-6 text-muted">Nothing recorded yet.</p>
        )}
        {events.length > 0 && (
          <div className="overflow-x-auto" role="region" aria-label="Audit log table" tabIndex={0}>
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">Audit log, newest first</caption>
              <thead className="border-b border-line bg-cream text-[12.5px] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium sm:px-6">
                    When
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Who
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    What happened
                  </th>
                  <th scope="col" className="hidden px-5 py-3 font-medium md:table-cell">
                    From
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted sm:px-6">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{event.actor?.name ?? 'System'}</p>
                      {event.actor && (
                        <p className="text-[12.5px] text-muted">{event.actor.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{describeAuditEvent(event)}</td>
                    <td className="hidden px-5 py-3.5 font-mono text-[12.5px] text-muted md:table-cell">
                      {event.ip || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {audit.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            disabled={audit.isFetchingNextPage}
            onClick={() => void audit.fetchNextPage()}
          >
            {audit.isFetchingNextPage ? 'Loading…' : 'Load older entries'}
          </Button>
        </div>
      )}
    </>
  );
}
