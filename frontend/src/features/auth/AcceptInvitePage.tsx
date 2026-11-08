import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailX } from 'lucide-react';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Field, FormAlert, inputClass, PasswordInput, SubmitButton } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import { validationDetails } from '@/lib/api-client';
import { AuthCard } from './AuthLayout';
import { useAcceptInvite, useInvitePreview, useSession } from './api';
import { acceptInviteSchema, PASSWORD_HINT, type AcceptInviteValues } from './schema';

/** /invite/:token — someone follows the link an Owner or Admin sent them. */
export function AcceptInvitePage() {
  const { token = '' } = useParams();
  const id = useId();
  const navigate = useNavigate();
  const session = useSession();
  const preview = useInvitePreview(token);
  const accept = useAcceptInvite(token);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { name: '', password: '' },
  });

  if (preview.isPending) {
    return (
      <AuthCard title="Checking your invitation…">
        <p className="flex items-center gap-2 text-muted">
          <Loader2 aria-hidden className="size-4 animate-spin" /> One moment.
        </p>
      </AuthCard>
    );
  }

  if (preview.isError) {
    return (
      <AuthCard title="This invitation can't be used">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cream text-accent-ink ring-1 ring-line">
            <MailX aria-hidden className="size-5" />
          </span>
          <p className="text-[15px] text-muted">{preview.error.message}</p>
        </div>
        <ButtonLink to="/sign-in" variant="outline" size="lg" className="mt-7 w-full">
          Go to sign in
        </ButtonLink>
      </AuthCard>
    );
  }

  const invite = preview.data;
  const intro = (
    <>
      {invite.invitedBy ?? 'Someone'} invited you to join <strong>{invite.organizationName}</strong>{' '}
      as <strong>{invite.roleLabel}</strong>.
    </>
  );

  if (invite.accountExists) {
    return (
      <AuthCard title={`Join ${invite.organizationName}`} subtitle={intro}>
        <FormAlert>
          {invite.email} already has a Similo account. Joining a second organisation isn&apos;t
          supported yet — ask your admin to invite a different email address.
        </FormAlert>
      </AuthCard>
    );
  }

  const onSubmit = handleSubmit((values) =>
    accept.mutate(values, {
      onSuccess: () => navigate('/app', { replace: true }),
      onError: (error) => {
        for (const detail of validationDetails(error)) {
          setError(detail.path as keyof AcceptInviteValues, { message: detail.message });
        }
      },
    }),
  );

  const formError =
    accept.error && validationDetails(accept.error).length === 0 ? accept.error.message : null;
  const nameId = `${id}-name`;
  const passwordId = `${id}-password`;

  return (
    <AuthCard
      title={`Join ${invite.organizationName}`}
      subtitle={intro}
      footer={
        session.data ? (
          <>You are signed in as {session.data.user.email}. Accepting creates a separate account.</>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/sign-in" className="font-medium text-ink underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        )
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <div>
          <p className="text-[14px] font-medium text-ink">Email</p>
          <p className="mt-2 rounded-xl bg-cream px-4 py-3 text-[15px] text-muted ring-1 ring-line">
            {invite.email}
          </p>
        </div>
        <Field label="Your name" htmlFor={nameId} error={errors.name?.message}>
          <input
            id={nameId}
            autoComplete="name"
            className={inputClass}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy(nameId, Boolean(errors.name))}
            {...register('name')}
          />
        </Field>
        <Field
          label="Choose a password"
          htmlFor={passwordId}
          error={errors.password?.message}
          hint={PASSWORD_HINT}
        >
          <PasswordInput
            id={passwordId}
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy(passwordId, Boolean(errors.password), true)}
            {...register('password')}
          />
        </Field>
        <SubmitButton pending={accept.isPending} pendingLabel="Joining…" className="w-full">
          Join {invite.organizationName}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
