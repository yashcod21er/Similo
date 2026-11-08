import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Copy, UserPlus } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/ui/form';
import { describedBy } from '@/components/ui/form-helpers';
import { PageHeader } from '@/features/app-shell/AppLayout';
import { useCan, useSession, type Role } from '@/features/auth/api';
import { validationDetails } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { daysUntil, formatDate, initials } from '@/lib/format';
import {
  useChangeRole,
  useCreateInvite,
  useInvites,
  useMembers,
  useRemoveMember,
  useRevokeInvite,
  type Member,
} from './api';
import { canManageMember, ROLE_OPTIONS } from './roles';

/* ----------------------------------------------------------- Invite dialog */

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: 'Enter their email address' })
    .pipe(z.email({ error: 'Enter a valid email address' })),
  role: z.enum(['owner', 'admin', 'analyst', 'legal', 'viewer']),
});
type InviteValues = z.infer<typeof inviteSchema>;

function InviteForm({ myRole, onDone }: { myRole: Role; onDone: () => void }) {
  const id = useId();
  const create = useCreateInvite();
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'analyst' },
  });

  if (create.data) {
    const link = create.data.inviteUrl;
    return (
      <div className="space-y-5">
        <FormAlert tone="success">
          Invitation created for <strong>{getValues('email').trim().toLowerCase()}</strong> as{' '}
          {create.data.invite.roleLabel}.
        </FormAlert>
        <div>
          <label htmlFor={`${id}-link`} className="text-[14px] font-medium">
            Invitation link
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id={`${id}-link`}
              readOnly
              value={link}
              onFocus={(event) => event.currentTarget.select()}
              className={cn(inputClass, 'mt-0 font-mono text-[13px]')}
            />
            <Button
              variant="dark"
              onClick={() => {
                void navigator.clipboard?.writeText(link).then(() => setCopied(true));
              }}
              className="shrink-0"
            >
              {copied ? (
                <Check aria-hidden className="size-4" />
              ) : (
                <Copy aria-hidden className="size-4" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="mt-2 text-[13px] text-muted">
            Send this link to them yourself — Similo doesn&apos;t send emails yet. It works once and
            expires in 7 days. For security it won&apos;t be shown again.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              create.reset();
              reset();
              setCopied(false);
            }}
          >
            Invite someone else
          </Button>
          <Button variant="dark" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = handleSubmit((values) =>
    create.mutate(values, {
      onError: (error) => {
        for (const detail of validationDetails(error)) {
          setError(detail.path as keyof InviteValues, { message: detail.message });
        }
      },
    }),
  );
  const formError =
    create.error && validationDetails(create.error).length === 0 ? create.error.message : null;
  const emailId = `${id}-email`;
  const options = ROLE_OPTIONS.filter((option) => option.value !== 'owner' || myRole === 'owner');

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label="Their work email" htmlFor={emailId} error={errors.email?.message}>
        <input
          id={emailId}
          type="email"
          autoComplete="off"
          className={inputClass}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy(emailId, Boolean(errors.email))}
          {...register('email')}
        />
      </Field>
      <fieldset>
        <legend className="text-[14px] font-medium">Role</legend>
        <div className="mt-2 grid gap-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 ring-1 ring-line transition-colors has-[:checked]:bg-crimson/[0.04] has-[:checked]:ring-crimson/50 hover:bg-paper"
            >
              <input
                type="radio"
                value={option.value}
                className="mt-1 size-4 accent-[#d92f48]"
                {...register('role')}
              />
              <span>
                <span className="block text-[14.5px] font-medium">{option.label}</span>
                <span className="block text-[13px] text-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end">
        <SubmitButton pending={create.isPending} pendingLabel="Creating link…" variant="dark">
          Create invitation link
        </SubmitButton>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------- Members */

function RoleControl({
  member,
  myRole,
  editable,
}: {
  member: Member;
  myRole: Role;
  editable: boolean;
}) {
  const changeRole = useChangeRole();
  if (!editable) {
    return (
      <span className="rounded-full bg-paper px-2.5 py-1 text-[12.5px] font-medium ring-1 ring-line">
        {member.roleLabel}
      </span>
    );
  }
  const options = ROLE_OPTIONS.filter((option) => option.value !== 'owner' || myRole === 'owner');
  return (
    <div>
      <select
        aria-label={`Role for ${member.name}`}
        value={member.role}
        disabled={changeRole.isPending}
        onChange={(event) =>
          changeRole.mutate({ userId: member.userId, role: event.target.value as Role })
        }
        className="rounded-xl border border-line-strong bg-white py-2 pr-8 pl-3 text-[14px] outline-none focus:border-crimson focus:ring-4 focus:ring-crimson/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {changeRole.error && (
        <p role="alert" className="mt-1 max-w-56 text-[12.5px] text-crimson-dark">
          {changeRole.error.message}
        </p>
      )}
    </div>
  );
}

