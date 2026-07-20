"use client";

import { useState, useEffect } from "react";
import { Heart, Fuel, Gauge, Calendar, MapPin, ChevronRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { HomeCarCard } from "@/lib/home-cars";

// ── Wishlist helpers (UUID strings) ──────────────────────────────────────────
function getWishlistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('cf_wishlist_ids') || '[]'); } catch { return []; }
}
function addToWishlistId(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = getWishlistIds();
  if (!ids.includes(id)) {
    localStorage.setItem('cf_wishlist_ids', JSON.stringify([...ids, id]));
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
  }
}
function removeFromWishlistId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cf_wishlist_ids', JSON.stringify(getWishlistIds().filter((x) => x !== id)));
  window.dispatchEvent(new CustomEvent('wishlist-updated'));
}
function isInWishlistId(id: string): boolean {
  return getWishlistIds().includes(id);
}

function CarCard({ car }: { car: HomeCarCard }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setIsWishlisted(isInWishlistId(car.id));
    const handleUpdate = () => setIsWishlisted(isInWishlistId(car.id));
    window.addEventListener("wishlist-updated", handleUpdate);
    return () => window.removeEventListener("wishlist-updated", handleUpdate);
  }, [car.id]);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlistId(car.id);
    } else {
      addToWishlistId(car.id);
    }
  };

  return (
    <div className="group relative rounded-lg overflow-hidden bg-white border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="relative aspect-[16/10] sm:aspect-[16/11] overflow-hidden">
        <img
          src={car.image}
          alt={car.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {car.badge && (
          <div className="absolute top-3 left-3">
            <Badge
              className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 ${
                car.badge === "Featured"
                  ? "bg-[#0055FE] text-white border-none"
                  : car.badge === "Certified"
                    ? "bg-[#00B67A] text-white border-none"
                    : car.badge === "Hot Deal"
                      ? "bg-[#FF6B00] text-white border-none"
                      : "bg-gray-800 text-white border-none"
              }`}
            >
              {car.badge}
            </Badge>
          </div>
        )}

        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2.5 rounded-full bg-white/80 backdrop-blur-sm transition-all duration-200 active:scale-75 ${
            isWishlisted ? "text-[#0055FE] scale-105" : "text-gray-500 hover:text-[#0055FE] hover:bg-white"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${isWishlisted ? "fill-[#0055FE] text-[#0055FE]" : ""}`}
          />
        </button>

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md">
          <span className="text-lg font-bold text-[#0055FE]">{car.priceDisplay}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0055FE] transition-colors duration-300 mb-3 line-clamp-1">
          {car.title}
        </h3>

        <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="flex flex-col items-center justify-center text-gray-500 text-center">
            <Calendar className="w-3.5 h-3.5 text-gray-400 mb-1 shrink-0" />
            <span className="text-[10px] text-gray-400 font-medium uppercase">Year</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-full">{car.year}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-gray-500 text-center border-x border-gray-200">
            <Gauge className="w-3.5 h-3.5 text-gray-400 mb-1 shrink-0" />
            <span className="text-[10px] text-gray-400 font-medium uppercase">Mileage</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-full">{car.mileage}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-gray-500 text-center">
            <Fuel className="w-3.5 h-3.5 text-gray-400 mb-1 shrink-0" />
            <span className="text-[10px] text-gray-400 font-medium uppercase">Fuel</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-full">{car.fuel}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
          {car.dealer && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                {car.dealer.logo_url ? (
                  <img src={car.dealer.logo_url} alt={car.dealer.company_name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-700 truncate">{car.dealer.company_name}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs truncate">{car.location}</span>
            </div>
            <Link
              href={`/buy-car/${car.id}`}
              suppressHydrationWarning
              className="text-xs border border-[#0055FE] text-[#0055FE] hover:bg-blue-50 font-bold transition-colors flex items-center gap-1 shrink-0 min-h-[36px] px-3 rounded-md"
            >
              View Details
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      <Link href="/buy-car">
        <Button className="bg-[#0055FE] hover:bg-blue-700 text-white">Browse All Cars</Button>
      </Link>
    </div>
  );
}

interface FeaturedCarsProps {
  cars: HomeCarCard[];
}

export function FeaturedCars({ cars }: FeaturedCarsProps) {
  return (
    <section className="relative py-12 sm:py-20 md:py-28 bg-white">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-[2px] bg-[#0055FE] rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0055FE]">
                Featured
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
              Trending <span className="text-[#0055FE]">Cars</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-md">
              Curated selection of the finest vehicles currently available on our marketplace.
            </p>
          </div>
          <Link href="/buy-car" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="mt-4 sm:mt-0 w-full sm:w-auto border-[#0055FE] text-[#0055FE] hover:bg-blue-50 hover:text-blue-700 h-11 transition-colors"
            >
              View All Listings
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.length > 0 ? (
            cars.map((car) => <CarCard key={car.id} car={car} />)
          ) : (
            <EmptyState message="No featured cars available right now. Check back soon or browse all listings." />
          )}
        </div>
      </div>
    </section>
  );
}

interface RecentlyAddedCarsProps {
  cars: HomeCarCard[];
}

export function RecentlyAddedCars({ cars }: RecentlyAddedCarsProps) {
  return (
    <section className="relative py-12 sm:py-16 md:py-20 bg-[#F8F9FA]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-[2px] bg-[#0055FE] rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0055FE]">
                Fresh Arrivals
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
              Recently <span className="text-[#0055FE]">Added</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-md">
              The latest approved listings added to our marketplace.
            </p>
          </div>
          <Link href="/buy-car" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="mt-4 sm:mt-0 w-full sm:w-auto border-[#0055FE] text-[#0055FE] hover:bg-blue-50 hover:text-blue-700 h-11 transition-colors"
            >
              See More
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cars.length > 0 ? (
            cars.map((car) => <CarCard key={car.id} car={car} />)
          ) : (
            <EmptyState message="No new listings yet. Be the first to list your car!" />
          )}
        </div>
      </div>
    </section>
  );
}
