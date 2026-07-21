"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Calendar,
  Clock,
  Phone,
  Check,
  X,
  Eye,
  Car,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Star,
  CheckCircle2,
  XCircle,
  Award,
  Filter,
  RefreshCw,
  Edit3,
} from "lucide-react";
import {
  fetchAdminInspections,
  updateInspectionStatus,
  deleteInspection,
  fetchCarsForInspection,
  verifyCarListing,
} from "@/lib/admin-actions";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";

type InspStatus = "pending" | "scheduled" | "completed" | "cancelled";
type InspPlan = "basic" | "standard" | "premium";

interface CustomerInspection {
  id: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  customer_name: string;
  customer_phone: string;
  plan: InspPlan;
  plan_price: number;
  address: string;
  scheduled_date: string;
  time_slot: string;
  status: InspStatus;
  created_at: string;
}

export default function InspectionsAdminPage() {
  const pathname = usePathname();
  const isSeller = pathname.startsWith("/seller");

  // Primary mode tabs: 'car_listings' (Listed Vehicles Inspection Queue) or 'customer_bookings' (Customer Appointments)
  const [modeTab, setModeTab] = useState<"car_listings" | "customer_bookings">("car_listings");

  // --- Car Listings Queue State ---
  const [carListings, setCarListings] = useState<any[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsFilter, setCarsFilter] = useState<"all" | "unverified" | "verified">("all");
  const [carsPage, setCarsPage] = useState(1);
  const [carsTotalPages, setCarsTotalPages] = useState(1);
  const [editingCarNotesId, setEditingCarNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>("");
  const [ratingDraft, setRatingDraft] = useState<string>("9.0");
  const [verifyingCarId, setVerifyingCarId] = useState<string | null>(null);

  // --- Customer Appointments State ---
  const [bookings, setBookings] = useState<CustomerInspection[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);

  // Load Car Listings for Inspector Review
  const loadCarsQueue = useCallback(async () => {
    setCarsLoading(true);
    try {
      const res = await fetchCarsForInspection(carsPage, carsFilter, 10);
      setCarListings(res.data || []);
      setCarsTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error(`Failed to load vehicle inspection queue: ${err.message}`);
    } finally {
      setCarsLoading(false);
    }
  }, [carsPage, carsFilter]);

  // Load Customer Inspection Appointments
  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await fetchAdminInspections(bookingsPage, 10);
      setBookings(res.data || []);
      setBookingsTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error(`Failed to load customer inspection bookings: ${err.message}`);
    } finally {
      setBookingsLoading(false);
    }
  }, [bookingsPage]);

  useEffect(() => {
    if (modeTab === "car_listings") {
      loadCarsQueue();
    } else {
      loadBookings();
    }
  }, [modeTab, loadCarsQueue, loadBookings]);

  // Toggle or Update Car Inspection Verification
  const handleToggleCarVerification = async (
    car: any,
    targetVerifiedStatus: boolean
  ) => {
    setVerifyingCarId(car.id);
    try {
      await verifyCarListing(car.id, {
        is_inspected: targetVerifiedStatus,
        inspection_rating: targetVerifiedStatus
          ? parseFloat(ratingDraft) || car.inspection_rating || 9.0
          : null,
        inspection_notes: targetVerifiedStatus
          ? notesDraft || car.inspection_notes || "Verified by CarFever Inspector Team"
          : null,
      });
      toast.success(
        targetVerifiedStatus
          ? `Vehicle "${car.title || car.make}" marked as Certified Inspected!`
          : `Inspection badge removed for "${car.title || car.make}"`
      );
      setEditingCarNotesId(null);
      loadCarsQueue();
    } catch (err: any) {
      toast.error(`Failed to update verification: ${err.message}`);
    } finally {
      setVerifyingCarId(null);
    }
  };

  // Start editing inspector notes for a specific car
  const openNotesModal = (car: any) => {
    setEditingCarNotesId(car.id);
    setNotesDraft(car.inspection_notes || "");
    setRatingDraft((car.inspection_rating || 9.0).toString());
  };

  // Save inspector notes & rating
  const handleSaveNotes = async (carId: string) => {
    setVerifyingCarId(carId);
    try {
      await verifyCarListing(carId, {
        is_inspected: true,
        inspection_rating: parseFloat(ratingDraft) || 9.0,
        inspection_notes: notesDraft.trim(),
      });
      toast.success("Inspector notes and rating updated!");
      setEditingCarNotesId(null);
      loadCarsQueue();
    } catch (err: any) {
      toast.error(`Failed to save notes: ${err.message}`);
    } finally {
      setVerifyingCarId(null);
    }
  };

  // Customer Appointment Status updates
  const markBooking = async (id: string, status: InspStatus) => {
    try {
      await updateInspectionStatus(id, status);
      setBookings((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
      toast.success(`Booking status set to ${status}`);
    } catch {
      toast.error("Failed to update booking status");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteInspection(id);
      setBookings((prev) => prev.filter((i) => i.id !== id));
      toast.success("Inspection booking deleted");
    } catch {
      toast.error("Failed to delete inspection booking");
    }
  };

  const statusStyle: Record<InspStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const planStyle: Record<InspPlan, string> = {
    basic: "bg-slate-100 text-slate-700 border-slate-200",
    standard: "bg-amber-50 text-amber-700 border-amber-200",
    premium: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => `PKR ${price?.toLocaleString() || 0}`;

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Vehicle Inspection Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055FE] border border-blue-100 font-extrabold text-[10px] uppercase tracking-wider">
              Certified Inspector Suite
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Review listed vehicles, perform 200+ point inspections, and add verification notes.
          </p>
        </div>

        <button
          onClick={() => (modeTab === "car_listings" ? loadCarsQueue() : loadBookings())}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Main Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit flex-wrap border border-slate-200/60">
        <button
          onClick={() => setModeTab("car_listings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            modeTab === "car_listings"
              ? "bg-white text-[#0055FE] shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 text-[#0055FE]" />
          Vehicle Inspection Queue
        </button>
        <button
          onClick={() => setModeTab("customer_bookings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            modeTab === "customer_bookings"
              ? "bg-white text-[#0055FE] shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          Customer Booking Requests
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 1: LISTED CARS VERIFICATION QUEUE                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {modeTab === "car_listings" && (
        <div className="space-y-6">
          {/* Sub-Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: "All Vehicles" },
                { id: "unverified", label: "Pending Inspection" },
                { id: "verified", label: "Certified Inspected" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setCarsFilter(f.id as any);
                    setCarsPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    carsFilter === f.id
                      ? "bg-[#0055FE] text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-slate-400">
              Showing listed cars awaiting physical verification & rating
            </div>
          </div>

          {/* Cards Grid */}
          {carsLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-[#0055FE] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Fetching Vehicles Queue…
              </p>
            </div>
          ) : carListings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                No vehicles found in this queue
              </h3>
              <p className="text-xs text-slate-500">
                All newly submitted vehicles will automatically appear here for inspector verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {carListings.map((car) => {
                const isInspected = Boolean(car.is_inspected);
                const displayImg =
                  (Array.isArray(car.images) && car.images[0]) ||
                  car.image_url ||
                  "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={car.id}
                    className={`bg-white border rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                      isInspected
                        ? "border-emerald-200/90 ring-1 ring-emerald-500/10"
                        : "border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {/* Header Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative">
                        <img
                          src={displayImg}
                          alt={car.title || car.make}
                          className="w-full h-full object-cover"
                        />
                        {isInspected && (
                          <div className="absolute top-1 left-1 bg-emerald-600 text-white p-1 rounded-lg shadow-md" title="Certified Verified">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm truncate">
                            {car.title || `${car.make} ${car.model}`}
                          </h3>
                          <span className="text-xs font-black text-slate-900">
                            PKR {car.price?.toLocaleString() || 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mt-1 flex-wrap">
                          <span>{car.make}</span>
                          <span>•</span>
                          <span>{car.model}</span>
                          <span>•</span>
                          <span>{car.year}</span>
                          {car.city && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-slate-600">
                                <MapPin className="w-3 h-3 text-slate-400" /> {car.city}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Verification Pill */}
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          {isInspected ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Certified Inspected ({car.inspection_rating || "9.0"}/10)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Awaiting Inspector Review
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inspector Verification Notes Section */}
                    {car.inspection_notes && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#0055FE]" /> Inspector Verification Note
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed italic">
                          "{car.inspection_notes}"
                        </p>
                        {car.inspected_at && (
                          <div className="text-[10px] text-slate-400 font-semibold mt-1">
                            Verified on {formatDate(car.inspected_at)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <Link
                        href={isSeller ? `/seller/cars/${car.id}` : `/admin/cars/${car.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" /> View Specs & Photos
                      </Link>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openNotesModal(car)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#0055FE] text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> {car.inspection_notes ? "Edit Notes & Score" : "+ Add Verification Note"}
                        </button>

                        {isInspected ? (
                          <button
                            onClick={() => handleToggleCarVerification(car, false)}
                            disabled={verifyingCarId === car.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Unverify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleCarVerification(car, true)}
                            disabled={verifyingCarId === car.id}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Verified
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {carsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-bold text-slate-400">
                Page {carsPage} of {carsTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCarsPage((p) => Math.max(1, p - 1))}
                  disabled={carsPage <= 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCarsPage((p) => Math.min(carsTotalPages, p + 1))}
                  disabled={carsPage >= carsTotalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 2: CUSTOMER INSPECTION BOOKINGS                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {modeTab === "customer_bookings" && (
        <div className="space-y-4">
          {bookingsLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-[#0055FE] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Fetching Customer Bookings…
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No customer inspection bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((ins) => (
                <div
                  key={ins.id}
                  className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden"
                >
                  <div className="p-5 flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#0055FE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {ins.make} {ins.model} ({ins.year})
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            planStyle[ins.plan] || planStyle.basic
                          }`}
                        >
                          {ins.plan}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        {[
                          { icon: Car, text: ins.registration_number },
                          { icon: Calendar, text: formatDate(ins.scheduled_date) },
                          { icon: Clock, text: ins.time_slot },
                        ].map(({ icon: Icon, text }) => (
                          <span
                            key={text}
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500"
                          >
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            {text}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          statusStyle[ins.status] || statusStyle.pending
                        }`}
                      >
                        {ins.status}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatPrice(ins.plan_price)}
                      </span>
                      <button
                        onClick={() =>
                          setExpandedBookingId(expandedBookingId === ins.id ? null : ins.id)
                        }
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {(ins.status === "pending" || ins.status === "scheduled") && (
                        <>
                          <button
                            onClick={() => markBooking(ins.id, "completed")}
                            title="Mark Complete"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => markBooking(ins.id, "cancelled")}
                            title="Cancel"
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteBooking(ins.id)}
                        title="Delete"
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {expandedBookingId === ins.id && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                          Customer
                        </p>
                        <p className="text-xs font-bold text-slate-900">{ins.customer_name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {ins.customer_phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                          Location Address
                        </p>
                        <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {ins.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                          Booking Reference ID
                        </p>
                        <p className="text-xs font-mono font-bold text-[#0055FE]">{ins.id}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {bookingsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-bold text-slate-400">
                Page {bookingsPage} of {bookingsTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                  disabled={bookingsPage <= 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setBookingsPage((p) => Math.min(bookingsTotalPages, p + 1))}
                  disabled={bookingsPage >= bookingsTotalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* INSPECTOR NOTES & RATING MODAL OVERLAY                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editingCarNotesId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0055FE]" /> Inspector Verification Note
              </h3>
              <button
                onClick={() => setEditingCarNotesId(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Inspection Score / Rating (out of 10)
                </label>
                <div className="relative">
                  <Star className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-500 fill-amber-500" />
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={ratingDraft}
                    onChange={(e) => setRatingDraft(e.target.value)}
                    placeholder="9.0"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:bg-white focus:border-[#0055FE] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Inspector Audit Notes & Summary
                </label>
                <textarea
                  rows={4}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Enter detailed physical inspection report notes (e.g. Engine smooth, suspension genuine, minor scratch on rear bumper...)"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:border-[#0055FE] outline-none resize-y"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingCarNotesId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNotes(editingCarNotesId)}
                disabled={verifyingCarId === editingCarNotesId}
                className="px-5 py-2 text-xs font-black text-white bg-[#0055FE] hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
              >
                Save & Mark Certified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
