'use client';

import { useState, useEffect, useTransition, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  SlidersHorizontal,
  Heart,
  Fuel,
  Gauge,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Car,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { fetchApprovedCars, type ApprovedCar, type FetchCarsFilters } from '@/lib/server-actions';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency?: string | null): string {
  const lacs = price / 100000;
  const prefix = currency || 'PKR';
  return `${prefix} ${lacs % 1 === 0 ? lacs.toFixed(0) : lacs.toFixed(1)} Lacs`;
}

function formatMileage(km: number | null): string {
  if (!km) return 'N/A';
  return `${km.toLocaleString()} km`;
}

// ─── Car Card ─────────────────────────────────────────────────────────────────

function CarCard({ car }: { car: ApprovedCar }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setIsWishlisted(isInWishlistId(car.id));
    const handleUpdate = () => setIsWishlisted(isInWishlistId(car.id));
    window.addEventListener('wishlist-updated', handleUpdate);
    return () => window.removeEventListener('wishlist-updated', handleUpdate);
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

  const images: string[] = Array.isArray(car.images) ? (car.images as string[]) : [];
  const primaryImage =
    images[0] ||
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group rounded-lg overflow-hidden bg-white border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col">
      <div className="relative aspect-[16/11] overflow-hidden shrink-0">
        <img
          src={primaryImage}
          alt={car.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {car.is_featured && (
          <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#0055FE] text-white">
            Featured
          </span>
        )}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm transition-all duration-200 active:scale-90 ${isWishlisted
              ? 'text-[#0055FE] scale-105'
              : 'text-gray-500 hover:text-[#0055FE] hover:bg-white'
            }`}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${isWishlisted ? 'fill-[#0055FE] text-[#0055FE]' : ''}`}
          />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0055FE] transition-colors duration-300 mb-4 line-clamp-1">
          {car.title}
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-5 text-gray-500">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs font-medium text-gray-700">{car.year}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <Gauge className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs font-medium text-gray-700 truncate">
              {formatMileage(car.mileage)}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 col-span-2">
            <Fuel className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs font-medium text-gray-700">
              {car.fuel_type || 'Petrol'}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-lg font-bold text-[#0055FE]">
            {formatPrice(car.price, car.currency)}
          </span>
          <Link href={`/buy-car/${car.id}`} suppressHydrationWarning>
            <Button
              size="sm"
              className="border border-[#0055FE] text-[#0055FE] hover:bg-blue-50 bg-white"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden bg-white border border-gray-200 flex flex-col animate-pulse">
      <div className="aspect-[16/11] bg-gray-200" />
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-9 bg-gray-100 rounded-lg" />
          <div className="h-9 bg-gray-100 rounded-lg" />
          <div className="h-9 bg-gray-100 rounded-lg col-span-2" />
        </div>
        <div className="flex justify-between items-center pt-3 mt-auto border-t border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

interface FilterSidebarProps {
  selectedMake: string | null;
  setSelectedMake: (v: string | null) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  selectedYear: string | null;
  setSelectedYear: (v: string | null) => void;
  selectedFuel: string[];
  setSelectedFuel: (v: string[]) => void;
  onReset: () => void;
}

function FilterSidebar({
  selectedMake,
  setSelectedMake,
  maxPrice,
  setMaxPrice,
  selectedYear,
  setSelectedYear,
  selectedFuel,
  setSelectedFuel,
  onReset,
}: FilterSidebarProps) {
  const makes = ['Toyota', 'Honda', 'Suzuki', 'KIA', 'Hyundai', 'Tesla'];
  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

  const handleFuelToggle = (fuel: string, checked: boolean) => {
    if (checked) {
      setSelectedFuel([...selectedFuel, fuel]);
    } else {
      setSelectedFuel(selectedFuel.filter((f) => f !== fuel));
    }
  };

  return (
    <div className="space-y-8">
      {/* Make */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Make / Brand
        </h3>
        <select
          value={selectedMake || ''}
          onChange={(e) => setSelectedMake(e.target.value || null)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:ring-1 focus:ring-[#0055FE] focus:border-[#0055FE] focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px w-full bg-gray-200" />

      {/* Price */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Max Price
          </h3>
          <span className="text-xs font-bold text-[#0055FE] bg-[#0055FE]/10 px-2 py-0.5 rounded">
            {(maxPrice / 100000).toFixed(0)} Lacs
          </span>
        </div>
        <input
          type="range"
          min="1000000"
          max="20000000"
          step="500000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0055FE]"
        />
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          <span>10 Lacs</span>
          <span>2 Crore+</span>
        </div>
      </div>

      <div className="h-px w-full bg-gray-200" />

      {/* Year */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Model Year
        </h3>
        <select
          value={selectedYear || ''}
          onChange={(e) => setSelectedYear(e.target.value || null)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:ring-1 focus:ring-[#0055FE] focus:border-[#0055FE] focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">Any Year</option>
          {[2025, 2024, 2023, 2022, 2021, 2020].map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px w-full bg-gray-200" />

      {/* Fuel */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Fuel Type
        </h3>
        <div className="space-y-3">
          {fuelTypes.map((fuel) => {
            const isChecked = selectedFuel.includes(fuel);
            return (
              <label key={fuel} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleFuelToggle(fuel, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-[#0055FE] focus:ring-[#0055FE] focus:ring-offset-white"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  {fuel}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 mt-4 transition-colors"
      >
        Reset Filters
      </Button>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 6;
const MAX_PRICE = 20000000;

function BuyCarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedFuel, setSelectedFuel] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<FetchCarsFilters['sortBy']>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [cars, setCars] = useState<ApprovedCar[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync URL search param on mount
  useEffect(() => {
    const q = searchParams?.get('search') || '';
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const loadCars = useCallback(() => {
    setLoading(true);
    startTransition(async () => {
      const result = await fetchApprovedCars({
        make: selectedMake,
        maxPrice: maxPrice < MAX_PRICE ? maxPrice : null,
        year: selectedYear ? parseInt(selectedYear) : null,
        fuelType: selectedFuel.length === 1 ? selectedFuel[0] : null,
        search: searchQuery || null,
        sortBy,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      setCars(result.cars);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setLoading(false);
    });
  }, [selectedMake, maxPrice, selectedYear, selectedFuel, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  // Reset page when filters change (not on page change itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMake, maxPrice, selectedYear, selectedFuel, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedMake(null);
    setMaxPrice(MAX_PRICE);
    setSelectedYear(null);
    setSelectedFuel([]);
    setSearchQuery('');
    setCurrentPage(1);
    router.push('/buy-car');
  };

  const hasActiveFilters =
    selectedMake ||
    maxPrice < MAX_PRICE ||
    selectedYear ||
    selectedFuel.length > 0 ||
    searchQuery;

  const isLoadingState = loading || isPending;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 lg:pt-24 pb-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Cars</h1>
              <p className="text-gray-500 text-sm">Find the perfect vehicle that fits your lifestyle.</p>
            </div>

            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    className="flex lg:hidden border-gray-300 text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto h-11 font-medium"
                  />
                }
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-white border-l border-gray-200 p-6 overflow-y-auto">
                <SheetHeader className="mb-6 px-0">
                  <SheetTitle className="text-gray-900 text-left text-lg font-bold">Filter Inventory</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6">
                  <FilterSidebar
                    selectedMake={selectedMake}
                    setSelectedMake={setSelectedMake}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedFuel={selectedFuel}
                    setSelectedFuel={setSelectedFuel}
                    onReset={handleResetFilters}
                  />
                  <Button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11"
                  >
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-1/4 shrink-0">
              <div className="sticky top-28 bg-white border border-gray-200 shadow-sm p-6 rounded-xl">
                <FilterSidebar
                  selectedMake={selectedMake}
                  setSelectedMake={setSelectedMake}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedFuel={selectedFuel}
                  setSelectedFuel={setSelectedFuel}
                  onReset={handleResetFilters}
                />
              </div>
            </aside>

            {/* Main Area */}
            <div className="w-full lg:w-3/4">

              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-xs font-semibold text-gray-500 mr-2">Active Filters:</span>
                  {searchQuery && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-gray-200 text-gray-700 pl-2 pr-1.5 py-1 bg-gray-50">
                      Search: &quot;{searchQuery}&quot;
                      <button onClick={() => setSearchQuery('')} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedMake && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-gray-200 text-gray-700 pl-2 pr-1.5 py-1 bg-gray-50">
                      Make: {selectedMake}
                      <button onClick={() => setSelectedMake(null)} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {maxPrice < MAX_PRICE && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-gray-200 text-gray-700 pl-2 pr-1.5 py-1 bg-gray-50">
                      Under {(maxPrice / 100000).toFixed(0)} Lacs
                      <button onClick={() => setMaxPrice(MAX_PRICE)} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedYear && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-gray-200 text-gray-700 pl-2 pr-1.5 py-1 bg-gray-50">
                      Year: {selectedYear}
                      <button onClick={() => setSelectedYear(null)} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedFuel.map((f) => (
                    <Badge key={f} variant="outline" className="flex items-center gap-1.5 border-gray-200 text-gray-700 pl-2 pr-1.5 py-1 bg-gray-50">
                      Fuel: {f}
                      <button onClick={() => setSelectedFuel(selectedFuel.filter((x) => x !== f))} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  ))}
                  <button onClick={handleResetFilters} className="text-xs font-semibold text-[#0055FE] hover:underline ml-auto">
                    Clear All
                  </button>
                </div>
              )}

              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-gray-900 text-sm font-medium mb-4 sm:mb-0 flex items-center gap-2">
                  {isLoadingState
                    ? <><Loader2 className="w-4 h-4 animate-spin text-[#0055FE]" /> Loading...</>
                    : <>{total} {total === 1 ? 'Car' : 'Cars'} Found</>
                  }
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 shrink-0">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as FetchCarsFilters['sortBy'])}
                    className="flex-1 sm:w-48 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0055FE] focus:border-[#0055FE] appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="year-desc">Year: Newest</option>
                  </select>
                </div>
              </div>

              {/* Car Grid */}
              {isLoadingState ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : cars.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  {cars.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-200 text-gray-400">
                    <Car className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Cars Found</h3>
                  <p className="text-gray-500 text-sm max-w-sm mb-6">
                    We couldn&apos;t find any vehicles matching your filter criteria. Try relaxing your filters or check back later.
                  </p>
                  <Button
                    onClick={handleResetFilters}
                    className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold px-6"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && !isLoadingState && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-200 text-gray-500 hover:text-gray-900 bg-white"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                    const page = idx + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        className={`w-10 h-10 ${page === currentPage
                            ? 'bg-[#0055FE] text-white hover:bg-blue-700 border-none'
                            : 'border-gray-200 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50'
                          }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-200 text-gray-500 hover:text-gray-900 bg-white"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BuyCarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0055FE]" />
        </div>
      }
    >
      <BuyCarContent />
    </Suspense>
  );
}
