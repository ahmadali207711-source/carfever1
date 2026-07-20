"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Calendar, Clock, Phone, Check, X, Eye, Car, MapPin, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAdminInspections, updateInspectionStatus, deleteInspection } from "@/lib/admin-actions";
import { toast } from "sonner";

type InspStatus = "pending" | "scheduled" | "completed" | "cancelled";
type InspPlan = "basic" | "standard" | "premium";

interface Inspection {
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
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadInspections() {
      setLoading(true);
      try {
        const result = await fetchAdminInspections(page);
        setItems(result.data || []);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('Failed to fetch inspections:', error);
        toast.error('Failed to load inspections');
      } finally {
        setLoading(false);
      }
    }

    loadInspections();
  }, [page]);

  const stats = {
    scheduled: items.filter(i => i.status === "scheduled").length,
    completed: items.filter(i => i.status === "completed").length,
    cancelled: items.filter(i => i.status === "cancelled").length,
    pending: items.filter(i => i.status === "pending").length,
  };

  const mark = async (id: string, s: InspStatus) => {
    try {
      await updateInspectionStatus(id, s);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));
      toast.success(`Inspection ${s}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInspection(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Inspection deleted');
    } catch {
      toast.error('Failed to delete inspection');
    }
  };

  const statCards = [
    { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Scheduled", value: stats.scheduled, color: "text-[#0055FE]", bg: "bg-blue-50" },
    { label: "Completed", value: stats.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Cancelled", value: stats.cancelled, color: "text-rose-600", bg: "bg-rose-50" },
  ];

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const formatPrice = (price: number) => `PKR ${price?.toLocaleString() || 0}`;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inspection Bookings</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Manage vehicle inspection appointments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
              {s.label === "Pending" && <Clock className="w-5 h-5 text-amber-600" />}
              {s.label === "Scheduled" && <Clock className="w-5 h-5 text-[#0055FE]" />}
              {s.label === "Completed" && <Check className="w-5 h-5 text-emerald-600" />}
              {s.label === "Cancelled" && <X className="w-5 h-5 text-rose-600" />}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-semibold">
          <div className="inline-block w-8 h-8 border-3 border-[#0055FE] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-xs">Loading inspections…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No inspection bookings yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(ins => (
            <div key={ins.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#0055FE]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{ins.make} {ins.model} ({ins.year})</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${planStyle[ins.plan] || planStyle.basic}`}>
                      {ins.plan}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {[
                      { icon: Car, text: ins.registration_number },
                      { icon: Calendar, text: formatDate(ins.scheduled_date) },
                      { icon: Clock, text: ins.time_slot },
                    ].map(({ icon: Icon, text }) => (
                      <span key={text} className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />{text}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyle[ins.status] || statusStyle.pending}`}>
                    {ins.status}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">{formatPrice(ins.plan_price)}</span>
                  <button
                    onClick={() => setExpanded(expanded === ins.id ? null : ins.id)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {(ins.status === "pending" || ins.status === "scheduled") && (
                    <>
                      <button
                        onClick={() => mark(ins.id, "completed")}
                        title="Mark Complete"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => mark(ins.id, "cancelled")}
                        title="Cancel"
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(ins.id)}
                    title="Delete"
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {expanded === ins.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Customer</p>
                    <p className="text-xs font-bold text-slate-900">{ins.customer_name}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />{ins.customer_phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Location</p>
                    <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />{ins.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Booking ID</p>
                    <p className="text-xs font-mono font-bold text-[#0055FE]">{ins.id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-medium text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
