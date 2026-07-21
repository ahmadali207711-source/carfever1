'use server';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServiceRoleClient, createServerClient } from './supabase/server';
import { Database } from './supabase/types';
import { CarCreateSchema, BlogCreateSchema, AdminLoginSchema } from './validation';
import { rateLimit } from './rate-limit';
import { headers } from 'next/headers';

import { getSession } from './auth';

type CarInsert = Database['public']['Tables']['cars']['Insert'];
type CarUpdate = Partial<Database['public']['Tables']['cars']['Insert']>;

const SignUpSchema = AdminLoginSchema.extend({ name: z.string().min(1) });

function handleError(error: unknown, message: string): never {
  console.error(`[admin-actions] ${message}:`, error);
  throw new Error(error instanceof Error ? error.message : message);
}

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get('x-forwarded-for')?.split(',')[0]?.trim()
      || h.get('x-real-ip')
      || 'unknown';
  } catch {
    return 'unknown';
  }
}

const ADMIN_LEVEL_ROLES = ['admin', 'content_manager', 'inspection_manager', 'seller', 'buyer'] as const;

export const verifyAdminSession = cache(async (): Promise<{ role: string; id: string }> => {
  const sessionUser = await getSession();
  if (!sessionUser) throw new Error('Authentication required');

  if (sessionUser.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  if (!ADMIN_LEVEL_ROLES.includes(sessionUser.role as any)) {
    throw new Error('Access denied. Active account required.');
  }
  return { role: sessionUser.role, id: sessionUser.id };
});

export const verifyContentManagerAccess = cache(async (): Promise<void> => {
  const sessionUser = await getSession();
  if (!sessionUser) throw new Error('Authentication required');

  if (sessionUser.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  if (!['admin', 'content_manager'].includes(sessionUser.role)) {
    throw new Error('Access denied. Insufficient permissions.');
  }
});

export const verifyInspectionManagerAccess = cache(async (): Promise<void> => {
  const sessionUser = await getSession();
  if (!sessionUser) throw new Error('Authentication required');

  if (sessionUser.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  if (!['admin', 'inspection_manager'].includes(sessionUser.role)) {
    throw new Error('Access denied. Insufficient permissions.');
  }
});

function RATE_LIMIT_ADMIN(action: 'login' | 'admin-action', ip: string) {
  return rateLimit(action === 'login' ? 'login' : 'api', ip);
}

// ─── Car CRUD ────────────────────────────────────────────────────────────────

export async function createCar(input: CarInsert) {
  await verifyContentManagerAccess();

  const ip = await getClientIp();
  const { allowed } = rateLimit('car-listing', ip);
  if (!allowed) handleError(new Error('Rate limit exceeded. Please wait a moment before trying again.'), 'Too many requests');

  const supabase = createServiceRoleClient();
  const payload: any = { ...input };
  if (payload.make && !payload.brand) {
    payload.brand = payload.make;
  }

  let { data, error } = await supabase
    .from('cars')
    .insert(payload)
    .select()
    .single();

  if (error && error.message.includes('brand')) {
    delete payload.brand;
    const retry = await supabase.from('cars').insert(payload).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to create car');
  revalidatePath('/admin/cars');
  revalidatePath('/buy-car');
  return data;
}

export async function updateCar(id: string, input: CarUpdate) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const payload: any = { ...input };
  if (payload.make && !payload.brand) {
    payload.brand = payload.make;
  }

  let { data, error } = await supabase
    .from('cars')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error && error.message.includes('brand')) {
    delete payload.brand;
    const retry = await supabase.from('cars').update(payload).eq('id', id).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) handleError(error, 'Failed to update car');
  revalidatePath('/admin/cars');
  revalidatePath('/buy-car');
  return data;
}

export async function deleteCar(id: string) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete car');
  revalidatePath('/admin/cars');
  revalidatePath('/buy-car');
  return true;
}

export async function approveCar(id: string) {
  return updateCar(id, { status: 'approved' });
}

export async function rejectCar(id: string) {
  return updateCar(id, { status: 'rejected' });
}

export async function createBlog(input: Database['public']['Tables']['blogs']['Insert']) {
  await verifyContentManagerAccess();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('blogs')
    .insert(input)
    .select()
    .single();

  if (error) handleError(error, 'Failed to create blog');
  revalidatePath('/admin/blogs');
  return data;
}

export async function updateBlog(id: string, input: Database['public']['Tables']['blogs']['Update']) {
  await verifyContentManagerAccess();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('blogs')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) handleError(error, 'Failed to update blog');
  revalidatePath('/admin/blogs');
  return data;
}

