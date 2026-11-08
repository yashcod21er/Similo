import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Field, FormAlert, inputClass, PasswordInput, SubmitButton } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import { validationDetails } from '@/lib/api-client';
import { AuthCard } from './AuthLayout';
import { safeNextPath, useSession, useSignIn } from './api';
import { signInSchema, type SignInValues } from './schema';

export function SignInPage() {
  const id = useId();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const session = useSession();
  const signIn = useSignIn();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  if (session.data) return <Navigate to={next} replace />;

  const onSubmit = handleSubmit((values) =>
    signIn.mutate(values, {
      onSuccess: () => navigate(next, { replace: true }),
      onError: (error) => {
        for (const detail of validationDetails(error)) {
          setError(detail.path as keyof SignInValues, { message: detail.message });
        }
      },
    }),
  );

  const formError =
    signIn.error && validationDetails(signIn.error).length === 0 ? signIn.error.message : null;
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;

  return (
    <AuthCard
      title="Sign in to Similo"
      subtitle="Welcome back. Use your work email and password."
      footer={
        <>
          New to Similo?{' '}
          <Link to="/sign-up" className="font-medium text-ink underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Work email" htmlFor={emailId} error={errors.email?.message}>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            inputMode="email"
            className={inputClass}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy(emailId, Boolean(errors.email))}
            {...register('email')}
          />
        </Field>
        <Field label="Password" htmlFor={passwordId} error={errors.password?.message}>
          <PasswordInput
            id={passwordId}
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy(passwordId, Boolean(errors.password))}
            {...register('password')}
          />
        </Field>
        <SubmitButton pending={signIn.isPending} pendingLabel="Signing in…" className="w-full">
          Sign in
        </SubmitButton>
        <p className="text-[13px] leading-relaxed text-muted">
          After 5 wrong passwords, sign-in pauses for 15 minutes to protect your account. Forgot
          your password? Reset by email is coming soon — for now, ask your Similo administrator.
        </p>
      </form>
    </AuthCard>
  );
}
