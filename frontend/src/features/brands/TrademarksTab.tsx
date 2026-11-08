import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import {
  useAddTrademark,
  useRemoveTrademark,
  useUpdateTrademark,
  type Brand,
  type Trademark,
  type TrademarkInput,
  type TrademarkStatus,
} from './api';
import { applyServerErrors } from './form-errors';
import {
  MAX_TRADEMARKS,
  OFFICE_OPTIONS,
  officeLabel,
  parseNiceClass,
  toClassNumbers,
  TRADEMARK_STATUS_OPTIONS,
  trademarkStatusLabel,
} from './rules';
import { trademarkFormSchema, type TrademarkFormValues } from './schema';
import { Card, EmptyNote } from './ui/Card';
import { ChipInput } from './ui/ChipInput';
import { ConfirmDialog } from './ui/ConfirmDialog';

const FIELDS = ['mark', 'office', 'number', 'classes', 'status', 'date'] as const;

/* ------------------------------------------------------------------- Form */

function toFormValues(trademark: Trademark | null): TrademarkFormValues {
  return trademark
    ? {
        mark: trademark.mark,
        office: trademark.office,
        number: trademark.number,
        classes: trademark.classes.map(String),
        status: trademark.status,
        date: trademark.date ?? '',
      }
    : { mark: '', office: 'USPTO', number: '', classes: [], status: 'registered', date: '' };
}

/** Only the fields that differ from the saved trademark (an edit sends nothing else). */
function changesFrom(values: TrademarkFormValues, saved: Trademark): Partial<TrademarkInput> {
  const changes: Partial<TrademarkInput> = {};
  if (values.mark !== saved.mark) changes.mark = values.mark;
  if (values.office !== saved.office) changes.office = values.office;
  if (values.number !== saved.number) changes.number = values.number;
  const classes = toClassNumbers(values.classes);
  if (classes.join(',') !== saved.classes.join(',')) changes.classes = classes;
  if (values.status !== saved.status) changes.status = values.status;
  if (values.date !== (saved.date ?? '')) changes.date = values.date === '' ? null : values.date;
  return changes;
}

