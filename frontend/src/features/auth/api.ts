import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest, sendJson } from '@/lib/api-client';

/*
 * Mirrors backend/src/modules/auth (MeDto, InvitePreview). The session itself
 * lives in an HTTP-only cookie the browser sends automatically; this code
 * never sees or stores the token.
 */

export type Role = 'owner' | 'admin' | 'analyst' | 'legal' | 'viewer';

export type Permission =
  | 'organization:read'
  | 'organization:update'
  | 'organization:delete'
  | 'members:read'
  | 'members:manage'
  | 'audit:read'
  | 'brands:read'
  | 'brands:manage'
  | 'findings:read'
  | 'findings:update'
  | 'investigations:manage'
  | 'drafts:review';

export interface Me {
  user: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  role: Role;
  roleLabel: string;
  permissions: Permission[];
}

export interface InvitePreview {
  organizationName: string;
  email: string;
  role: Role;
  roleLabel: string;
  invitedBy: string | null;
  expiresAt: string;
  accountExists: boolean;
}

export const sessionQueryKey = ['session'] as const;

/** The signed-in user, or `null` when nobody is signed in. Errors (e.g. API down) still throw. */
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async (): Promise<Me | null> => {
      try {
        return await apiRequest<Me>('/auth/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });
}

/** For showing or hiding controls only. The API enforces every permission itself. */
export function useCan() {
  const { data } = useSession();
  return (permission: Permission) => data?.permissions.includes(permission) ?? false;
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      sendJson<Me>('/auth/sign-in', input),
    onSuccess: (me) => queryClient.setQueryData(sessionQueryKey, me),
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      password: string;
      organizationName: string;
    }) => sendJson<Me>('/auth/sign-up', input),
    onSuccess: (me) => queryClient.setQueryData(sessionQueryKey, me),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sendJson<{ signedOut: true }>('/auth/sign-out'),
    // Drop every cached private response, then mark the visitor as signed out.
    onSettled: () => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
      queryClient.setQueryData(sessionQueryKey, null);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      sendJson<{ changed: true }>('/auth/change-password', input),
  });
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => apiRequest<InvitePreview>(`/auth/invites/${encodeURIComponent(token)}`),
    staleTime: Infinity,
  });
}

export function useAcceptInvite(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; password: string }) =>
      sendJson<Me>(`/auth/invites/${encodeURIComponent(token)}/accept`, input),
    onSuccess: (me) => queryClient.setQueryData(sessionQueryKey, me),
  });
}

/** Only same-site paths are allowed as a post-sign-in destination (no open redirects). */
export function safeNextPath(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
}
