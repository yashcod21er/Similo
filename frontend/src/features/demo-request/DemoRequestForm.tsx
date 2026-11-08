import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { EASE_OUT } from '@/lib/motion';
import { ApiError, apiRequest } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import {
  demoRequestSchema,
  INTEREST_OPTIONS,
  ROLE_OPTIONS,
  type DemoRequestForm as FormValues,
} from './schema';

const inputClass =
  'mt-2 block w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[15px] text-ink shadow-[inset_0_1px_2px_rgb(11_16_32/0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 hover:border-ink/30 focus:border-crimson focus:ring-4 focus:ring-crimson/15 aria-invalid:border-crimson aria-invalid:ring-4 aria-invalid:ring-crimson/10';

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
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-[13.5px] text-crimson-dark">
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
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        role="status"
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.15 }}
          className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50"
        >
          <CheckCircle2 className="size-8" />
        </motion.span>
        <h2 className="text-title mt-6 font-semibold">
          Thank you, {getValues('fullName').split(' ')[0]}.
        </h2>
        <p className="mt-3 max-w-sm text-muted">
          Your request has been received. We will reply to {getValues('workEmail')} to arrange a
          time.
        </p>
      </motion.div>
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
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-white px-4 py-3 text-[14.5px] transition-[border-color,background-color,box-shadow] hover:border-ink/30 has-checked:border-crimson has-checked:bg-crimson/[0.04] has-checked:ring-1 has-checked:ring-crimson/30 has-focus-visible:ring-4 has-focus-visible:ring-crimson/15"
            >
              <input
                type="checkbox"
                value={option.value}
                className="size-4 accent-crimson"
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
            className="mt-2 text-[13.5px] text-crimson-dark"
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
        <label className="flex items-start gap-3 rounded-xl bg-paper p-4 text-[14px] leading-relaxed text-muted ring-1 ring-line">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-crimson"
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
            className="mt-2 text-[13.5px] text-crimson-dark"
          >
            {errors.consent.message}
          </p>
        )}
      </div>

      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="flex gap-3 overflow-hidden rounded-xl border border-crimson/30 bg-crimson/[0.05] p-4 text-[14px]"
          >
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-crimson-dark" />
            <div>
              <p className="font-medium">Your request was not sent.</p>
              <p className="mt-0.5 text-muted">{serverError.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
