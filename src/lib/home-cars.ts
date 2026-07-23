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
  let p = car.price || 0;
  while (p >= 1000000000) {
    p = p / 100000;
  }
  const currency = car.currency || "GBP";
  let priceStr = "";
  if (currency === "GBP" || currency === "£") {
    priceStr = `£${p.toLocaleString('en-GB')}`;
  } else if (currency === "USD" || currency === "$") {
    priceStr = `$${p.toLocaleString('en-US')}`;
  } else if (currency === "EUR" || currency === "€") {
    priceStr = `€${p.toLocaleString('en-IE')}`;
  } else if (p >= 10000000) {
    priceStr = `${currency} ${(p / 10000000).toFixed(2)} Crore`;
  } else if (p >= 100000) {
    const lacs = p / 100000;
    priceStr = `${currency} ${lacs % 1 === 0 ? lacs.toFixed(0) : lacs.toFixed(1)} Lacs`;
  } else {
    priceStr = `${currency} ${p.toLocaleString()}`;
  }

  const unit = (currency === 'GBP' || currency === '£') ? 'miles' : 'km';

  return {
    id: car.id,
    title: car.title,
    priceDisplay: priceStr,
    year: car.year,
    mileage: car.mileage ? `${car.mileage.toLocaleString()} ${unit}` : "N/A",
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