export function MembersPage() {
  const { data: me } = useSession();
  const can = useCan();
  const canManage = can('members:manage');
  const members = useMembers();
  const invites = useInvites(canManage);
  const revoke = useRevokeInvite();
  const remove = useRemoveMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  if (!me) return null;

  return (
    <>
      <PageHeader
        title="Members"
        description={`Everyone in ${me.organization.name}. Roles decide what each person can do.`}
        actions={
          canManage && (
            <Button variant="dark" onClick={() => setInviteOpen(true)}>
              <UserPlus aria-hidden className="size-4" />
              Invite people
            </Button>
          )
        }
      />

      <section
        aria-label="Members"
        className="mt-8 overflow-hidden rounded-3xl bg-white ring-1 ring-line"
      >
        {members.isPending && <p className="p-6 text-muted">Loading members…</p>}
        {members.isError && <FormAlert className="m-4">{members.error.message}</FormAlert>}
        {members.data && (
          <ul className="divide-y divide-line">
            {members.data.map((member) => {
              const editable = canManageMember(me.role, canManage, member);
              return (
                <li
                  key={member.userId}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-6"
                >
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crimson/10 text-[13px] font-semibold text-crimson-dark"
                  >
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="truncate">{member.name}</span>
                      {member.isYou && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[11.5px] font-medium text-white">
                          You
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[13.5px] text-muted">{member.email}</p>
                  </div>
                  <p className="hidden text-[13.5px] text-muted md:block">
                    Joined {formatDate(member.joinedAt)}
                  </p>
                  <RoleControl member={member} myRole={me.role} editable={editable} />
                  {editable && (
                    <Button variant="ghost" size="sm" onClick={() => setRemoving(member)}>
                      Remove
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {canManage && invites.data && invites.data.length > 0 && (
        <section aria-labelledby="pending-invites" className="mt-8">
          <h2 id="pending-invites" className="text-title font-semibold">
            Pending invitations
          </h2>
          {revoke.error && <FormAlert className="mt-4">{revoke.error.message}</FormAlert>}
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-white ring-1 ring-line">
            {invites.data.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:px-6"
              >
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate font-medium">{invite.email}</p>
                  <p className="text-[13.5px] text-muted">
                    {invite.roleLabel} · invited by {invite.invitedBy ?? 'a former member'} ·
                    expires in {daysUntil(invite.expiresAt)} days
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(invite.id)}
                >
                  Cancel invitation
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite someone"
        description="They'll get a link to create their account and join with the role you choose."
      >
        <InviteForm myRole={me.role} onDone={() => setInviteOpen(false)} />
      </Dialog>

      <Dialog
        open={removing !== null}
        onClose={() => {
          setRemoving(null);
          remove.reset();
        }}
        title={`Remove ${removing?.name ?? ''}?`}
        description={`They'll be signed out immediately and lose access to ${me.organization.name}.`}
      >
        {remove.error && <FormAlert className="mb-4">{remove.error.message}</FormAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRemoving(null)}>
            Keep them
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={() => {
              if (!removing) return;
              remove.mutate(removing.userId, { onSuccess: () => setRemoving(null) });
            }}
          >
            {remove.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
