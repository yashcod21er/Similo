import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert, SubmitButton } from '@/components/ui/form';
import { formatDate } from '@/lib/format';
import { useUpdateBrand, type Brand, type BrandChanges } from './api';
import { BrandFields } from './BrandFields';
import { applyServerErrors } from './form-errors';
import { plural } from './rules';
import { brandFormSchema, type BrandFormValues } from './schema';
import { Card } from './ui/Card';
import { ChipList } from './ui/ChipInput';

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

function EditForm({ brand }: { brand: Brand }) {
  const idBase = useId();
  const update = useUpdateBrand(brand.id);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    values: { name: brand.name, description: brand.description, keywords: brand.keywords },
  });
  const { isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    // Send only what changed, so the audit log shows exactly what you edited.
    const changes: BrandChanges = {};
    if (values.name !== brand.name) changes.name = values.name;
    if (values.description !== brand.description) changes.description = values.description;
    if (!sameList(values.keywords, brand.keywords)) changes.keywords = values.keywords;
    if (Object.keys(changes).length === 0) return;
    update.mutate(changes, {
      onError: (error) =>
        setFormError(applyServerErrors(error, ['name', 'description', 'keywords'], form.setError)),
    });
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {update.isSuccess && !isDirty && <FormAlert tone="success">Changes saved.</FormAlert>}
      {formError && <FormAlert>{formError}</FormAlert>}
      <BrandFields form={form} idBase={idBase} />
      <SubmitButton pending={update.isPending} pendingLabel="Saving…" variant="dark">
        Save changes
      </SubmitButton>
    </form>
  );
}

function ReadOnlyDetails({ brand }: { brand: Brand }) {
  return (
    <dl className="space-y-5 text-[15px]">
      <div>
        <dt className="text-[13px] text-muted">Brand name</dt>
        <dd className="mt-1 font-medium break-words">{brand.name}</dd>
      </div>
      <div>
        <dt className="text-[13px] text-muted">Description</dt>
        <dd className="mt-1 break-words">{brand.description || 'No description.'}</dd>
      </div>
      <div>
        <dt className="text-[13px] text-muted">Keywords and other spellings</dt>
        <dd className="mt-2">
          {brand.keywords.length > 0 ? (
            <ChipList items={brand.keywords} label={(item) => item} />
          ) : (
            'None added.'
          )}
        </dd>
      </div>
    </dl>
  );
}

/** Name, description and keywords, plus a quick view of what else is set up. */
export function OverviewTab({
  brand,
  canManage,
  onOpenTab,
}: {
  brand: Brand;
  canManage: boolean;
  onOpenTab: (tab: string) => void;
}) {
  const setup = [
    { tab: 'domains', label: 'Official domains', value: plural(brand.domains.length, 'domain') },
    { tab: 'logos', label: 'Logos', value: plural(brand.logos.length, 'logo') },
    {
      tab: 'trademarks',
      label: 'Trademarks',
      value: plural(brand.trademarks.length, 'trademark'),
    },
    {
      tab: 'monitoring',
      label: 'Monitoring',
      value: brand.monitoring.updatedAt ? 'Settings saved' : 'Default settings',
    },
  ];

  return (
    <div className="grid gap-6">
      <Card
        title="Details"
        description={
          canManage
            ? 'What your team calls this brand, and other spellings Similo should know about.'
            : 'Only Owners and Admins can edit brands. You can see everything here.'
        }
      >
        {canManage ? <EditForm brand={brand} /> : <ReadOnlyDetails brand={brand} />}
        <p className="mt-6 text-[13px] text-muted">
          Added {formatDate(brand.createdAt)} · Last changed {formatDate(brand.updatedAt)}
        </p>
      </Card>

      <Card title="What is set up">
        <ul className="grid gap-3 sm:grid-cols-2">
          {setup.map((item) => (
            <li key={item.tab}>
              <button
                type="button"
                onClick={() => onOpenTab(item.tab)}
                className="flex w-full flex-col items-start rounded-2xl p-4 text-left ring-1 ring-line transition-colors hover:bg-paper"
              >
                <span className="text-[13.5px] text-muted">{item.label}</span>
                <span className="mt-0.5 font-medium">{item.value}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
