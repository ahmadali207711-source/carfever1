'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Sliders,
  DollarSign,
  User,
  Phone,
  Mail,
  Eye,
  ShieldCheck,
  Tag,
  Sparkles,
  Car as CarIcon,
  MessageSquare,
  Maximize2,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchCarDetailsById, approveCar, rejectCar, deleteCar } from '@/lib/admin-actions';

function formatPricePKR(price?: number): string {
  if (!price || isNaN(price)) return 'PKR 0';
  if (price >= 10000000) {
    const crore = (price / 10000000).toFixed(2);
    return `PKR ${crore} Crore`;
  } else if (price >= 100000) {
    const lacs = (price / 100000).toFixed(2);
    return `PKR ${lacs} Lac`;
  }
  return `PKR ${price.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; dot: string; label: string }> = {
    approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Approved & Live' },
    rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse', label: 'Pending Review' },
  };
  const item = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.bg} shadow-xs`}>
      <span className={`w-2 h-2 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}

export default function CarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const pathname = usePathname();
  const router = useRouter();
  const isSeller = pathname.startsWith('/seller');
  const backUrl = isSeller ? '/seller/cars' : '/admin/cars';
  const editUrl = isSeller ? `/seller/cars/new?id=${id}` : `/admin/cars/new?id=${id}`;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ car: any; sellerProfile: any; inquiryCount: number } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  async function loadDetails() {
    setLoading(true);
    try {
      const res = await fetchCarDetailsById(id);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (newStatus: 'approved' | 'rejected') => {
    try {
      if (newStatus === 'approved') await approveCar(id);
      else await rejectCar(id);

      toast.success(`Vehicle listing ${newStatus}`);
      setData((prev) => (prev ? { ...prev, car: { ...prev.car, status: newStatus } } : null));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this car listing?')) return;
    try {
      await deleteCar(id);
      toast.success('Vehicle listing deleted');
      router.push(backUrl);
    } catch {
      toast.error('Failed to delete car listing');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-6 w-36 bg-slate-200 rounded-lg" />
        <div className="h-10 w-96 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-slate-200 rounded-3xl" />
          <div className="h-96 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.car) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <CarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Vehicle Listing Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested car listing does not exist or may have been deleted.
        </p>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0055FE] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Inventory
        </Link>
      </div>
    );
  }

  const { car, sellerProfile, inquiryCount } = data;

  const images: string[] =
    Array.isArray(car.images) && car.images.length > 0
      ? car.images
      : car.image_url
      ? [car.image_url]
      : ['https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80'];

  const featuresList: string[] = Array.isArray(car.features)
    ? car.features
    : typeof car.features === 'string'
    ? car.features.split(',').map((f: string) => f.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0055FE] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Car Inventory
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {!isSeller && car.status !== 'approved' && (
            <button
              onClick={() => handleStatusChange('approved')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" /> Approve Listing
            </button>
          )}

          {!isSeller && car.status !== 'rejected' && (
            <button
              onClick={() => handleStatusChange('rejected')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Reject Listing
            </button>
          )}

          <Link
            href={editUrl}
            prefetch={false}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0055FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            <Edit className="w-4 h-4" /> Edit Vehicle
          </Link>

          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Main Title & Price Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {car.title}
            </h1>
            <StatusBadge status={car.status || 'pending'} />
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>{car.brand || car.make}</span>
            <span>•</span>
            <span>{car.model}</span>
            <span>•</span>
            <span>{car.year} Model</span>
            {car.city && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-[#0055FE]" /> {car.city}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="text-left md:text-right bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
          <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Listing Price</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
            {formatPricePKR(car.price)}
          </p>
          <p className="text-xs font-bold text-slate-500">
            PKR {car.price?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hero Grid: Gallery & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Image Gallery */}
        <div className="lg:col-span-2 space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full h-80 md:h-96 rounded-2xl bg-slate-900 overflow-hidden border border-slate-200 group">
            <img
              src={images[activeImageIndex] || images[0]}
              alt={car.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setLightboxOpen(true)}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold backdrop-blur-md transition-all cursor-pointer shadow-lg"
                title="Expand Fullscreen Image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
              Photo {activeImageIndex + 1} of {images.length}
            </div>
          </div>

          {/* Thumbnails Carousel */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pt-1 pb-2">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#0055FE] ring-2 ring-[#0055FE]/20 scale-105 shadow-md'
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Key Specs Quick Cards */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Quick Specs Overview
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0055FE]" /> Year
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">{car.year}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-[#0055FE]" /> Mileage
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">
                  {car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-[#0055FE]" /> Fuel Type
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">{car.fuel_type || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#0055FE]" /> Transmission
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">{car.transmission || 'N/A'}</p>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="flex items-center gap-1 text-slate-400">
                  <Eye className="w-3.5 h-3.5" /> Total Views
                </span>
                <span className="font-black text-slate-900">{car.views_count || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="flex items-center gap-1 text-slate-400">
                  <MessageSquare className="w-3.5 h-3.5" /> Inquiries
                </span>
                <span className="font-black text-slate-900">{inquiryCount}</span>
              </div>
            </div>

            {car.slug && (
              <Link
                href={`/cars/${car.slug}`}
                target="_blank"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
              >
                Open Live Buyer Page <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Owner / Seller Profile & Detailed Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Vehicle Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complete Technical Specifications */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0055FE]" /> Full Technical Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Make / Brand</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{car.brand || car.make || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Model</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{car.model || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Body Type</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{car.body_type || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Engine Capacity</p>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {car.engine ? `${car.engine} cc` : 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Exterior Color</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{car.exterior_color || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Interior Color</p>
                <p className="font-extrabold text-slate-900 mt-0.5">{car.interior_color || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Features Checklist */}
          {featuresList.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0055FE]" /> Features & Accessories
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {featuresList.map((feature, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-800 text-xs font-bold"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-[#0055FE]" /> {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Description */}
          {car.description && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Seller's Detailed Description
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                {car.description}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Full Owner / Seller Information Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-[#0055FE]" />
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Vehicle Owner / Seller Information
              </h3>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Seller Name</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                  {sellerProfile?.name || car.seller_name || 'Individual Seller'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                </span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">
                  {sellerProfile?.phone || car.seller_phone || 'Not specified'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Email Address
                </span>
                <span className="font-extrabold text-slate-900 mt-0.5 block break-all">
                  {sellerProfile?.email || car.seller_email || 'Not specified'}
                </span>
              </div>

              {sellerProfile?.role && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Role</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-extrabold border border-purple-200">
                    {sellerProfile.role.toUpperCase()}
                  </span>
                </div>
              )}

              {car.seller_id && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Seller Account ID</span>
                  <span className="font-mono text-[10px] text-slate-600 block mt-0.5 break-all">
                    {car.seller_id}
                  </span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Listing Created Date
                </span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">
                  {car.created_at ? new Date(car.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={images[activeImageIndex] || images[0]}
            alt={car.title}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
