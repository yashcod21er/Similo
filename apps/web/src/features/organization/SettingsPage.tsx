import { zodResolver } from '@hookform/resolvers/zod';
import { useId, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, FormAlert, inputClass, PasswordInput, SubmitButton } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import { PageHeader } from '@/features/app-shell/AppLayout';
import { useCan, useChangePassword, useSession } from '@/features/auth/api';
import {
  changePasswordSchema,
  organizationName,
  PASSWORD_HINT,
  type ChangePasswordValues,
} from '@/features/auth/schema';
import { validationDetails } from '@/lib/api-client';
import { useRenameOrganization } from './api';

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
      <h2 className="text-title font-semibold">{title}</h2>
      {description && <p className="mt-1.5 text-[14.5px] text-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

const renameSchema = z.object({ name: organizationName });

function OrganizationForm({ current }: { current: string }) {
  const id = useId();
  const rename = useRenameOrganization();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<{ name: string }>({ resolver: zodResolver(renameSchema), values: { name: current } });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(({ name }) =>
        rename.mutate(name, { onSuccess: () => reset({ name }) }),
      )}
      className="space-y-5"
    >
      {rename.isSuccess && !isDirty && (
        <FormAlert tone="success">Organisation name saved.</FormAlert>
      )}
      {rename.error && <FormAlert>{rename.error.message}</FormAlert>}
      <Field label="Organisation name" htmlFor={`${id}-name`} error={errors.name?.message}>
        <input
          id={`${id}-name`}
          className={inputClass}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(`${id}-name`, Boolean(errors.name))}
          {...register('name')}
        />
      </Field>
      <SubmitButton pending={rename.isPending} pendingLabel="Saving…" variant="dark">
        Save name
      </SubmitButton>
    </form>
  );
}

function PasswordForm() {
  const id = useId();
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });
  const formError =
    change.error && validationDetails(change.error).length === 0 ? change.error.message : null;
  const currentId = `${id}-current`;
  const newId = `${id}-new`;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        change.mutate(values, {
          onSuccess: () => reset(),
          onError: (error) => {
            for (const detail of validationDetails(error)) {
              setError(detail.path as keyof ChangePasswordValues, { message: detail.message });
            }
          },
        }),
      )}
      className="space-y-5"
    >
      {change.isSuccess && (
        <FormAlert tone="success">
          Password changed. You stay signed in here; every other device was signed out.
        </FormAlert>
      )}
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Current password" htmlFor={currentId} error={errors.currentPassword?.message}>
        <PasswordInput
          id={currentId}
          autoComplete="current-password"
          aria-invalid={errors.currentPassword ? true : undefined}
          aria-describedby={describedBy(currentId, Boolean(errors.currentPassword))}
          {...register('currentPassword')}
        />
      </Field>
      <Field
        label="New password"
        htmlFor={newId}
        error={errors.newPassword?.message}
        hint={PASSWORD_HINT}
      >
        <PasswordInput
          id={newId}
          autoComplete="new-password"
          aria-invalid={errors.newPassword ? true : undefined}
          aria-describedby={describedBy(newId, Boolean(errors.newPassword), true)}
          {...register('newPassword')}
        />
      </Field>
      <SubmitButton pending={change.isPending} pendingLabel="Changing…" variant="dark">
        Change password
      </SubmitButton>
    </form>
  );
}

export function SettingsPage() {
  const { data: me } = useSession();
  const can = useCan();
  if (!me) return null;

  return (
    <>
      <PageHeader title="Settings" description="Your organisation and your own account." />
      <div className="mt-8 grid gap-6">
        <Card
          title="Organisation"
          description={
            can('organization:update')
              ? 'The name everyone in your organisation sees.'
              : 'Only Owners and Admins can change these settings.'
          }
        >
          {can('organization:update') ? (
            <OrganizationForm current={me.organization.name} />
          ) : (
            <p className="text-[15px] font-medium">{me.organization.name}</p>
          )}
        </Card>

        <Card title="Your account">
          <dl className="grid gap-4 text-[15px] sm:grid-cols-3">
            {[
              ['Name', me.user.name],
              ['Email', me.user.email],
              ['Role', me.roleLabel],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-[13px] text-muted">{term}</dt>
                <dd className="mt-1 truncate font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card
          title="Change password"
          description="Changing your password signs you out on every other device."
        >
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