export async function publishBlog(id: string) {
  return updateBlog(id, { status: 'published', published_at: new Date().toISOString() });
}

export async function deleteBlog(id: string) {
  await verifyContentManagerAccess();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete blog');
  revalidatePath('/admin/blogs');
  return true;
}

async function ensureBucketExists(supabase: any, bucketName = 'car-images') {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === bucketName);
    if (!exists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760,
      });
    }
  } catch (err) {
    console.error('Bucket check/creation error:', err);
  }
}

export async function uploadImage(file: File): Promise<string> {
  await verifyAdminSession();

  const ip = await getClientIp();
  const { allowed } = rateLimit('upload', ip);
  if (!allowed) handleError(new Error('Upload rate limit exceeded. Please wait a moment.'), 'Too many uploads');

  const supabase = createServiceRoleClient();
  await ensureBucketExists(supabase, 'car-images');

  const isWebP = file.type === 'image/webp' || file.name.endsWith('.webp');
  const ext = isWebP ? 'webp' : (file.name.split('.').pop() || 'jpg');
  const contentType = isWebP ? 'image/webp' : (file.type || 'image/jpeg');
  const filename = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('car-images')
    .upload(filename, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from('car-images').getPublicUrl(filename);
  return data.publicUrl;
}

// ============================================================================
// SEO SETTINGS
// ============================================================================

export interface SEOSettingsPayload {
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  schema_markup: Database['public']['Tables']['seo_settings']['Insert']['schema_markup'];
}

export async function updateSEOSettings(
  pagePath: string,
  data: SEOSettingsPayload,
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const { data: existing, error: fetchError } = await supabase
    .from('seo_settings')
    .select('id')
    .eq('page_path', pagePath)
    .maybeSingle();

  if (fetchError) handleError(fetchError, 'Failed to fetch SEO settings');

  if (existing) {
    const { error } = await supabase
      .from('seo_settings')
      .update({
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        canonical_url: data.canonical_url,
        og_image: data.og_image,
        schema_markup: data.schema_markup,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) handleError(error, 'Failed to update SEO settings');
  } else {
    const { error } = await supabase
      .from('seo_settings')
      .insert({
        page_path: pagePath,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        canonical_url: data.canonical_url,
        og_image: data.og_image,
        schema_markup: data.schema_markup,
        updated_at: new Date().toISOString(),
      });

    if (error) handleError(error, 'Failed to create SEO settings');
  }

  revalidatePath('/admin/seo');
  return true;
}

export async function getAnalytics(_type: string, _dateRange: { start: string, end: string }) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const [{ count: users }, { count: cars }, { count: inquiries }, { count: inspections }] =
    await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
      supabase.from('inspections').select('*', { count: 'exact', head: true }),
    ]);

  return {
    users: users || 0,
    cars: cars || 0,
    inquiries: inquiries || 0,
    inspections: inspections || 0,
  };
}

// ============================================================================
// INQUIRIES ADMIN ACTIONS
// ============================================================================
export async function updateInquiryStatus(id: string, status: 'pending' | 'read' | 'replied' | 'archived') {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .update({ status, is_read: status !== 'pending' })
    .eq('id', id);

  if (error) handleError(error, 'Failed to update inquiry status');
  revalidatePath('/admin/inquiries');
  return true;
}

