import { getDealerById, getDealerCars } from "@/lib/dealer-actions";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Globe, Star, CheckCircle2, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mapDbCarToHomeCard } from "@/lib/home-cars";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// Custom car grid for dealer inventory
import Link from "next/link";
import { ChevronRight, Calendar, Gauge, Fuel } from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const dealer = await getDealerById(params.id);
    return {
      title: `${dealer.company_name} | CarFever Dealers`,
      description: dealer.description || `View cars from ${dealer.company_name} on CarFever.`,
    };
  } catch {
    return { title: "Dealer Not Found | CarFever" };
  }
}

export default async function DealerProfilePage({ params }: { params: { id: string } }) {
  let dealer;
  let cars = [];
  try {
    dealer = await getDealerById(params.id);
    const dbCars = await getDealerCars(params.id);
    cars = dbCars.map(mapDbCarToHomeCard);
  } catch (error) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F9FA] pb-20">
        {/* Cover Area */}
      <div className="h-64 md:h-80 bg-white relative border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0055FE]/5 to-[#00B67A]/5 opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-24 md:-mt-32 mb-16">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white border-4 border-[#F8F9FA] shadow-md flex items-center justify-center shrink-0 overflow-hidden -mt-16 md:-mt-20">
              {dealer.logo_url ? (
                <img src={dealer.logo_url} alt={dealer.company_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-16 h-16 text-gray-400" />
              )}
            </div>

            {/* Dealer Info */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{dealer.company_name}</h1>
                    {dealer.is_verified && (
                      <CheckCircle2 className="w-6 h-6 text-[#0055FE]" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    {dealer.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {dealer.city}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-gray-700 font-medium">{dealer.rating_avg > 0 ? dealer.rating_avg.toFixed(1) : "New"}</span>
                      <span className="text-gray-400">({dealer.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                
                {dealer.status === 'approved' && (
                  <Badge variant="outline" className="bg-[#00B67A]/10 text-[#00B67A] border-[#00B67A]/20 text-sm px-4 py-1">
                    Verified Dealership
                  </Badge>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed max-w-3xl mb-6">
                {dealer.description || "No description provided."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                {dealer.phone && (
                  <a href={`tel:${dealer.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-[#0055FE] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#0055FE]/5 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-[#0055FE]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                      <p className="text-sm font-medium truncate text-gray-900">{dealer.phone}</p>
                    </div>
                  </a>
                )}
                {dealer.email && (
                  <a href={`mailto:${dealer.email}`} className="flex items-center gap-3 text-gray-600 hover:text-[#0055FE] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#0055FE]/5 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-[#0055FE]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="text-sm font-medium truncate text-gray-900">{dealer.email}</p>
                    </div>
                  </a>
                )}
                {dealer.website && (
                  <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-[#0055FE] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#0055FE]/5 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-[#0055FE]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Website</p>
                      <p className="text-sm font-medium truncate text-gray-900">Visit Website</p>
                    </div>
                  </a>
                )}
                {dealer.address && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-10 h-10 rounded-full bg-[#0055FE]/5 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#0055FE]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Address</p>
                      <p className="text-sm font-medium truncate text-gray-900">{dealer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dealer Cars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
          Inventory ({cars.length})
        </h2>
        
        {cars.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cars available</h3>
            <p className="text-gray-500">This dealer currently has no cars listed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map((car) => (
              <div key={car.id} className="group relative rounded-lg overflow-hidden bg-white border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="relative aspect-[16/11] overflow-hidden">
                  <img src={car.image} alt={car.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md">
                    <span className="text-lg font-bold text-[#0055FE]">{car.priceDisplay}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0055FE] transition-colors duration-300 mb-3 line-clamp-1">
                    {car.title}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                    <div className="flex flex-col items-center text-gray-500 text-center">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 mb-1" />
                      <span className="text-[10px] uppercase font-medium">Year</span>
                      <span className="text-xs font-semibold text-gray-900">{car.year}</span>
                    </div>
                    <div className="flex flex-col items-center text-gray-500 text-center border-x border-gray-200">
                      <Gauge className="w-3.5 h-3.5 text-gray-400 mb-1" />
                      <span className="text-[10px] uppercase font-medium">Mileage</span>
                      <span className="text-xs font-semibold text-gray-900">{car.mileage}</span>
                    </div>
                    <div className="flex flex-col items-center text-gray-500 text-center">
                      <Fuel className="w-3.5 h-3.5 text-gray-400 mb-1" />
                      <span className="text-[10px] uppercase font-medium">Fuel</span>
                      <span className="text-xs font-semibold text-gray-900">{car.fuel}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{car.location}</span>
                    <Link href={`/buy-car/${car.id}`} className="text-xs border border-[#0055FE] text-[#0055FE] hover:bg-blue-50 font-bold flex items-center gap-1 min-h-[36px] px-3 rounded-md transition-colors">
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    <Footer />
  </>
  );
}
