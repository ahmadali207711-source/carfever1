"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Eye,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Mail,
  Phone,
  Calendar,
  Clock,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchAdminInquiries,
  updateInquiryStatus,
  deleteInquiry,
  markAllInquiriesRead,
  clearAllInquiries,
} from "@/lib/admin-actions";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
  status: 'pending' | 'read' | 'replied' | 'archived';
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Unread" | "Read">("All");

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAdminInquiries();
        setInquiries(data || []);
      } catch (error) {
        console.error('Failed to fetch inquiries:', error);
        toast.error('Failed to load inquiries');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const markAsRead = async (id: string, readState: boolean = true) => {
    try {
      const status = readState ? 'read' : 'pending';
      await updateInquiryStatus(id, status);
      setInquiries(c => c.map(i => i.id === id ? { ...i, is_read: readState, status } : i));
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry({ ...selectedInquiry, is_read: readState, status });
      }
      toast.success(readState ? 'Marked as read' : 'Marked as unread');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInquiry(id);
      setInquiries(c => c.filter(i => i.id !== id));
      setDeleteConfirm(null);
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(null);
      }
      toast.success('Inquiry deleted');
    } catch {
      toast.error('Failed to delete inquiry');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllInquiriesRead();
      setInquiries(c => c.map(i => ({ ...i, is_read: true, status: 'read' as const })));
      toast.success('All inquiries marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllInquiries();
      setInquiries([]);
      setClearAllConfirm(false);
      setSelectedInquiry(null);
      toast.success('All inquiries cleared');
    } catch {
      toast.error('Failed to clear inquiries');
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesSearch =
        inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        statusFilter === "All" ||
        (statusFilter === "Unread" && !inq.is_read) ||
        (statusFilter === "Read" && inq.is_read);

      return matchesSearch && matchesFilter;
    });
  }, [inquiries, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = inquiries.length;
    const unread = inquiries.filter((i) => !i.is_read).length;
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const thisWeek = inquiries.filter((i) => new Date(i.created_at).getTime() > sevenDaysAgo).length;

    return { total, unread, thisWeek };
  }, [inquiries]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Contact Inquiries</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">View and respond to customer questions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Inquiries</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unread Messages</p>
            <h3 className="text-3xl font-extrabold text-[#0055FE] mt-1">{stats.unread}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0055FE]">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">This Week</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.thisWeek}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-medium pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] transition-all shadow-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#0055FE] cursor-pointer min-w-[140px] shadow-xs"
        >
          <option value="All">All Inquiries</option>
          <option value="Unread">Unread</option>
          <option value="Read">Read</option>
        </select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0}
            className="bg-white border-slate-200 text-[#0055FE] hover:bg-blue-50 text-xs font-bold gap-2 rounded-xl"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            onClick={() => setClearAllConfirm(true)}
            disabled={stats.total === 0}
            className="bg-white border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-bold gap-2 rounded-xl"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Main Table Area */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
          <Loader2 className="w-8 h-8 text-[#0055FE] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Loading inquiries…</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No inquiries found</h3>
          <p className="text-xs font-medium text-slate-400">Contact submissions will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="w-10 pl-5 py-3.5"></th>
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Phone</th>
                  <th className="py-3.5 px-5">Message</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className={`hover:bg-slate-50/70 transition-colors ${!inq.is_read ? "bg-blue-50/20" : ""}`}
                  >
                    <td className="pl-5 py-4">
                      {!inq.is_read && (
                        <span className="block w-2.5 h-2.5 rounded-full bg-[#0055FE]" />
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <span className={`font-bold ${!inq.is_read ? "text-slate-900" : "text-slate-700"}`}>
                        {inq.name}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-slate-500 font-semibold">{inq.email}</td>
                    <td className="py-4 px-5 text-slate-500">{inq.phone || '—'}</td>

                    <td className="py-4 px-5 text-slate-600 max-w-[260px] truncate">
                      {inq.message}
                    </td>

                    <td className="py-4 px-5 text-slate-400 font-medium">{formatDate(inq.created_at)}</td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInquiry(inq)}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => markAsRead(inq.id, !inq.is_read)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            !inq.is_read
                              ? "bg-blue-50 text-[#0055FE] hover:bg-blue-100"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          title={!inq.is_read ? "Mark Read" : "Mark Unread"}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: inq.id, name: inq.name })}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedInquiry(null)} />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1">{selectedInquiry.subject || "Inquiry Details"}</h3>
            <p className="text-xs font-semibold text-slate-400 mb-6 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Received on {formatDateTime(selectedInquiry.created_at)}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">From</p>
                  <p className="text-xs font-bold text-slate-900">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Email</p>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-xs font-semibold text-[#0055FE] hover:underline break-all">
                    {selectedInquiry.email}
                  </a>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Phone</p>
                  <a href={`tel:${selectedInquiry.phone}`} className="text-xs font-semibold text-[#0055FE] hover:underline">
                    {selectedInquiry.phone || '—'}
                  </a>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Status</p>
                  <Badge className={`text-[10px] font-bold px-2 py-0.5 uppercase border ${selectedInquiry.is_read ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-blue-50 text-[#0055FE] border-blue-200"}`}>
                    {selectedInquiry.is_read ? "Read" : "Unread"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Message</p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end border-t border-slate-100 pt-4">
              {!selectedInquiry.is_read ? (
                <Button
                  onClick={() => markAsRead(selectedInquiry.id, true)}
                  className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Mark Read
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => markAsRead(selectedInquiry.id, false)}
                  className="border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Mark Unread
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedInquiry(null)}
                className="border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Inquiry?</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Are you sure you want to delete inquiry from <span className="font-bold text-slate-900">&ldquo;{deleteConfirm.name}&rdquo;</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="border-slate-200 text-slate-600 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {clearAllConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setClearAllConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Clear All Inquiries?</h3>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-6">
              Are you sure you want to delete all inquiry records? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setClearAllConfirm(false)}
                className="border-slate-200 text-slate-600 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearAll}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
