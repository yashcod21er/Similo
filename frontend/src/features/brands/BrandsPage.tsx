import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, ImageIcon, Plus, ShieldCheck, Stamp, Tag } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FormAlert, SubmitButton } from '@/components/ui/form';
import { PageHeader } from '@/features/app-shell/AppLayout';
import { useCan, useSession } from '@/features/auth/api';
import { formatDate } from '@/lib/format';
import { useBrands, useCreateBrand, type BrandSummary } from './api';
import { BrandFields } from './BrandFields';
import { applyServerErrors } from './form-errors';
import { plural } from './rules';
import { brandFormSchema, toNewBrand, type BrandFormValues } from './schema';
import { BrandAvatar } from './ui/BrandAvatar';
import { StatusBadge } from './ui/StatusBadge';

/* --------------------------------------------------------------- Add brand */

function AddBrandForm({ onCreated }: { onCreated: (brandId: string) => void }) {
  const idBase = useId();
  const create = useCreateBrand();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: { name: '', description: '', keywords: [] },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    create.mutate(toNewBrand(values), {
      onSuccess: (brand) => onCreated(brand.id),
      onError: (error) =>
        setFormError(applyServerErrors(error, ['name', 'description', 'keywords'], form.setError)),
    });
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}
      <BrandFields form={form} idBase={idBase} />
      <div className="flex justify-end">
        <SubmitButton pending={create.isPending} pendingLabel="Adding…" variant="dark">
          Add brand
        </SubmitButton>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------- Brand cards */

function BrandCard({ brand }: { brand: BrandSummary }) {
  const { counts } = brand;
  const facts = [
    { icon: Globe, text: plural(counts.domains, 'domain') },
    { icon: Stamp, text: plural(counts.trademarks, 'trademark') },
    { icon: ImageIcon, text: plural(counts.logos, 'logo') },
    { icon: Tag, text: plural(counts.keywords, 'keyword') },
  ];
  return (
    <li className="relative flex flex-col rounded-3xl bg-white p-5 ring-1 ring-line transition-shadow focus-within:shadow-lifted hover:shadow-lifted">
      <div className="flex items-start gap-4">
        <BrandAvatar name={brand.name} logoUrl={brand.logoUrl} className="size-14" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[1.0625rem] font-semibold">
            {/* The link covers the whole card, so the card is one big click target. */}
            <Link
              to={`/app/brands/${brand.id}`}
              className="rounded-sm after:absolute after:inset-0 after:rounded-3xl after:content-['']"
            >
              {brand.name}
            </Link>
          </h2>
          <div className="mt-1.5">
            <StatusBadge status={brand.status} />
          </div>
        </div>
      </div>
      {brand.description && (
        <p className="mt-4 line-clamp-2 text-[14.5px] text-muted">{brand.description}</p>
      )}
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px] text-muted">
        {facts.map(({ icon: Icon, text }) => (
          <li key={text} className="inline-flex items-center gap-1.5">
            <Icon aria-hidden className="size-4" />
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-4 text-[12.5px] text-muted">Updated {formatDate(brand.updatedAt)}</p>
    </li>
  );
}

function EmptyBrands({ canManage, onAdd }: { canManage: boolean; onAdd: () => void }) {
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-10">
      <div className="mx-auto max-w-2xl">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-cream ring-1 ring-line">
          <ShieldCheck aria-hidden className="size-6 text-ink" />
        </span>
        <h2 className="text-title mt-5 font-semibold">Add the first brand you want to protect</h2>
        <p className="mt-3 text-[15.5px] text-ink">
          A brand is a name your customers know you by: your company, or one of your products. Tell
          Similo about it once, and it keeps everything it needs in one place.
        </p>
        <ul className="mt-4 space-y-2 text-[15px] text-ink">
          <li className="flex gap-2.5">
            <Globe aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>
              Your official website addresses, so Similo knows which ones are really yours.
            </span>
          </li>
          <li className="flex gap-2.5">
            <ImageIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>Your logo, so it can be compared with images used by other websites.</span>
          </li>
          <li className="flex gap-2.5">
            <Stamp aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>Your registered trademarks, entered by you, to compare with new filings.</span>
          </li>
        </ul>
        <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-[14.5px] text-ink ring-1 ring-line">
          <strong className="font-semibold">Monitoring starts in a later phase.</strong> For now you
          can add and organise your brand details. Nothing is being scanned yet.
        </p>
        <div className="mt-6">
          {canManage ? (
            <Button variant="dark" onClick={onAdd}>
              <Plus aria-hidden className="size-4" />
              Add brand
            </Button>
          ) : (
            <p className="text-[14.5px] text-muted">
              Ask an Owner or Admin to add your brands. Once they do, you will see them here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Page */

export function BrandsPage() {
  const { data: me } = useSession();
  const can = useCan();
  const canManage = can('brands:manage');
  const brands = useBrands();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // "/app/brands?add=1" (from the Overview checklist) opens the form straight away.
  const [adding, setAdding] = useState(() => params.get('add') === '1');

  useEffect(() => {
    if (params.get('add') === '1') void navigate('/app/brands', { replace: true });
  }, [params, navigate]);

  if (!me) return null;

  return (
    <>
      <PageHeader
        title="Brands"
        description={`The brands ${me.organization.name} wants Similo to protect: names, websites, logos and trademarks.`}
        actions={
          canManage &&
          brands.data &&
          brands.data.length > 0 && (
            <Button variant="dark" onClick={() => setAdding(true)}>
              <Plus aria-hidden className="size-4" />
              Add brand
            </Button>
          )
        }
      />

      <section aria-label="Your brands" className="mt-8">
        {brands.isPending && <p className="text-muted">Loading brands…</p>}
        {brands.isError && (
          <div className="space-y-3">
            <FormAlert>{brands.error.message}</FormAlert>
            <Button variant="outline" size="sm" onClick={() => void brands.refetch()}>
              Try again
            </Button>
          </div>
        )}
        {brands.data?.length === 0 && (
          <EmptyBrands canManage={canManage} onAdd={() => setAdding(true)} />
        )}
        {brands.data && brands.data.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {brands.data.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={adding && canManage}
        onClose={() => setAdding(false)}
        title="Add a brand"
        description="Start with the basics. You can add websites, logos and trademarks on the next screen."
      >
        <AddBrandForm
          onCreated={(brandId) => {
            setAdding(false);
            void navigate(`/app/brands/${brandId}`);
          }}
        />
      </Dialog>
    </>
  );
}
