import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { Field, FormAlert, inputClass, PasswordInput, SubmitButton } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import { validationDetails } from '@/lib/api-client';
import { AuthCard } from './AuthLayout';
import { useSession, useSignUp } from './api';
import { PASSWORD_HINT, signUpSchema, type SignUpValues } from './schema';

export function SignUpPage() {
  const id = useId();
  const navigate = useNavigate();
  const session = useSession();
  const signUp = useSignUp();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', organizationName: '', password: '' },
  });

  if (session.data) return <Navigate to="/app" replace />;

  const onSubmit = handleSubmit((values) =>
    signUp.mutate(values, {
      onSuccess: () => navigate('/app', { replace: true }),
      onError: (error) => {
        for (const detail of validationDetails(error)) {
          setError(detail.path as keyof SignUpValues, { message: detail.message });
        }
      },
    }),
  );

  const formError =
    signUp.error && validationDetails(signUp.error).length === 0 ? signUp.error.message : null;
  const ids = {
    name: `${id}-name`,
    email: `${id}-email`,
    organizationName: `${id}-organization`,
    password: `${id}-password`,
  };
  const field = (name: keyof SignUpValues, hasHint = false) => ({
    id: ids[name],
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': describedBy(ids[name], Boolean(errors[name]), hasHint),
  });

  return (
    <AuthCard
      title="Create your workspace"
      subtitle="You'll be its Owner, and you can invite your team straight after."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Your name" htmlFor={ids.name} error={errors.name?.message}>
          <input
            {...field('name')}
            autoComplete="name"
            className={inputClass}
            {...register('name')}
          />
        </Field>
        <Field label="Work email" htmlFor={ids.email} error={errors.email?.message}>
          <input
            {...field('email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            className={inputClass}
            {...register('email')}
          />
        </Field>
        <Field
          label="Organisation name"
          htmlFor={ids.organizationName}
          error={errors.organizationName?.message}
        >
          <input
            {...field('organizationName')}
            autoComplete="organization"
            className={inputClass}
            {...register('organizationName')}
          />
        </Field>
        <Field
          label="Password"
          htmlFor={ids.password}
          error={errors.password?.message}
          hint={PASSWORD_HINT}
        >
          <PasswordInput
            {...field('password', true)}
            autoComplete="new-password"
            {...register('password')}
          />
        </Field>
        <SubmitButton pending={signUp.isPending} pendingLabel="Creating…" className="w-full">
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
