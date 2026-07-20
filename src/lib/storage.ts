export interface CarListingSubmission {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: string;
  transmission: string;
  fuel: string;
  color: string;
  price: string;
  condition: string;
  city: string;
  description: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  sellerName: string;
  sellerEmail: string;
  dateAdded: string;
}

export interface InspectionBooking {
  id: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  address: string;
  plan: 'basic' | 'standard' | 'premium';
  planPrice: number;
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  customerEmail: string;
  dateBooked: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

const SEED_CARS: CarListingSubmission[] = [
  {
    id: "CAR-101",
    make: "Toyota",
    model: "Corolla GLi",
    year: 2023,
    mileage: "12,000 km",
    transmission: "Manual",
    fuel: "Petrol",
    color: "Silver",
    price: "PKR 45.5 Lacs",
    condition: "Excellent",
    city: "Lahore",
    description: "Meticulously maintained first-owner Corolla GLi. Bumper to bumper genuine.",
    images: ["https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=300&q=80"],
    status: "approved",
    sellerName: "Zeeshan Ahmed",
    sellerEmail: "zeeshan.ahmed@gmail.com",
    dateAdded: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "CAR-102",
    make: "Honda",
    model: "Civic Oriel",
    year: 2022,
    mileage: "24,000 km",
    transmission: "Automatic",
    fuel: "Petrol",
    color: "Black",
    price: "PKR 68.0 Lacs",
    condition: "Good",
    city: "Islamabad",
    description: "Fully loaded Civic Oriel. Sunroof, leather seats, and android panel installed.",
    images: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=300&q=80"],
    status: "pending",
    sellerName: "Usman Raza",
    sellerEmail: "usman.raza@yahoo.com",
    dateAdded: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "CAR-103",
    make: "KIA",
    model: "Sportage AWD",
    year: 2024,
    mileage: "4,500 km",
    transmission: "Automatic",
    fuel: "Petrol",
    color: "White",
    price: "PKR 92.5 Lacs",
    condition: "Like New",
    city: "Karachi",
    description: "Brand new KIA Sportage AWD. Panoramic sunroof. Zero scratch.",
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80"],
    status: "approved",
    sellerName: "Sarah Khan",
    sellerEmail: "sarah.khan@gmail.com",
    dateAdded: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const SEED_INSPECTIONS: InspectionBooking[] = [
  {
    id: "INS-201",
    make: "Suzuki",
    model: "Swift DLX",
    year: 2021,
    registrationNumber: "LE-21-4560",
    address: "House 45, Street 3, Sector Y, DHA Phase 3, Lahore",
    plan: "standard",
    planPrice: 5500,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    timeSlot: "11:00 AM - 01:00 PM",
    customerName: "Imran Abbas",
    customerPhone: "+92 300 4567890",
    status: "scheduled",
    customerEmail: "imran.abbas@gmail.com",
    dateBooked: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "INS-202",
    make: "Toyota",
    model: "Fortuner V",
    year: 2023,
    registrationNumber: "ICT-FT-778",
    address: "Apartment B-12, Centaurus Residencia, F-8, Islamabad",
    plan: "premium",
    planPrice: 8500,
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: "03:00 PM - 05:00 PM",
    customerName: "Faisal Qureshi",
    customerPhone: "+92 321 9876543",
    status: "pending",
    customerEmail: "faisal.q@yahoo.com",
    dateBooked: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "INS-203",
    make: "Hyundai",
    model: "Tucson GLS",
    year: 2022,
    registrationNumber: "K-TUC-990",
    address: "Plot 120, Lane 4, Phase 5, DHA, Karachi",
    plan: "basic",
    planPrice: 3500,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    timeSlot: "09:00 AM - 11:00 AM",
    customerName: "Maria Malik",
    customerPhone: "+92 333 1122334",
    status: "completed",
    customerEmail: "maria.malik@outlook.com",
    dateBooked: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

const SEED_INQUIRIES: Inquiry[] = [
  {
    id: "INQ-301",
    name: "Zeeshan Ahmed",
    email: "zeeshan.ahmed@gmail.com",
    phone: "+92 300 8765432",
    subject: "Civic RS Negotiation",
    message: "Assalam o Alaikum, is the price of Honda Civic RS Turbo negotiable? I am planning to inspect the car this weekend. Please coordinate with the owner and let me know.",
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: false,
  },
  {
    id: "INQ-302",
    name: "Hina Parveen",
    email: "hina.parveen@outlook.com",
    phone: "+92 321 4567890",
    subject: "Premium Inspection Query",
    message: "Hi, I would like to book a premium inspection service for a Suzuki Swift in Lahore DHA Phase 6. Can you confirm if your inspectors are available on Sunday afternoon?",
    date: new Date(Date.now() - 3600000 * 18).toISOString(),
    read: false,
  },
  {
    id: "INQ-303",
    name: "Kamran Malik",
    email: "kamran.malik@hotmail.com",
    phone: "+92 333 5566778",
    subject: "Listing Image Upload Issue",
    message: "I am trying to upload pictures for my Toyota Fortuner listing but the page shows a warning. The images are below 5MB. Can you help me post the listing manually?",
    date: new Date(Date.now() - 3600000 * 30).toISOString(),
    read: true,
  },
];

// Helper to check localStorage presence
const isClient = typeof window !== 'undefined';

export function getCarListings(): CarListingSubmission[] {
  if (!isClient) return [];
  const stored = localStorage.getItem('cf_car_listings');
  if (!stored) {
    // Seed and return seed data on first retrieval
    localStorage.setItem('cf_car_listings', JSON.stringify(SEED_CARS));
    return SEED_CARS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveCarListing(listing: CarListingSubmission): void {
  if (!isClient) return;
  const listings = getCarListings();
  listings.unshift(listing); // newest first
  localStorage.setItem('cf_car_listings', JSON.stringify(listings));
}

export function updateCarListing(id: string, updates: Partial<CarListingSubmission>): void {
  if (!isClient) return;
  const listings = getCarListings();
  const index = listings.findIndex(l => l.id === id);
  if (index !== -1) {
    listings[index] = { ...listings[index], ...updates };
    localStorage.setItem('cf_car_listings', JSON.stringify(listings));
  }
}

export function getInspectionBookings(): InspectionBooking[] {
  if (!isClient) return [];
  const stored = localStorage.getItem('cf_inspection_bookings');
  if (!stored) {
    localStorage.setItem('cf_inspection_bookings', JSON.stringify(SEED_INSPECTIONS));
    return SEED_INSPECTIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveInspectionBooking(booking: InspectionBooking): void {
  if (!isClient) return;
  const bookings = getInspectionBookings();
  bookings.unshift(booking);
  localStorage.setItem('cf_inspection_bookings', JSON.stringify(bookings));
}

export function updateInspectionBooking(id: string, updates: Partial<InspectionBooking>): void {
  if (!isClient) return;
  const bookings = getInspectionBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    bookings[index] = { ...bookings[index], ...updates };
    localStorage.setItem('cf_inspection_bookings', JSON.stringify(bookings));
  }
}

export function getInquiries(): Inquiry[] {
  if (!isClient) return [];
  const stored = localStorage.getItem('cf_inquiries');
  if (!stored) {
    localStorage.setItem('cf_inquiries', JSON.stringify(SEED_INQUIRIES));
    return SEED_INQUIRIES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveInquiry(inquiry: Inquiry): void {
  if (!isClient) return;
  const inquiries = getInquiries();
  inquiries.unshift(inquiry);
  localStorage.setItem('cf_inquiries', JSON.stringify(inquiries));
}

export function updateInquiry(id: string, updates: Partial<Inquiry>): void {
  if (!isClient) return;
  const inquiries = getInquiries();
  const index = inquiries.findIndex(i => i.id === id);
  if (index !== -1) {
    inquiries[index] = { ...inquiries[index], ...updates };
    localStorage.setItem('cf_inquiries', JSON.stringify(inquiries));
  }
}

export function deleteInquiry(id: string): void {
  if (!isClient) return;
  const inquiries = getInquiries();
  const filtered = inquiries.filter(i => i.id !== id);
  localStorage.setItem('cf_inquiries', JSON.stringify(filtered));
}

export function clearAllData(): void {
  if (!isClient) return;
  localStorage.removeItem('cf_car_listings');
  localStorage.removeItem('cf_inspection_bookings');
  localStorage.removeItem('cf_inquiries');
}

export function seedTestData(): void {
  if (!isClient) return;
  localStorage.setItem('cf_car_listings', JSON.stringify(SEED_CARS));
  localStorage.setItem('cf_inspection_bookings', JSON.stringify(SEED_INSPECTIONS));
  localStorage.setItem('cf_inquiries', JSON.stringify(SEED_INQUIRIES));
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE STORAGE HELPERS
// These run CLIENT-SIDE (browser) using the public anon-key Supabase client.
// Heavy uploads (sell-car wizard) should use the server action in actions.ts
// which uses the service-role key instead.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url === 'placeholder' || key === 'placeholder') {
    throw new Error('Supabase environment variables are not configured.');
  }
  return createClient(url, key);
}

/**
 * Upload an array of File objects to the `car-images` Supabase Storage bucket.
 * @param carId   Used as the folder prefix for the uploaded files.
 * @param files   Array of File objects to upload.
 * @returns       Array of public URLs for the successfully uploaded images.
 */
export async function uploadCarImages(
  carId: string,
  files: File[]
): Promise<string[]> {
  const supabase = getPublicSupabase();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${carId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('car-images')
      .upload(path, file, { upsert: false, cacheControl: '3600' });

    if (error) {
      console.error('uploadCarImages: upload failed for', file.name, error.message);
      continue;
    }

    const { data } = supabase.storage.from('car-images').getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

/**
 * Delete car images from Supabase Storage by their public URLs.
 * Extracts the storage path from each URL automatically.
 * @param urls  Array of public Supabase storage URLs to delete.
 */
export async function deleteCarImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  const supabase = getPublicSupabase();

  // Extract paths like "car-images/listings/1234-abc.jpg" from public URLs
  const paths = urls.map((url) => {
    const match = url.match(/car-images\/(.+)$/);
    return match ? match[1] : null;
  }).filter(Boolean) as string[];

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from('car-images').remove(paths);
  if (error) {
    console.error('deleteCarImages: deletion failed:', error.message);
  }
}

