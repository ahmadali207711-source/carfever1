'use server';

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession, type SessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { CarListingSchema, InquirySchema, InspectionBookingSchema } from './validation';
import { rateLimit } from './rate-limit';
import { headers } from 'next/headers';

export async function getCurrentUserProfileAction(): Promise<SessionUser | null> {
  return await getSession();
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchCarsFilters {
  make?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  year?: number | null;
  fuelType?: string | null;
  search?: string | null;
  sortBy?: 'price-asc' | 'price-desc' | 'year-desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface FetchCarsResult {
  cars: ApprovedCar[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApprovedCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  color: string | null;
  city: string | null;
  images: string[];
  description: string | null;
  features: string[];
  slug: string | null;
  condition: string | null;
  is_featured: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// FETCH APPROVED CARS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchApprovedCars(
  filters: FetchCarsFilters = {}
): Promise<FetchCarsResult> {
  const {
    make,
    minPrice,
    maxPrice,
    year,
    fuelType,
    search,
    sortBy = 'newest',
    page = 1,
    limit = 6,
  } = filters;

  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('cars')
      .select('id, title, make, model, year, price, currency, mileage, fuel_type, transmission, color, exterior_color, city, description, features, images, slug, condition, is_featured, created_at', { count: 'exact' })
      .eq('status', 'approved');

    if (make) query = query.ilike('make', `%${make}%`);
    if (minPrice != null) query = query.gte('price', minPrice);
    if (maxPrice != null) query = query.lte('price', maxPrice);
    if (year) query = query.eq('year', year);
    if (fuelType) query = query.ilike('fuel_type', `%${fuelType}%`);
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`
      );
    }

    switch (sortBy) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'year-desc':
        query = query.order('year', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('fetchApprovedCars error:', error.message);
      return { cars: [], total: 0, page, totalPages: 0 };
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      cars: (data ?? []) as unknown as ApprovedCar[],
      total,
      page,
      totalPages,
    };
  } catch (err) {
    console.error('fetchApprovedCars exception:', err);
    return { cars: [], total: 0, page, totalPages: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT CAR LISTING
// ─────────────────────────────────────────────────────────────────────────────

export async function submitCarListing(formData: {
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  engineCapacity: string;
  city: string;
  price: string;
  sellerName: string;
  sellerPhone: string;
  description: string;
  images?: string[];
}) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('car-listing', ip);
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  try {
    const parsed = CarListingSchema.parse(formData);
    const supabase = createServiceRoleClient();

    const priceLacs = parseFloat(parsed.price);
    const pricePKR = Math.round(priceLacs * 100000);
    const title = `${parsed.year} ${parsed.make} ${parsed.model}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-6);

    const imageUrls = parsed.images && parsed.images.length > 0
      ? parsed.images
      : ['https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80'];

    const insertPayload: any = {
      title,
      slug,
      make: parsed.make,
      brand: parsed.make,
      model: parsed.model,
      year: parseInt(parsed.year),
      price: pricePKR,
      currency: 'PKR',
      mileage: parsed.mileage ? parseInt(parsed.mileage) : null,
      transmission: parsed.transmission.charAt(0).toUpperCase() + parsed.transmission.slice(1),
      fuel_type: parsed.fuelType.charAt(0).toUpperCase() + parsed.fuelType.slice(1),
      city: parsed.city,
      description: parsed.description || `${title} for sale.`,
      images: imageUrls,
      image_url: imageUrls[0],
      features: [],
      status: 'pending',
      seller_name: parsed.sellerName || null,
      seller_phone: parsed.sellerPhone || null,
    };

    let { data, error } = await supabase
      .from('cars')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error && error.message.includes('brand')) {
      delete insertPayload.brand;
      const retry = await supabase.from('cars').insert(insertPayload).select('id').single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);

    revalidatePath('/admin/cars');
    revalidatePath('/buy-car');

    return { success: true, carId: data?.id || '' };
  } catch (err: any) {
    console.error('submitCarListing error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit car listing',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT INQUIRY
// ─────────────────────────────────────────────────────────────────────────────

export async function submitInquiry(formData: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  carId?: string;
}) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('inquiry', ip);
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  try {
    const parsed = InquirySchema.parse(formData);
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        subject: parsed.subject,
        message: parsed.message,
        car_id: parsed.carId || null,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/admin/inquiries');

    return { success: true, inquiryId: data.id };
  } catch (err) {
    console.error('submitInquiry error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit inquiry',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT INSPECTION BOOKING
// ─────────────────────────────────────────────────────────────────────────────

export async function submitInspectionBooking(formData: {
  make: string;
  model: string;
  year: string;
  registrationNumber: string;
  address: string;
  plan: 'basic' | 'standard' | 'premium';
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}) {
  const ip = await getClientIp();
  const { allowed } = rateLimit('inspection', ip);
  if (!allowed) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  const planPrices = { basic: 3500, standard: 5500, premium: 8500 };

  try {
    const parsed = InspectionBookingSchema.parse(formData);
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        make: parsed.make,
        model: parsed.model,
        year: parseInt(parsed.year),
        registration_number: parsed.registrationNumber,
        address: parsed.address,
        plan: parsed.plan,
        plan_price: planPrices[parsed.plan],
        scheduled_date: parsed.date,
        time_slot: parsed.timeSlot,
        customer_name: parsed.customerName,
        customer_phone: parsed.customerPhone,
        customer_email: parsed.customerEmail || null,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/admin/inspections');

    return { success: true, inspectionId: data.id };
  } catch (err) {
    console.error('submitInspectionBooking error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit inspection booking',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH SINGLE CAR BY ID & INCREMENT VIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function getCarById(id: string): Promise<ApprovedCar | null> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    const carData = data as any;
    if (carData && !carData.make && carData.brand) {
      carData.make = carData.brand;
    }
    return carData as ApprovedCar;
  } catch (err) {
    console.error('getCarById exception:', err);
    return null;
  }
}

export async function incrementCarViews(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.rpc('increment_car_views', { car_id: id });
  } catch (err) {
    console.error('incrementCarViews error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC NEW USER
// ─────────────────────────────────────────────────────────────────────────────

export async function syncUserToDatabase(user: {
  name: string;
  email: string;
  role: 'buyer' | 'seller';
}) {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        email: user.email,
        role: user.role,
        status: 'active',
      });

    if (error) throw error;
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    console.error('syncUserToDatabase error:', err);
    return { success: false };
  }
}