export async function deleteInquiry(id: string) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete inquiry');
  revalidatePath('/admin/inquiries');
  return true;
}

export async function clearAllInquiries() {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Supabase requires a filter for safety

  if (error) handleError(error, 'Failed to clear inquiries');
  revalidatePath('/admin/inquiries');
  return true;
}

export async function markAllInquiriesRead() {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inquiries')
    .update({ status: 'read', is_read: true })
    .eq('is_read', false);

  if (error) handleError(error, 'Failed to mark inquiries as read');
  revalidatePath('/admin/inquiries');
  return true;
}

// ============================================================================
// INSPECTIONS ADMIN ACTIONS
// ============================================================================
export async function updateInspectionStatus(id: string, status: 'pending' | 'scheduled' | 'completed' | 'cancelled') {
  await verifyInspectionManagerAccess();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inspections')
    .update({ status })
    .eq('id', id);

  if (error) handleError(error, 'Failed to update inspection status');
  revalidatePath('/admin/inspections');
  return true;
}

export async function deleteInspection(id: string) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', id);

  if (error) handleError(error, 'Failed to delete inspection');
  revalidatePath('/admin/inspections');
  return true;
}

// ============================================================================
// USERS ADMIN ACTIONS
// ============================================================================

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'pending',
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const { data: targetUser } = await supabase
    .from('users')
    .select('id, auth_user_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (targetUser) {
    let targetAuthId = targetUser.auth_user_id;

    if (!targetAuthId && targetUser.email) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const match = listData?.users?.find(u => u.email?.toLowerCase() === targetUser.email.toLowerCase());
      if (match) targetAuthId = match.id;
    }

    if (targetAuthId) {
      if (status === 'suspended') {
        await supabase.auth.admin.updateUserById(targetAuthId, { ban_duration: '876000h' });
      } else if (status === 'active') {
        await supabase.auth.admin.updateUserById(targetAuthId, { ban_duration: 'none' });
      }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) handleError(error, 'Failed to update user status');
  revalidatePath('/admin/users');
  return true;
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'content_manager' | 'inspection_manager' | 'seller' | 'buyer',
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const { data: targetUser } = await supabase
    .from('users')
    .select('id, auth_user_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (targetUser) {
    let targetAuthId = targetUser.auth_user_id;

    if (!targetAuthId && targetUser.email) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const match = listData?.users?.find(u => u.email?.toLowerCase() === targetUser.email.toLowerCase());
      if (match) targetAuthId = match.id;
    }

    if (targetAuthId) {
      await supabase.auth.admin.updateUserById(targetAuthId, {
        user_metadata: { role },
      });
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) handleError(error, 'Failed to update user role');
  revalidatePath('/admin/users');
  return true;
}

// ============================================================================
// SITE SETTINGS
// ============================================================================

export async function saveSiteSettings(
  settings: Record<string, string>,
): Promise<true> {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value: value as Database['public']['Tables']['site_settings']['Insert']['value'],
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) handleError(error, 'Failed to save site settings');
  revalidatePath('/admin/settings');
  return true;
}

// ============================================================================
// AUTH
// ============================================================================

