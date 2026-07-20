"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Heart, Gauge, Calendar, Fuel, MapPin, X, Car, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ApprovedCar } from "@/lib/server-actions";

// ── Wishlist helpers (localStorage, using Supabase UUID strings) ──────────────

function getWishlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cf_wishlist_ids") || "[]");
  } catch {
    return [];
  }
}

function removeFromWishlist(carId: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getWishlistIds().filter((id) => id !== carId);
    localStorage.setItem("cf_wishlist_ids", JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
  } catch {
    console.error("Error removing from wishlist");
  }
}

function formatPrice(price: number): string {
  return `PKR ${(price / 100000).toFixed(1)} Lacs`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const [wishlistCars, setWishlistCars] = useState<ApprovedCar[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    setLoading(true);
    const ids = getWishlistIds();

    if (ids.length === 0) {
      setWishlistCars([]);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id, title, make, model, year, price, currency, mileage, fuel_type, transmission, color, city, images, description, features, slug, condition, is_featured, created_at"
        )
        .in("id", ids)
        .eq("status", "approved");

      if (error) {
        console.error("Error fetching wishlist cars:", error);
        setWishlistCars([]);
      } else {
        setWishlistCars((data ?? []) as ApprovedCar[]);
      }
    } catch (err) {
      console.error("Wishlist fetch failed:", err);
      setWishlistCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    const handleUpdate = () => loadWishlist();
    window.addEventListener("wishlist-updated", handleUpdate);
    return () => window.removeEventListener("wishlist-updated", handleUpdate);
  }, []);

  const handleRemove = (carId: string) => {
    removeFromWishlist(carId);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 lg:pt-24 pb-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-10 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-[2px] bg-[#0055FE] rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0055FE]">My Collection</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                  My <span className="text-[#0055FE]">Wishlist</span>
                  {wishlistCars.length > 0 && (
                    <span className="text-sm font-normal bg-[#0055FE]/10 text-[#0055FE] border border-[#0055FE]/20 px-3 py-1 rounded-full">
                      {wishlistCars.length} {wishlistCars.length === 1 ? "car" : "cars"}
                    </span>
                  )}
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Cars you&apos;ve saved for later.</p>
              </div>
              {wishlistCars.length > 0 && (
                <Link href="/buy-car">
                  <Button variant="outline" className="border-[#0055FE] text-[#0055FE] hover:bg-blue-50">
                    Browse More Cars
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0055FE]" />
            </div>
          ) : wishlistCars.length > 0 ? (
            /* Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistCars.map((car) => {
                const images = Array.isArray(car.images) ? (car.images as string[]) : [];
                const primaryImage =
                  images[0] ||
                  "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={car.id}
                    className="group relative rounded-xl overflow-hidden bg-white border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(car.id)}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-all duration-200 active:scale-90 shadow-sm"
                      title="Remove from wishlist"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Image */}
                    <div className="relative aspect-[16/11] overflow-hidden shrink-0">
                      <img
                        src={primaryImage}
                        alt={car.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md">
                        <span className="text-sm font-bold text-[#0055FE]">{formatPrice(car.price)}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0055FE] transition-colors mb-3 line-clamp-1">
                        {car.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-gray-500">
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700">{car.year}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
                          <Gauge className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 truncate">
                            {car.mileage ? `${car.mileage.toLocaleString()} km` : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
                          <Fuel className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700">{car.fuel_type || "Petrol"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-700 truncate">{car.city || "—"}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <Link href={`/buy-car/${car.id}`}>
                          <Button size="sm" className="w-full border border-[#0055FE] text-[#0055FE] hover:bg-blue-50 bg-white text-xs font-bold">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
                  <Heart className="w-10 h-10 text-gray-300" />
                </div>
                <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-[#0055FE]/10 rounded-full flex items-center justify-center border border-[#0055FE]/20">
                  <Car className="w-4 h-4 text-[#0055FE]/50" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No cars in your wishlist yet</h2>
              <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
                Browse our marketplace and click the{" "}
                <Heart className="w-3.5 h-3.5 inline text-[#0055FE] fill-[#0055FE]" />{" "}
                heart icon on any car to save it for later.
              </p>
              <Link href="/buy-car">
                <Button className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold px-8 h-12 text-base">
                  Browse Cars Now
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
