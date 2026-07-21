import { cache } from 'react';
import { createServerClient, createServiceRoleClient } from './supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export type SessionUser = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) return null;

    const serviceClient = createServiceRoleClient();
    const { data } = await serviceClient
      .from('users')
      .select('id, auth_user_id, name, email, role, status')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (data) {
      return data as SessionUser;
    }

    return {
      id: user.id,
      auth_user_id: user.id,
      name: user.user_metadata?.name || user.email.split('@')[0],
      email: user.email,
      role: user.user_metadata?.role || 'buyer',
      status: 'active',
    };
  } catch (err) {
    console.error('getSession error:', err);
    return null;
  }
});

export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error || !session) return false;
    return true;
  } catch {
    return false;
  }
}

const ADMIN_ROLES = ['admin', 'content_manager', 'inspection_manager'] as const;

export function isAdminRole(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    redirect('/admin/login');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(['admin']);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }
  return session;
}

export async function requireVerifiedSession(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.status === 'suspended') {
    redirect('/admin/login?error=suspended');
  }
  return session;
}

export async function generateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = randomBytes(32).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60,
  });
  return token;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const stored = cookieStore.get('csrf_token');
    if (!stored) return false;
    const valid = stored.value === token;
    if (valid) {
      cookieStore.delete('csrf_token');
    }
    return valid;
  } catch {
    return false;
  }
}
