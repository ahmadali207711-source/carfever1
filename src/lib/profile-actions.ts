'use server';

import { z } from 'zod';
import { createServerClient, createServiceRoleClient } from './supabase/server';
import { revalidatePath } from 'next/cache';

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
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
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data: dbUser, error } = await supabase
    .from('users')
    .select('id, name, email, phone, bio, role, avatar_url, created_at')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !dbUser) throw new Error('Profile not found');

  return {
    ...dbUser,
    auth_email: user.email || dbUser.email,
  };
}

export async function updateProfile(input: {
  name: string;
  phone?: string;
  bio?: string;
}) {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const parsed = UpdateProfileSchema.parse(input);

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient
    .from('users')
    .update({
      name: parsed.name,
      phone: parsed.phone || null,
      bio: parsed.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq('auth_user_id', user.id);

  if (error) throw new Error('Failed to update profile');
  revalidatePath('/admin/settings/profile');
  return { success: true as const };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const parsed = ChangePasswordSchema.parse({ currentPassword, newPassword });

  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !user.email) throw new Error('Not authenticated');

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.currentPassword,
  });

  if (signInError) {
    throw new Error('Current password is incorrect');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.newPassword,
  });

  if (updateError) throw new Error('Failed to update password');
  return { success: true as const };
}

export async function updateEmail(newEmail: string, password: string) {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !user.email) throw new Error('Not authenticated');

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (signInError) throw new Error('Password is incorrect');

  const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });

  if (updateError) throw new Error('Failed to update email');
  return { success: true as const };
}
