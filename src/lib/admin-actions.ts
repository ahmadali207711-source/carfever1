'use server';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServiceRoleClient, createServerClient } from './supabase/server';
import { Database } from './supabase/types';
import { CarCreateSchema, BlogCreateSchema, AdminLoginSchema } from './validation';
import { rateLimit } from './rate-limit';
import { headers } from 'next/headers';

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

const ADMIN_LEVEL_ROLES = ['admin', 'content_manager', 'inspection_manager'] as const;

async function verifyRoleAccess(allowedRoles: string[]): Promise<{ role: string; id: string }> {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Authentication required');

  const serviceClient = createServiceRoleClient();
  const { data: dbUser } = await serviceClient
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!dbUser || !allowedRoles.includes(dbUser.role)) {
    throw new Error('Access denied. Insufficient permissions.');
  }
  return { role: dbUser.role, id: dbUser.id };
}

export async function verifyAdminSession(): Promise<{ role: string; id: string }> {
  return verifyRoleAccess(Array.from(ADMIN_LEVEL_ROLES));
}

async function verifyContentManagerAccess(): Promise<void> {
  await verifyRoleAccess(['admin', 'content_manager']);
}

async function verifyInspectionManagerAccess(): Promise<void> {
  await verifyRoleAccess(['admin', 'inspection_manager']);
}

function RATE_LIMIT_ADMIN(action: 'login' | 'admin-action', ip: string) {
  return rateLimit(action === 'login' ? 'login' : 'api', ip);
}

// ─── Car CRUD ────────────────────────────────────────────────────────────────

export async function createCar(input: CarInsert) {
  await verifyContentManagerAccess();

  const ip = await getClientIp();
  const { allowed } = rateLimit('car-listing', ip);
  if (!allowed) handleError(new Error('rate_limited'), 'Too many requests');

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('cars')
    .insert(input)
    .select()
    .single();

  if (error) handleError(error, 'Failed to create car');
  revalidatePath('/admin/cars');
  revalidatePath('/buy-car');
  return data;
}

export async function updateCar(id: string, input: CarUpdate) {
  await verifyAdminSession();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('cars')
    .update(input)
    .eq('id', id)
    .select()
    .single();

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

export async function uploadImage(file: File): Promise<string> {
  await verifyAdminSession();

  const ip = await getClientIp();
  const { allowed } = rateLimit('upload', ip);
  if (!allowed) handleError(new Error('rate_limited'), 'Too many uploads');

  const supabase = createServiceRoleClient();

  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `admin/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('car-images')
    .upload(filename, buffer, { contentType: file.type || 'image/jpeg', upsert: false });

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
    .select('id, name, email, role')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

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
      .select('id, name, email, role')
      .single();

    if (newAdmin) {
      userData = newAdmin;
    }
  }

  if (!userData) {
    throw new Error('Admin account profile could not be retrieved.');
  }

  if (!ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
    throw new Error('Access denied. Admin or manager role required.');
  }

  return { success: true as const, user: userData };
}

export async function logoutAdmin(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/admin/login');
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
    if (!user) return null;

    const serviceClient = createServiceRoleClient();
    const { data: userData } = await serviceClient
      .from('users')
      .select('id, name, email, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userData && ADMIN_LEVEL_ROLES.includes(userData.role as any)) {
      return userData;
    }

    return null;
  } catch (err) {
    console.error('getAdminProfile error:', err);
    return null;
  }
});

export async function getAdminInitialData() {
  const profile = await getAdminProfile();
  if (!profile) return null;

  const serviceClient = createServiceRoleClient();
  const { count } = await serviceClient
    .from('registration_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    profile,
    pendingRegistrations: count ?? 0,
  };
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
    supabase.from('cars').select('id, title, make, model, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('inquiries').select('id, name, subject, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('id, name, role, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalViews = (carsViews || []).reduce((sum: number, c: any) => sum + (c.views_count || 0), 0);

  const carActivities = (recentCars || []).map((c: any) => ({
    title: 'New Car Listed',
    desc: `${c.title || (c.make ? `${c.make} ${c.model}` : 'Vehicle')}`,
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

  let countQuery = supabase.from('cars').select('*', { count: 'exact', head: true });
  if (search) countQuery = countQuery.ilike('title', `%${search}%`);
  const { count } = await countQuery;
  const total = count ?? 0;
  const { page: safePage, totalPages } = buildPagination(page, pageSize, total);

  let q = supabase
    .from('cars')
    .select('id, title, make, model, year, price, status, images, created_at')
    .order('created_at', { ascending: false })
    .range((safePage - 1) * pageSize, safePage * pageSize - 1);

  if (search) q = q.ilike('title', `%${search}%`);
  const { data, error } = await q;
  if (error) handleError(error, 'Failed to fetch cars');
  return { data: data ?? [], total, page: safePage, pageSize, totalPages };
}

export async function fetchAdminBlogs(search?: string, page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  let countQuery = supabase.from('blogs').select('*', { count: 'exact', head: true });
  if (search) countQuery = countQuery.ilike('title', `%${search}%`);
  const { count } = await countQuery;
  const total = count ?? 0;
  const { page: safePage, totalPages } = buildPagination(page, pageSize, total);

  let q = supabase
    .from('blogs')
    .select('id, title, slug, category, published, created_at, author_name')
    .order('created_at', { ascending: false })
    .range((safePage - 1) * pageSize, safePage * pageSize - 1);

  if (search) q = q.ilike('title', `%${search}%`);
  const { data, error } = await q;
  if (error) handleError(error, 'Failed to fetch blogs');
  return { data: data ?? [], total, page: safePage, pageSize, totalPages };
}

export async function fetchAdminInspections(page: number = 1, pageSize: number = 15) {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const { count } = await supabase
    .from('inspections')
    .select('*', { count: 'exact', head: true });
  const total = count ?? 0;
  const { page: safePage, totalPages } = buildPagination(page, pageSize, total);

  const { data, error } = await supabase
    .from('inspections')
    .select('*, car:cars(title, make, year)')
    .order('created_at', { ascending: false })
    .range((safePage - 1) * pageSize, safePage * pageSize - 1);

  if (error) handleError(error, 'Failed to fetch inspections');
  return { data: data ?? [], total, page: safePage, pageSize, totalPages };
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