function TrademarkForm({
  brandId,
  trademark,
  onDone,
}: {
  brandId: string;
  /** The trademark being edited, or null to add a new one. */
  trademark: Trademark | null;
  onDone: () => void;
}) {
  const id = useId();
  const add = useAddTrademark(brandId);
  const update = useUpdateTrademark(brandId);
  const pending = add.isPending || update.isPending;
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TrademarkFormValues>({
    resolver: zodResolver(trademarkFormSchema),
    defaultValues: toFormValues(trademark),
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const ids = {
    mark: `${id}-mark`,
    office: `${id}-office`,
    number: `${id}-number`,
    classes: `${id}-classes`,
    status: `${id}-status`,
    date: `${id}-date`,
  };

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    const options = {
      onSuccess: onDone,
      onError: (error: Error) => setFormError(applyServerErrors(error, FIELDS, form.setError)),
    };
    if (trademark) {
      const changes = changesFrom(values, trademark);
      if (Object.keys(changes).length === 0) return onDone();
      update.mutate({ trademarkId: trademark.id, changes }, options);
    } else {
      add.mutate(
        {
          mark: values.mark,
          office: values.office,
          number: values.number,
          classes: toClassNumbers(values.classes),
          status: values.status,
          ...(values.date !== '' && { date: values.date }),
        },
        options,
      );
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field
        label="Trademark text"
        htmlFor={ids.mark}
        error={errors.mark?.message}
        hint="The word or name exactly as it is registered."
      >
        <input
          id={ids.mark}
          autoComplete="off"
          className={inputClass}
          aria-invalid={errors.mark ? true : undefined}
          aria-describedby={describedBy(ids.mark, Boolean(errors.mark), true)}
          {...register('mark')}
        />
      </Field>

      <div className="grid gap-5">
        <Field label="Trademark office" htmlFor={ids.office} error={errors.office?.message}>
          <select
            id={ids.office}
            className={inputClass}
            aria-invalid={errors.office ? true : undefined}
            aria-describedby={describedBy(ids.office, Boolean(errors.office))}
            {...register('office')}
          >
            {OFFICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Registration or application number"
          htmlFor={ids.number}
          error={errors.number?.message}
        >
          <input
            id={ids.number}
            autoComplete="off"
            className={cn(inputClass, 'font-mono')}
            aria-invalid={errors.number ? true : undefined}
            aria-describedby={describedBy(ids.number, Boolean(errors.number))}
            {...register('number')}
          />
        </Field>
      </div>

      <Field
        label="Nice classes"
        htmlFor={ids.classes}
        error={errors.classes?.message}
        hint="Classes group goods and services: for example, 9 is software and 35 is business services. Enter numbers from 1 to 45; press Enter, a comma or a space after each."
      >
        <Controller
          control={control}
          name="classes"
          render={({ field }) => (
            <ChipInput
              id={ids.classes}
              items={field.value}
              onChange={field.onChange}
              parse={parseNiceClass}
              noun="class"
              placeholder="For example 9, 35"
              splitter={/[\s,]+/}
              invalid={Boolean(errors.classes)}
              describedBy={describedBy(ids.classes, Boolean(errors.classes), true)}
            />
          )}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Status"
          htmlFor={ids.status}
          error={errors.status?.message}
          hint="Filed: applied for. Registered: granted. Expired: no longer in force."
        >
          <select
            id={ids.status}
            className={inputClass}
            aria-invalid={errors.status ? true : undefined}
            aria-describedby={describedBy(ids.status, Boolean(errors.status), true)}
            {...register('status')}
          >
            {TRADEMARK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Date (optional)"
          htmlFor={ids.date}
          error={errors.date?.message}
          hint="The filing, registration or expiry date that fits the status."
        >
          <input
            id={ids.date}
            type="date"
            className={inputClass}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy(ids.date, Boolean(errors.date), true)}
            {...register('date')}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <SubmitButton pending={pending} pendingLabel="Saving…" variant="dark">
          {trademark ? 'Save trademark' : 'Add trademark'}
        </SubmitButton>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------- List */

const STATUS_STYLE: Record<TrademarkStatus, string> = {
  registered: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  filed: 'bg-cream text-ink ring-line',
  expired: 'bg-accent/[0.06] text-accent-ink ring-accent/25',
};

function TrademarkRow({
  trademark,
  canManage,
  onEdit,
  onRemove,
}: {
  trademark: Trademark;
  canManage: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="px-5 py-5 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-[16px] font-semibold break-words">{trademark.mark}</p>
          <p className="mt-0.5 text-[13.5px] text-muted">
            {officeLabel(trademark.office)} · No.{' '}
            <span className="font-mono">{trademark.number}</span>
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[12.5px] font-medium ring-1',
            STATUS_STYLE[trademark.status],
          )}
        >
          {trademarkStatusLabel(trademark.status)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ul aria-label="Nice classes" className="flex flex-wrap gap-1.5">
          {trademark.classes.map((niceClass) => (
            <li
              key={niceClass}
              className="rounded-full bg-cream px-2.5 py-0.5 text-[12.5px] ring-1 ring-line"
            >
              Class {niceClass}
            </li>
          ))}
        </ul>
        {trademark.date && (
          <p className="text-[13.5px] text-muted">
            Date {formatDate(`${trademark.date}T12:00:00`)}
          </p>
        )}
      </div>
      {canManage && (
        <div className="mt-3 flex gap-1 sm:-ml-3">
          <Button variant="ghost" size="sm" aria-label={`Edit ${trademark.mark}`} onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remove ${trademark.mark}`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      )}
    </li>
  );
}

/** Trademarks you type in yourself. Similo doesn't look anything up in a registry. */
export function TrademarksTab({ brand, canManage }: { brand: Brand; canManage: boolean }) {
  const remove = useRemoveTrademark(brand.id);
  // `null` = closed, `'new'` = adding, otherwise the trademark being edited.
  const [editing, setEditing] = useState<Trademark | 'new' | null>(null);
  const [removing, setRemoving] = useState<Trademark | null>(null);
  const full = brand.trademarks.length >= MAX_TRADEMARKS;

  return (
    <div className="grid gap-6">
      <Card
        title={`Trademarks (${brand.trademarks.length} of ${MAX_TRADEMARKS})`}
        description={
          canManage
            ? 'Enter the trademarks you own, exactly as registered. You type them in; Similo does not look them up in a registry.'
            : 'Only Owners and Admins can add or change trademarks.'
        }
        actions={
          canManage && (
            <Button variant="dark" disabled={full} onClick={() => setEditing('new')}>
              <Plus aria-hidden className="size-4" />
              Add trademark
            </Button>
          )
        }
      >
        {remove.isError && removing === null && (
          <FormAlert className="mb-4">{remove.error.message}</FormAlert>
        )}
        {brand.trademarks.length === 0 ? (
          <EmptyNote>
            No trademarks yet.
            {canManage ? ' Add the ones you own so Similo can compare them with new filings.' : ''}
          </EmptyNote>
        ) : (
          <ul className="-mx-5 divide-y divide-line border-y border-line sm:-mx-8">
            {brand.trademarks.map((trademark) => (
              <TrademarkRow
                key={trademark.id}
                trademark={trademark}
                canManage={canManage}
                onEdit={() => setEditing(trademark)}
                onRemove={() => setRemoving(trademark)}
              />
            ))}
          </ul>
        )}
        {full && (
          <p className="mt-4 text-[13.5px] text-muted">
            You have reached the limit of {MAX_TRADEMARKS} trademarks for this brand.
          </p>
        )}
      </Card>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' || editing === null ? 'Add a trademark' : 'Edit trademark'}
        description="Enter it the way the trademark office lists it."
      >
        <TrademarkForm
          key={editing === null || editing === 'new' ? 'new' : editing.id}
          brandId={brand.id}
          trademark={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.mark ?? 'this trademark'}?`}
        description="It will be deleted from this brand. You can add it again later."
        confirmLabel="Remove trademark"
        pendingLabel="Removing…"
        pending={remove.isPending}
        error={remove.isError ? remove.error.message : null}
        onClose={() => {
          setRemoving(null);
          remove.reset();
        }}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, { onSuccess: () => setRemoving(null) });
        }}
      />
    </div>
  );
}
