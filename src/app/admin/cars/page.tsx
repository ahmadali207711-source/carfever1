'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, MoreHorizontal, ChevronLeft, ChevronRight, Car as CarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminCars, deleteCar, approveCar, rejectCar } from '@/lib/admin-actions';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
  };
  const cls = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
      <p className="text-xs font-medium text-slate-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminCarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 450);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminCars(debounced, page);
      setCars(result.data || []);
      setTotalPages(result.totalPages);
    } catch {
      toast.error('Failed to load cars');
    }
    setLoading(false);
  }, [debounced, page]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this car listing permanently?')) return;
    try { await deleteCar(id); toast.success('Deleted'); setCars(c => c.filter(x => x.id !== id)); }
    catch { toast.error('Failed to delete'); }
  };

  const handleStatus = async (id: string, s: 'approved' | 'rejected') => {
    try {
      if (s === 'approved') await approveCar(id); else await rejectCar(id);
      toast.success(`Car ${s}`);
      setCars(c => c.map(x => x.id === id ? { ...x, status: s } : x));
    } catch { toast.error('Status update failed'); }
    setMenu(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Car Listings</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage, approve, or remove car inventory.</p>
        </div>
        <Link href="/admin/cars/new" prefetch={false}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0055FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add New Car
        </Link>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className="w-full bg-white border border-slate-200 rounded-xl text-xs font-medium pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] transition-all shadow-xs"
          placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Car</th>
                <th className="py-3.5 px-5">Price</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Added</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-5"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-5"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-5"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-5"><div className="h-4 w-12 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : cars.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">No cars found.</td></tr>
              ) : cars.map(car => (
                <tr key={car.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                        {car.images?.[0]
                          ? <img src={car.images[0]} alt={car.title} className="w-full h-full object-cover" />
                          : <CarIcon className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{car.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{car.make} • {car.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-bold text-emerald-600">PKR {car.price?.toLocaleString()}</td>
                  <td className="py-4 px-5"><StatusBadge status={car.status} /></td>
                  <td className="py-4 px-5 text-slate-500 font-medium">{new Date(car.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-5 text-right relative">
                    <div className="relative inline-block">
                      <button onClick={() => setMenu(menu === car.id ? null : car.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {menu === car.id && (
                        <>
                          <div onClick={() => setMenu(null)} className="fixed inset-0 z-20" />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden py-1">
                            <Link href={`/admin/cars/new?id=${car.id}`} prefetch={false} onClick={() => setMenu(null)}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                              <Edit className="w-3.5 h-3.5 text-slate-400" /> Edit
                            </Link>
                            {car.status !== 'approved' && (
                              <button onClick={() => handleStatus(car.id, 'approved')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}
                            {car.status !== 'rejected' && (
                              <button onClick={() => handleStatus(car.id, 'rejected')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 cursor-pointer">
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            )}
                            <button onClick={() => handleDelete(car.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}