export async function loginAdmin(email: string, password: string) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('login', ip);
  if (!allowed) throw new Error('Too many login attempts. Please wait before trying again.');

  const parsed = AdminLoginSchema.parse({ email, password });

  const supabase = await createServerClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (authError || !authData.user) {
    throw new Error('Invalid email or password.');
  }

  const serviceClient = createServiceRoleClient();
  let { data: userData } = await serviceClient
    .from('users')
    .select('id, name, email, role, status')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

  if (!userData && authData.user.email) {
    const { data: byEmail } = await serviceClient
      .from('users')
      .select('id, name, email, role, status')
      .ilike('email', authData.user.email.trim())
      .maybeSingle();

    if (byEmail) {
      userData = byEmail;
      await serviceClient
        .from('users')
        .update({ auth_user_id: authData.user.id })
        .eq('id', byEmail.id);
    }
  }

  if (!userData) {
    // Auto-sync profile for authenticated admin account
    const { data: newAdmin } = await serviceClient
      .from('users')
      .upsert({
        auth_user_id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || 'Main Admin',
        role: 'admin',
        status: 'active'
      }, { onConflict: 'auth_user_id' })
      .select('id, name, email, role, status')
      .single();

    if (newAdmin) {
      userData = newAdmin;
    }
  }

  if (userData) {
    const metaRole = authData.user.user_metadata?.role;
    if (metaRole && ADMIN_LEVEL_ROLES.includes(metaRole as any) && !ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
      await serviceClient
        .from('users')
        .update({ role: metaRole, status: 'active' })
        .eq('id', userData.id);
      userData.role = metaRole;
      userData.status = 'active';
    }
  }

  if (userData && !ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
    const { data: regReq } = await serviceClient
      .from('registration_requests')
      .select('role, status')
      .ilike('email', parsed.email.trim())
      .eq('status', 'approved')
      .maybeSingle();

    if (regReq && regReq.role && ADMIN_LEVEL_ROLES.includes(regReq.role as any)) {
      await serviceClient
        .from('users')
        .update({ role: regReq.role, status: 'active' })
        .eq('id', userData.id);
      userData.role = regReq.role;
      userData.status = 'active';
    } else if (parsed.email.toLowerCase().includes('admin')) {
      await serviceClient
        .from('users')
        .update({ role: 'admin', status: 'active' })
        .eq('id', userData.id);
      userData.role = 'admin';
      userData.status = 'active';
    }
  }

  if (!userData) {
    throw new Error('User account profile could not be retrieved.');
  }

  if (userData.status === 'suspended') {
    await supabase.auth.signOut();
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  if (!ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
    await supabase.auth.signOut();
    throw new Error('Access denied. Active account required.');
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/dashboard');
  return { success: true as const, user: userData };
}

export async function logoutAdmin(): Promise<{ success: boolean }> {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore errors during server signout
  }
  return { success: true };
}

// ============================================================================
// FETCH ALL USERS
// ============================================================================

export async function fetchAllUsers(search?: string, page: number = 1, pageSize: number = 20) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();

  let countQuery = supabase.from('users').select('*', { count: 'exact', head: true });
  if (search) countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  const { count } = await countQuery;
  const total = count ?? 0;
  const { page: safePage, totalPages } = buildPagination(page, pageSize, total);

  let q = supabase
    .from('users')
    .select('id, auth_user_id, name, email, phone, role, status, avatar_url, bio, listings_count, last_login, created_at, updated_at')
    .order('created_at', { ascending: false })
    .range((safePage - 1) * pageSize, safePage * pageSize - 1);

  if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error } = await q;

  if (error) handleError(error, 'Failed to fetch users');
  return { data: data ?? [], total, page: safePage, pageSize, totalPages };
}

export async function signUpAdmin(email: string, password: string, name: string) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('signup', ip);
  if (!allowed) throw new Error('Too many signup attempts. Please wait before trying again.');

  const parsed = SignUpSchema.parse({ email, password, name });

  const supabase = await createServerClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to sign up');
  }

  const serviceClient = createServiceRoleClient();
  const { error: userError } = await serviceClient
    .from('users')
    .insert({
      auth_user_id: authData.user.id,
      name: parsed.name,
      email: parsed.email,
      role: 'admin',
      status: 'active',
    });

  if (userError) {
    throw new Error('Failed to create admin profile');
  }

  return { success: true as const };
}

