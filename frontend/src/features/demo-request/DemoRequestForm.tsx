import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { StampSlam } from '@/components/scenes';
import { Button } from '@/components/ui/Button';
import { ApiError, apiRequest } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import {
  demoRequestSchema,
  INTEREST_OPTIONS,
  ROLE_OPTIONS,
  type DemoRequestForm as FormValues,
} from './schema';

const inputClass =
  'mt-2 block w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[15px] text-ink shadow-[inset_0_1px_2px_rgb(21_19_15/0.05)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 aria-invalid:border-accent aria-invalid:ring-4 aria-invalid:ring-accent/10';

function Field({
  label,
  error,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  error?: string | undefined;
  htmlFor: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-[13.5px] text-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}

const DEFAULT_VALUES: FormValues = {
  fullName: '',
  workEmail: '',
  company: '',
  role: '' as FormValues['role'],
  interests: [],
  message: '',
  consent: false as unknown as true,
  website: '',
};

export function DemoRequestForm() {
  const id = useId();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<{ received: true }>('/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }),
    onError: (error) => {
      // Show server-side validation errors next to the matching fields.
      if (
        error instanceof ApiError &&
        error.code === 'VALIDATION_ERROR' &&
        Array.isArray(error.details)
      ) {
        for (const detail of error.details as { path: string; message: string }[]) {
          setError(detail.path as keyof FormValues, { message: detail.message });
        }
      }
    },
  });

  const fieldId = (name: string) => `${id}-${name}`;
  const describedBy = (name: keyof FormValues) =>
    errors[name] ? `${fieldId(name)}-error` : undefined;

  if (mutation.isSuccess) {
    return (
      <div role="status" className="px-6 py-14 sm:px-8">
        <StampSlam text="Received" detail="We will reply by email" />
        <h2 className="mt-8 text-[1.75rem] leading-[1.05] font-semibold tracking-[-0.04em]">
          Thank you, {getValues('fullName').split(' ')[0]}.
        </h2>
        <p className="mt-3 max-w-md leading-relaxed text-muted">
          Your request has been received. We will reply to {getValues('workEmail')} to arrange a
          time. We do not promise a fixed response time, but we read every request.
        </p>
      </div>
    );
  }

  const serverError =
    mutation.error &&
    !(mutation.error instanceof ApiError && mutation.error.code === 'VALIDATION_ERROR')
      ? mutation.error
      : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6 p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor={fieldId('fullName')} error={errors.fullName?.message}>
          <input
            id={fieldId('fullName')}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describedBy('fullName')}
            className={inputClass}
            {...register('fullName')}
          />
        </Field>
        <Field label="Work email" htmlFor={fieldId('workEmail')} error={errors.workEmail?.message}>
          <input
            id={fieldId('workEmail')}
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.workEmail)}
            aria-describedby={describedBy('workEmail')}
            className={inputClass}
            {...register('workEmail')}
          />
        </Field>
        <Field label="Organisation" htmlFor={fieldId('company')} error={errors.company?.message}>
          <input
            id={fieldId('company')}
            autoComplete="organization"
            aria-invalid={Boolean(errors.company)}
            aria-describedby={describedBy('company')}
            className={inputClass}
            {...register('company')}
          />
        </Field>
        <Field label="Your role" htmlFor={fieldId('role')} error={errors.role?.message}>
          <div className="relative">
            <select
              id={fieldId('role')}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={describedBy('role')}
              className={cn(inputClass, 'appearance-none pr-10')}
              {...register('role')}
            >
              <option value="" disabled>
                Select…
              </option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3.5 size-4 translate-y-[calc(-50%+4px)] text-muted"
            />
          </div>
        </Field>
      </div>

      <fieldset aria-describedby={describedBy('interests')}>
        <legend className="text-[14px] font-medium text-ink">What would you like to see?</legend>
        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
          {INTEREST_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-white px-4 py-3 text-[14.5px] transition-[border-color,background-color] hover:border-ink/30 has-checked:border-accent has-checked:bg-accent/[0.05] has-focus-visible:ring-4 has-focus-visible:ring-accent/15"
            >
              <input
                type="checkbox"
                value={option.value}
                className="size-4 accent-accent"
                {...register('interests')}
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.interests && (
          <p
            id={`${fieldId('interests')}-error`}
            role="alert"
            className="mt-2 text-[13.5px] text-accent-ink"
          >
            {errors.interests.message}
          </p>
        )}
      </fieldset>

      <Field
        label="Anything we should know?"
        htmlFor={fieldId('message')}
        optional
        error={errors.message?.message}
      >
        <textarea
          id={fieldId('message')}
          rows={4}
          placeholder="Brands, domains or marks you are concerned about…"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy('message')}
          className={cn(inputClass, 'resize-y')}
          {...register('message')}
        />
      </Field>

      {/* Honeypot: visually hidden and skipped by keyboard and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={fieldId('website')}>Website</label>
        <input id={fieldId('website')} tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div>
        <label className="flex items-start gap-3 rounded-xl bg-cream p-4 text-[14px] leading-relaxed text-muted ring-1 ring-line">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-accent"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy('consent')}
            {...register('consent')}
          />
          I agree that Similo may store these details and contact me about my request.
        </label>
        {errors.consent && (
          <p
            id={`${fieldId('consent')}-error`}
            role="alert"
            className="mt-2 text-[13.5px] text-accent-ink"
          >
            {errors.consent.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-accent/30 bg-accent/[0.05] p-4 text-[14px]"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-ink" />
          <div>
            <p className="font-medium">Your request was not sent.</p>
            <p className="mt-0.5 text-muted">{serverError.message}</p>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Request a demo <ArrowRight aria-hidden className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
