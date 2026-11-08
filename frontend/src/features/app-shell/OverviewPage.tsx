import { ArrowRight, Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useCan, useSession } from '@/features/auth/api';
import { useBrands } from '@/features/brands/api';
import { useOrganization } from '@/features/organization/api';
import { PERMISSION_LABELS } from '@/features/organization/roles';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { PageHeader } from './AppLayout';

function StatCard({ label, value, sub }: { label: string; value: string; sub: ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-2 truncate text-[1.375rem] font-semibold tracking-[-0.02em]">{value}</p>
      <div className="mt-1 text-[13.5px] text-muted">{sub}</div>
    </div>
  );
}

/** First screen after signing in: real organisation facts and honest next steps. */
export function OverviewPage() {
  const { data: me } = useSession();
  const organization = useOrganization();
  const brands = useBrands();
  const can = useCan();
  if (!me) return null;

  const firstName = me.user.name.split(/\s+/)[0] ?? me.user.name;
  const memberCount = organization.data?.memberCount;
  const brandCount = brands.data?.length;
  const steps: {
    title: string;
    detail: string;
    done?: boolean;
    soon?: string;
    action?: { to: string; label: string };
    /** Shown instead of `action` once the step is done. */
    doneAction?: { to: string; label: string };
  }[] = [
    { title: 'Create your workspace', detail: `${me.organization.name} is ready.`, done: true },
    {
      title: 'Invite your team',
      detail: can('members:manage')
        ? 'Give each person the role that fits their job.'
        : 'Ask an Owner or Admin to invite your colleagues.',
      done: (memberCount ?? 0) > 1,
      ...(can('members:manage') && { action: { to: '/app/members', label: 'Invite people' } }),
    },
    {
      title: 'Add the brands you want to protect',
      detail:
        brandCount === undefined || brandCount === 0
          ? can('brands:manage')
            ? 'Names, logos, website addresses and trademarks for Similo to keep on file.'
            : 'Ask an Owner or Admin to add your brands.'
          : `${brandCount === 1 ? '1 brand is' : `${brandCount} brands are`} on file.`,
      done: (brandCount ?? 0) > 0,
      ...(brandCount === 0 &&
        can('brands:manage') && {
          action: { to: '/app/brands?add=1', label: 'Add your first brand' },
        }),
      doneAction: { to: '/app/brands', label: 'Manage your brands' },
    },
    {
      title: 'Watch for lookalike websites',
      detail: 'Similo will check newly registered website names against your brands.',
      soon: 'Coming soon',
    },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={`You're signed in to ${me.organization.name} as ${me.roleLabel}.`}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Organisation"
          value={me.organization.name}
          sub={organization.data ? `Created ${formatDate(organization.data.createdAt)}` : '…'}
        />
        <StatCard
          label="Members"
          value={memberCount === undefined ? '…' : String(memberCount)}
          sub={
            <Link to="/app/members" className="font-medium text-ink hover:text-accent-ink">
              See everyone →
            </Link>
          }
        />
        <StatCard
          label="Brands"
          value={brandCount === undefined ? '…' : String(brandCount)}
          sub={
            <Link to="/app/brands" className="font-medium text-ink hover:text-accent-ink">
              See your brands →
            </Link>
          }
        />
        <StatCard label="Your role" value={me.roleLabel} sub="Decides what you can do here" />
      </div>

      <section
        aria-labelledby="getting-started"
        className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8"
      >
        <h2 id="getting-started" className="text-title font-semibold">
          Getting started
        </h2>
        <ol className="mt-6 space-y-5">
          {steps.map((step, index) => {
            const link = step.done ? step.doneAction : step.action;
            return (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                    step.done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cream text-muted ring-1 ring-line',
                  )}
                >
                  {step.done ? <Check className="size-4" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {step.title}
                    {step.done && <span className="sr-only">(done)</span>}
                    {step.soon && (
                      <span className="rounded-full bg-cream px-2 py-0.5 text-[12px] font-medium text-muted ring-1 ring-line">
                        {step.soon}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[14.5px] text-muted">{step.detail}</p>
                  {link && (
                    <Link
                      to={link.to}
                      className="mt-2 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-accent-ink hover:underline"
                    >
                      {link.label} <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section
        aria-labelledby="your-role"
        className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8"
      >
        <h2 id="your-role" className="text-title font-semibold">
          What your role can do
        </h2>
        <p className="mt-2 text-[14.5px] text-muted">
          As {me.roleLabel}, you can do the following. Similo checks this on every action, not just
          in this screen.
        </p>
        <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {me.permissions.map((permission) => {
            const { label, soon } = PERMISSION_LABELS[permission];
            return (
              <li key={permission} className="flex items-start gap-2.5 text-[14.5px]">
                {soon ? (
                  <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                ) : (
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                )}
                <span className={soon ? 'text-muted' : undefined}>
                  {label}
                  {soon && <span className="ml-1.5 text-[12.5px]">(coming soon)</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