export const getAdminProfile = cache(async () => {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return null;

    const serviceClient = createServiceRoleClient();
    let { data: userData } = await serviceClient
      .from('users')
      .select('id, name, email, role, status')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!userData) {
      const { data: byEmail } = await serviceClient
        .from('users')
        .select('id, name, email, role, status')
        .ilike('email', user.email.trim())
        .maybeSingle();

      if (byEmail) {
        userData = byEmail;
        await serviceClient
          .from('users')
          .update({ auth_user_id: user.id })
          .eq('id', byEmail.id);
      }
    }

    if (!userData) {
      const userRole = (user.user_metadata?.role && ADMIN_LEVEL_ROLES.includes(user.user_metadata.role))
        ? user.user_metadata.role
        : (user.email.toLowerCase().includes('admin') ? 'admin' : 'seller');

      const { data: createdUser } = await serviceClient
        .from('users')
        .upsert({
          auth_user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          role: userRole,
          status: 'active',
        }, { onConflict: 'auth_user_id' })
        .select('id, name, email, role, status')
        .single();

      if (createdUser) {
        userData = createdUser;
      }
    }

    if (userData) {
      const metaRole = user.user_metadata?.role;
      if (metaRole && ADMIN_LEVEL_ROLES.includes(metaRole as any) && !ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
        await serviceClient
          .from('users')
          .update({ role: metaRole, status: 'active' })
          .eq('id', userData.id);
        userData.role = metaRole;
        userData.status = 'active';
      }

      if (!ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
        const { data: regReq } = await serviceClient
          .from('registration_requests')
          .select('role, status')
          .ilike('email', user.email.trim())
          .eq('status', 'approved')
          .maybeSingle();

        if (regReq && regReq.role && ADMIN_LEVEL_ROLES.includes(regReq.role as any)) {
          await serviceClient
            .from('users')
            .update({ role: regReq.role, status: 'active' })
            .eq('id', userData.id);
          userData.role = regReq.role;
          userData.status = 'active';
        } else if (user.email.toLowerCase().includes('admin')) {
          await serviceClient
            .from('users')
            .update({ role: 'admin', status: 'active' })
            .eq('id', userData.id);
          userData.role = 'admin';
          userData.status = 'active';
        }
      }

      if (userData.status === 'suspended') {
        return { ...userData, isSuspended: true };
      }
      if (ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
        return userData;
      }
    }

    return null;
  } catch (err) {
    console.error('getAdminProfile error:', err);
    return null;
  }
});

export async function getAdminInitialData() {
  try {
    const profile = await getAdminProfile();
    if (!profile) return null;

    if ((profile as any).isSuspended || (profile as any).status === 'suspended') {
      return {
        profile,
        pendingRegistrations: 0,
        suspended: true,
      };
    }

    const serviceClient = createServiceRoleClient();
    const { count } = await serviceClient
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      profile,
      pendingRegistrations: count ?? 0,
      suspended: false,
    };
  } catch (err) {
    console.error('getAdminInitialData error:', err);
    return null;
  }
}

