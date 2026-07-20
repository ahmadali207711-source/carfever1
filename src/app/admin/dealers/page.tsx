"use client";

import { useState, useEffect } from "react";
import { updateDealerStatus, getAllDealers } from "@/lib/dealer-actions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Search, Building2, MapPin, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminDealersPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchDealers();
  }, [page]);

  async function fetchDealers() {
    setLoading(true);
    try {
      const result = await getAllDealers(page);
      if ('data' in result) {
        setDealers(result.data || []);
        setTotalPages(result.totalPages);
      } else {
        setDealers(result as any[] || []);
      }
    } catch (error: any) {
      toast.error("Failed to fetch dealers: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, newStatus: 'approved' | 'suspended') {
    setProcessing(id);
    try {
      await updateDealerStatus(id, newStatus);
      toast.success(`Dealer marked as ${newStatus}`);
      setDealers(current =>
        current.map(d => d.id === id ? { ...d, status: newStatus } : d)
      );
    } catch {
      toast.error("Failed to update status");
    } finally {
      setProcessing(null);
    }
  }

  const filteredDealers = dealers.filter(d =>
    d.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.city && d.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dealerships</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Manage dealer applications and partner accounts.</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by name or city…"
          className="w-full bg-white border border-slate-200 rounded-xl text-xs font-medium pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] transition-all shadow-xs" />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Dealership</th>
                <th className="py-3.5 px-5">Contact Info</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Joined</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0055FE] mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading dealers…</p>
                </td></tr>
              ) : filteredDealers.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                  No dealers found.
                </td></tr>
              ) : filteredDealers.map(dealer => (
                <tr key={dealer.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {dealer.logo_url ? (
                          <img src={dealer.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{dealer.company_name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                          <MapPin className="w-3 h-3 text-rose-500" /> {dealer.city || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-xs font-semibold text-slate-800">{dealer.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{dealer.phone}</p>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      dealer.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      dealer.status === 'suspended' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {dealer.status.charAt(0).toUpperCase() + dealer.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-medium">
                    {new Date(dealer.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {dealer.status !== 'approved' && (
                        <button onClick={() => handleStatusUpdate(dealer.id, 'approved')}
                          disabled={processing === dealer.id} title="Approve"
                          className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {dealer.status !== 'suspended' && (
                        <button onClick={() => handleStatusUpdate(dealer.id, 'suspended')}
                          disabled={processing === dealer.id} title="Suspend"
                          className="p-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <a href={`/dealers/${dealer.id}`} target="_blank" rel="noreferrer" title="View Public Profile"
                        className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
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
    </div>
  );
}