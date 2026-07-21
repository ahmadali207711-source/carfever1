'use server';

import { z } from 'zod';
import { createServerClient, createServiceRoleClient } from './supabase/server';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  auth_email: string;
};

export async function getProfile(): Promise<ProfileData> {
  const sessionUser = await getSession();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const serviceClient = createServiceRoleClient();
  let dbUser: any = null;

  if (sessionUser?.id) {
    const { data } = await serviceClient
      .from('users')
      .select('id, name, email, phone, bio, role, avatar_url, created_at')
      .eq('id', sessionUser.id)
      .maybeSingle();
    dbUser = data;
  }

  if (!dbUser && user?.id) {
    const { data } = await serviceClient
      .from('users')
      .select('id, name, email, phone, bio, role, avatar_url, created_at')
      .or(`auth_user_id.eq.${user.id},email.ilike.${user.email}`)
      .maybeSingle();
    dbUser = data;
  }

  if (!dbUser && sessionUser) {
    dbUser = {
      id: sessionUser.id,
      name: sessionUser.name || 'User',
      email: sessionUser.email,
      phone: null,
      bio: null,
      role: sessionUser.role,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
  }

  if (!dbUser) throw new Error('Not authenticated');

  return {
    ...dbUser,
    auth_email: user?.email || dbUser.email || sessionUser?.email || '',
  };
}

export async function updateProfile(input: {
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
}) {
  const sessionUser = await getSession();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!sessionUser && !user) throw new Error('Not authenticated');

  const parsed = UpdateProfileSchema.parse(input);
  const serviceClient = createServiceRoleClient();

  const targetId = sessionUser?.id;
  const authUserId = sessionUser?.auth_user_id || user?.id;
  const targetEmail = sessionUser?.email || user?.email;

  const payload: any = {
    name: parsed.name,
    phone: parsed.phone || null,
    bio: parsed.bio || null,
    updated_at: new Date().toISOString(),
  };

  if (parsed.email && parsed.email.trim() !== '') {
    payload.email = parsed.email.trim();
  }

  if (targetId) {
    const { error } = await serviceClient.from('users').update(payload).eq('id', targetId);
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
  } else if (authUserId) {
    const { error } = await serviceClient.from('users').update(payload).eq('auth_user_id', authUserId);
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
  } else if (targetEmail) {
    const { error } = await serviceClient.from('users').update(payload).ilike('email', targetEmail);
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
  }

  revalidatePath('/admin/settings/profile');
  revalidatePath('/seller/settings/profile');
  return { success: true as const };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const parsed = ChangePasswordSchema.parse({ currentPassword, newPassword });
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && user.email) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.currentPassword,
    });
    if (signInError) throw new Error('Current password is incorrect');

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.newPassword,
    });
    if (updateError) throw new Error(`Failed to update password: ${updateError.message}`);
    return { success: true as const };
  }

  const sessionUser = await getSession();
  if (!sessionUser) throw new Error('Not authenticated');

  const serviceClient = createServiceRoleClient();
  const { data: authUsers } = await serviceClient.auth.admin.listUsers();
  const matched = authUsers?.users?.find(u => u.email?.toLowerCase() === sessionUser.email.toLowerCase());
  if (matched) {
    const { error } = await serviceClient.auth.admin.updateUserById(matched.id, {
      password: parsed.newPassword,
    });
    if (error) throw new Error(`Failed to update password: ${error.message}`);
    return { success: true as const };
  }

  throw new Error('User account not found in Auth system');
}

export async function updateEmail(newEmail: string, password: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sessionUser = await getSession();

  if (!user && !sessionUser) throw new Error('Not authenticated');
  const currentEmail = user?.email || sessionUser?.email;

  if (currentEmail) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password,
    });
    if (signInError) throw new Error('Password is incorrect');
  }

  if (user) {
    const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
    if (updateError) throw new Error(`Failed to update email: ${updateError.message}`);
  }

  const serviceClient = createServiceRoleClient();
  const targetId = sessionUser?.id;
  if (targetId) {
    await serviceClient.from('users').update({ email: newEmail }).eq('id', targetId);
  }

  revalidatePath('/admin/settings/profile');
  revalidatePath('/seller/settings/profile');
  return { success: true as const };
}