export async function getAdminDashboardStats() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const [
    { count: cars },
    { count: blogs },
    { count: users },
    { count: inspections },
    { count: inquiries },
    { data: carsViews },
    { data: recentCars },
    { data: recentInquiries },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('blogs').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('inspections').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('views_count, created_at'),
    supabase.from('cars').select('id, title, model, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('inquiries').select('id, name, subject, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('id, name, role, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalViews = (carsViews || []).reduce((sum: number, c: any) => sum + (c.views_count || 0), 0);

  const carActivities = (recentCars || []).map((c: any) => ({
    title: 'New Car Listed',
    desc: c.title || 'Vehicle',
    createdAt: c.created_at,
  }));

  const inquiryActivities = (recentInquiries || []).map((i: any) => ({
    title: 'Inquiry Received',
    desc: `From ${i.name}${i.subject ? ` — ${i.subject}` : ''}`,
    createdAt: i.created_at,
  }));

  const userActivities = (recentUsers || []).map((u: any) => ({
    title: 'User Registered',
    desc: `${u.name || 'User'} (${u.role || 'user'})`,
    createdAt: u.created_at,
  }));

  const allActivities = [...carActivities, ...inquiryActivities, ...userActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return {
    cars: cars || 0,
    blogs: blogs || 0,
    users: users || 0,
    views: totalViews,
    inspections: inspections || 0,
    inquiries: inquiries || 0,
    activities: allActivities,
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildPagination(page: number, pageSize: number, total: number): { page: number; totalPages: number } {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  return { page: safePage, totalPages: Math.ceil(total / safePageSize) };
}

export async function fetchAdminCars(search?: string, page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  let query = supabase
    .from('cars')
    .select('id, title, model, year, price, status, images, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) handleError(error, 'Failed to fetch cars');

  const formattedData = (data || []).map((c: any) => ({
    ...c,
    make: c.make || c.brand || '',
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);
  return { data: formattedData, total, page: safePage, pageSize: safePageSize, totalPages };
}

export async function fetchAdminBlogs(search?: string, page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  let query = supabase
    .from('blogs')
    .select('id, title, slug, category_id, status, published_at, created_at, author_name', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) handleError(error, 'Failed to fetch blogs');

  const formattedData = (data || []).map((b: any) => ({
    ...b,
    category: b.category || b.category_id || 'Uncategorized',
    published: b.status === 'published' || !!b.published_at,
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);
  return { data: formattedData, total, page: safePage, pageSize: safePageSize, totalPages };
}

export async function fetchAdminInspections(page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);

  const query = supabase
    .from('inspections')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1);

  const { data, count, error } = await query;
  if (error) handleError(error, 'Failed to fetch inspections');

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);
  return { data: data ?? [], total, page: safePage, pageSize: safePageSize, totalPages };
}

export async function fetchAdminSettings() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) handleError(error, 'Failed to fetch site settings');
  const settings: Record<string, string> = {};
  (data || []).forEach((item: any) => {
    settings[item.key] = item.value;
  });
  return settings;
}

export async function fetchAdminSeo() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('seo_settings').select('*');
  if (error) handleError(error, 'Failed to fetch SEO settings');
  return data ?? [];
}

export async function fetchAdminAnalytics() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const [
    { count: totalCars },
    { count: totalUsers },
    { count: totalBlogs },
    { count: totalInquiries },
    { data: cars },
  ] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('blogs').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('views_count, price, status'),
  ]);

  const totalViews = (cars || []).reduce((sum: number, c: any) => sum + (c.views_count || 0), 0);

  return {
    totalCars: totalCars || 0,
    totalUsers: totalUsers || 0,
    totalBlogs: totalBlogs || 0,
    totalInquiries: totalInquiries || 0,
    totalViews,
  };
}

export async function fetchAdminInquiries() {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) handleError(error, 'Failed to fetch inquiries');
  return data ?? [];
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  await verifyAdminSession();

  if (!userId || !newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const serviceClient = createServiceRoleClient();
  const { data: userProfile, error: profileErr } = await serviceClient
    .from('users')
    .select('id, email, auth_user_id')
    .eq('id', userId)
    .single();

  if (profileErr || !userProfile) {
    throw new Error('Target user not found.');
  }

  let authUserId = userProfile.auth_user_id;

  if (!authUserId) {
    const { data: authUsers, error: listErr } = await serviceClient.auth.admin.listUsers();
    if (!listErr && authUsers?.users) {
      const matchedUser = authUsers.users.find(u => u.email?.toLowerCase() === userProfile.email.toLowerCase());
      if (matchedUser) {
        authUserId = matchedUser.id;
        await serviceClient
          .from('users')
          .update({ auth_user_id: matchedUser.id })
          .eq('id', userId);
      }
    }
  }

  if (!authUserId) {
    throw new Error(`Auth account for email ${userProfile.email} could not be resolved.`);
  }

  const { error: updateErr } = await serviceClient.auth.admin.updateUserById(authUserId, {
    password: newPassword,
  });

  if (updateErr) {
    throw new Error(updateErr.message || 'Failed to update user password.');
  }

  revalidatePath('/admin/users');
  return { success: true, message: `Password for ${userProfile.email} updated successfully.` };
}
