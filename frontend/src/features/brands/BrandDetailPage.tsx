import { ArrowLeft, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/form';
import { useCan, useSession } from '@/features/auth/api';
import { cn } from '@/lib/cn';
import { useBrand, useDeleteBrand, useUpdateBrand, type Brand, type BrandStatus } from './api';
import { DomainsTab } from './DomainsTab';
import { LogosTab } from './LogosTab';
import { MonitoringTab } from './MonitoringTab';
import { OverviewTab } from './OverviewTab';
import { isBrandNotFound } from './rules';
import { TrademarksTab } from './TrademarksTab';
import { BrandAvatar } from './ui/BrandAvatar';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { StatusBadge } from './ui/StatusBadge';
import { TabPanel, Tabs, type TabItem } from './ui/Tabs';

const TAB_IDS = ['overview', 'domains', 'logos', 'trademarks', 'monitoring'] as const;
type TabId = (typeof TAB_IDS)[number];

const isTabId = (value: string | null): value is TabId => TAB_IDS.some((tabId) => tabId === value);

function BrandNotFound() {
  return (
    <div className="mx-auto mt-8 flex max-w-xl flex-col items-center rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-line">
      <h1 className="text-title font-semibold">Brand not found</h1>
      <p className="mt-3 text-muted">
        We couldn&apos;t find that brand. It may have been deleted, or the link may be wrong.
      </p>
      <ButtonLink to="/app/brands" variant="dark" className="mt-6">
        <ArrowLeft aria-hidden className="size-4" />
        Back to all brands
      </ButtonLink>
    </div>
  );
}

/** Active / Paused as two choices, so the current state is always visible. */
function StatusControl({ brand }: { brand: Brand }) {
  const update = useUpdateBrand(brand.id);
  const choices: { value: BrandStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
  ];
  return (
    <div>
      <fieldset
        disabled={update.isPending}
        className="inline-flex rounded-full bg-white p-1 ring-1 ring-line-strong"
      >
        <legend className="sr-only">Brand status</legend>
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={cn(
              'cursor-pointer rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-crimson',
              brand.status === choice.value ? 'bg-midnight text-white' : 'text-ink hover:bg-paper',
            )}
          >
            <input
              type="radio"
              name="brand-status"
              value={choice.value}
              checked={brand.status === choice.value}
              onChange={() => update.mutate({ status: choice.value })}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </fieldset>
      {update.isError && <FormAlert className="mt-3">{update.error.message}</FormAlert>}
    </div>
  );
}

function DeleteBrand({ brand }: { brand: Brand }) {
  const navigate = useNavigate();
  const remove = useDeleteBrand(brand.id);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden className="size-4" />
        Delete brand
      </Button>
      <ConfirmDialog
        open={open}
        title={`Delete ${brand.name}?`}
        description="This permanently deletes the brand with its domains, logos, trademarks and monitoring settings. It cannot be undone. The audit log keeps a record that you did it."
        confirmLabel="Delete brand"
        pendingLabel="Deleting…"
        pending={remove.isPending}
        error={remove.isError ? remove.error.message : null}
        onClose={() => {
          setOpen(false);
          remove.reset();
        }}
        onConfirm={() =>
          remove.mutate(undefined, { onSuccess: () => void navigate('/app/brands') })
        }
      />
    </>
  );
}

function BrandView({ brand }: { brand: Brand }) {
  const can = useCan();
  const canManage = can('brands:manage');
  const baseId = useId();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: TabId = isTabId(requested) ? requested : 'overview';

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'domains', label: 'Domains', badge: String(brand.domains.length) },
    { id: 'logos', label: 'Logos', badge: String(brand.logos.length) },
    { id: 'trademarks', label: 'Trademarks', badge: String(brand.trademarks.length) },
    { id: 'monitoring', label: 'Monitoring' },
  ];
  // The chosen tab lives in the address (?tab=domains), so it survives a refresh and can be shared.
  const openTab = (id: string) =>
    setParams(id === 'overview' ? {} : { tab: id }, { replace: true });

  return (
    <>
      <Link
        to="/app/brands"
        className="inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All brands
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-1 basis-72 items-center gap-4">
          <BrandAvatar
            name={brand.name}
            logoUrl={brand.logos[0]?.url ?? null}
            className="size-16"
          />
          <div className="min-w-0">
            <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] break-words sm:text-[2rem]">
              {brand.name}
            </h1>
            {!canManage && (
              <div className="mt-2">
                <StatusBadge status={brand.status} />
              </div>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <StatusControl brand={brand} />
            <DeleteBrand brand={brand} />
          </div>
        )}
      </div>
      {canManage && (
        <p className="mt-3 text-[13.5px] text-muted">
          Paused brands are skipped when monitoring starts.
        </p>
      )}

      <div className="mt-8">
        <Tabs baseId={baseId} label="Brand sections" tabs={tabs} value={tab} onChange={openTab} />
        <div className="mt-6">
          <TabPanel baseId={baseId} id={tab}>
            {tab === 'overview' && (
              <OverviewTab brand={brand} canManage={canManage} onOpenTab={openTab} />
            )}
            {tab === 'domains' && <DomainsTab brand={brand} canManage={canManage} />}
            {tab === 'logos' && <LogosTab brand={brand} canManage={canManage} />}
            {tab === 'trademarks' && <TrademarksTab brand={brand} canManage={canManage} />}
            {tab === 'monitoring' && <MonitoringTab brand={brand} canManage={canManage} />}
          </TabPanel>
        </div>
      </div>
    </>
  );
}

/** One brand: its details, domains, logos, trademarks and monitoring settings. */
export function BrandDetailPage() {
  const { brandId = '' } = useParams();
  const { data: me } = useSession();
  const brand = useBrand(brandId);
  if (!me) return null;

  if (brand.isPending) return <p className="text-muted">Loading brand…</p>;
  if (brand.isError) {
    if (isBrandNotFound(brand.error)) return <BrandNotFound />;
    return (
      <div className="space-y-3">
        <FormAlert>{brand.error.message}</FormAlert>
        <Button variant="outline" size="sm" onClick={() => void brand.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return <BrandView brand={brand.data} />;
}
