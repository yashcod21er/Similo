import { Globe } from 'lucide-react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, FormAlert, inputClass } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import { ApiError, validationDetails } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { useAddDomain, useRemoveDomain, type Brand } from './api';
import { DOMAIN_ERROR, MAX_DOMAINS, previewDomain } from './rules';
import { Card, EmptyNote } from './ui/Card';

/** What the box will do with what you typed, in plain words. */
function domainHint(value: string): ReactNode {
  const text = value.trim();
  if (!text) {
    return 'Example: example.com. You can paste a full web address; Similo keeps just the domain.';
  }
  const preview = previewDomain(text);
  if (!preview) return DOMAIN_ERROR;
  return text === preview ? (
    'Looks good.'
  ) : (
    <>
      Similo will save this as <strong className="font-mono font-medium text-ink">{preview}</strong>
    </>
  );
}

function AddDomainForm({ brand }: { brand: Brand }) {
  const id = useId();
  const add = useAddDomain(brand.id);
  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const inputId = `${id}-domain`;
  const full = brand.domains.length >= MAX_DOMAINS;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!value.trim()) {
      setFieldError(DOMAIN_ERROR);
      return;
    }
    setFieldError(undefined);
    add.mutate(value.trim(), {
      onSuccess: () => setValue(''),
      onError: (error) => {
        const detail = validationDetails(error)[0];
        if (detail) setFieldError(detail.message);
        else if (error instanceof ApiError && error.status === 409) setFieldError(error.message);
        else setFormError(error.message);
      },
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field
        label="Add an official domain"
        htmlFor={inputId}
        error={fieldError}
        hint={<span aria-live="polite">{domainHint(value)}</span>}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setFieldError(undefined);
            }}
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="example.com"
            disabled={full}
            className={`${inputClass} font-mono sm:flex-1`}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={describedBy(inputId, Boolean(fieldError), true)}
          />
          <Button
            type="submit"
            variant="dark"
            size="lg"
            disabled={add.isPending || full}
            className="sm:mt-2"
          >
            {add.isPending ? 'Adding…' : 'Add domain'}
          </Button>
        </div>
      </Field>
      {full && (
        <p className="text-[13.5px] text-muted">
          You have reached the limit of {MAX_DOMAINS} domains for this brand.
        </p>
      )}
    </form>
  );
}

/** The website addresses that really belong to this brand. */
export function DomainsTab({ brand, canManage }: { brand: Brand; canManage: boolean }) {
  const remove = useRemoveDomain(brand.id);
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);

  return (
    <div className="grid gap-6">
      <Card
        title="Official domains"
        description="The website addresses that really belong to this brand. Similo uses them to tell your real sites from lookalikes."
      >
        {canManage ? (
          <AddDomainForm brand={brand} />
        ) : (
          <p className="text-[14.5px] text-muted">
            Only Owners and Admins can add or remove domains.
          </p>
        )}
      </Card>

      <section aria-labelledby="domain-list" className="rounded-3xl bg-white ring-1 ring-line">
        <h2 id="domain-list" className="px-5 pt-5 text-[15px] font-semibold sm:px-8 sm:pt-6">
          {brand.domains.length} of {MAX_DOMAINS} domains
        </h2>
        {remove.isError && <FormAlert className="m-4 sm:mx-8">{remove.error.message}</FormAlert>}
        {brand.domains.length === 0 ? (
          <div className="p-5 sm:p-8">
            <EmptyNote>No official domains yet. Add the first one above.</EmptyNote>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {brand.domains.map((entry) => (
              <li
                key={entry.domain}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:px-8"
              >
                <Globe aria-hidden className="size-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-mono text-[14.5px] font-medium break-all">{entry.domain}</p>
                  <p className="text-[13px] text-muted">Added {formatDate(entry.addedAt)}</p>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${entry.domain}`}
                    disabled={remove.isPending}
                    onClick={() => {
                      setRemovingDomain(entry.domain);
                      remove.mutate(entry.domain, { onSettled: () => setRemovingDomain(null) });
                    }}
                  >
                    {removingDomain === entry.domain ? 'Removing…' : 'Remove'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
