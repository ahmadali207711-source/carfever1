import type { DbCar } from "@/lib/supabase/types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80";

export type HomeCarCard = {
  id: string;
  title: string;
  priceDisplay: string;
  year: number;
  mileage: string;
  fuel: string;
  location: string;
  image: string;
  badge?: string;
  dealer?: {
    id: string;
    company_name: string;
    logo_url: string | null;
  };
};

export function mapDbCarToHomeCard(car: DbCar): HomeCarCard {
  const images = Array.isArray(car.images) ? (car.images as string[]) : [];
  const lacs = car.price / 100000;
  const currency = car.currency || "PKR";

  return {
    id: car.id,
    title: car.title,
    priceDisplay: `${currency} ${lacs % 1 === 0 ? lacs.toFixed(0) : lacs.toFixed(1)} Lacs`,
    year: car.year,
    mileage: car.mileage ? `${car.mileage.toLocaleString()} km` : "N/A",
    fuel: car.fuel_type || "Petrol",
    location: car.city || "N/A",
    image: images[0] || FALLBACK_IMAGE,
    badge: car.is_featured ? "Featured" : undefined,
    dealer: (car as any).dealers ? {
      id: (car as any).dealers.id,
      company_name: (car as any).dealers.company_name,
      logo_url: (car as any).dealers.logo_url,
    } : undefined,
  };
}
