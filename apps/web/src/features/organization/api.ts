import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, sendJson } from '@/lib/api-client';
import { sessionQueryKey, type Role } from '@/features/auth/api';

/* Mirrors apps/api/src/modules/organizations and audit DTOs. */

export interface OrganizationSummary {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  joinedAt: string;
  isYou: boolean;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  roleLabel: string;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actor: { name: string; email: string } | null;
  target: { type: string; label: string } | null;
  metadata: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

interface AuditPage {
  events: AuditEvent[];
  nextCursor: string | null;
}

const keys = {
  organization: ['organization'] as const,
  members: ['organization', 'members'] as const,
  invites: ['organization', 'invites'] as const,
  audit: ['audit-events'] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: keys.organization,
    queryFn: () => apiRequest<OrganizationSummary>('/organization'),
  });
}

export function useMembers() {
  return useQuery({
    queryKey: keys.members,
    queryFn: () => apiRequest<Member[]>('/organization/members'),
  });
}

export function useInvites(enabled: boolean) {
  return useQuery({
    queryKey: keys.invites,
    queryFn: () => apiRequest<PendingInvite[]>('/organization/invites'),
    enabled,
  });
}

/** Audit log, newest first; `fetchNextPage` loads older events. */
export function useAuditEvents() {
  return useInfiniteQuery({
    queryKey: keys.audit,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      apiRequest<AuditPage>(
        `/audit-events?limit=25${pageParam ? `&before=${encodeURIComponent(pageParam)}` : ''}`,
      ),
    getNextPageParam: (page) => page.nextCursor,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...queryKeys: readonly (readonly string[])[]) =>
    Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useRenameOrganization() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (name: string) => sendJson<OrganizationSummary>('/organization', { name }, 'PATCH'),
    onSuccess: () => invalidate(keys.organization, sessionQueryKey, keys.audit),
  });
}

export function useCreateInvite() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { email: string; role: Role }) =>
      sendJson<{ invite: PendingInvite; inviteUrl: string }>('/organization/invites', input),
    onSuccess: () => invalidate(keys.invites, keys.audit),
  });
}

export function useRevokeInvite() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (inviteId: string) =>
      sendJson<{ revoked: true }>(`/organization/invites/${inviteId}`, undefined, 'DELETE'),
    onSuccess: () => invalidate(keys.invites, keys.audit),
  });
}

export function useChangeRole() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      sendJson<Member>(`/organization/members/${userId}`, { role }, 'PATCH'),
    onSuccess: () => invalidate(keys.members, keys.audit),
  });
}

export function useRemoveMember() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (userId: string) =>
      sendJson<{ removed: true }>(`/organization/members/${userId}`, undefined, 'DELETE'),
    onSuccess: () => invalidate(keys.members, keys.organization, keys.audit),
  });
}
