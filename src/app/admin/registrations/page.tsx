"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Eye, Search, Clock, Copy, CheckCircle2, Loader2, Trash2, Key, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveRegistrationRequest,
  rejectRegistrationRequest,
  deleteRegistrationRequest,
  fetchRegistrationRequests,
} from "@/lib/registration-actions";
import type { DbRegistrationRequest } from "@/lib/supabase/types";
import { toast } from "sonner";

function extractRequestedRole(request: { role: string; message: string | null }): string {
  if (request.message && request.message.startsWith('[Requested Role: ')) {
    const match = request.message.match(/^\[Requested Role:\s*([^\]]+)\]/);
    if (match && match[1]) return match[1];
  }
  return request.role;
}

function formatRoleLabel(roleStr: string) {
  switch (roleStr) {
    case 'buyer': return 'Buyer';
    case 'seller': return 'Seller';
    case 'content_manager': return 'Content Manager';
    case 'inspection_manager': return 'Inspector';
    default: return roleStr.replace('_', ' ');
  }
}

function generateRandomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass + "1!";
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

export default function RegistrationsPage() {
  const [requests, setRequests] = useState<DbRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  
  // Modals
  const [selected, setSelected] = useState<DbRegistrationRequest | null>(null);
  const [approveModalRequest, setApproveModalRequest] = useState<DbRegistrationRequest | null>(null);
  const [deleteModalRequest, setDeleteModalRequest] = useState<DbRegistrationRequest | null>(null);

  // Approval Form State
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Success Result State
  const [approvalResult, setApprovalResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = filter === "all" ? undefined : filter;
      const result = await fetchRegistrationRequests(statusFilter);
      setRequests(Array.isArray(result) ? result : (result as any)?.data ?? []);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const filtered = requests.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
  );

  const openApproveModal = (req: DbRegistrationRequest) => {
    setApproveModalRequest(req);
    setPasswordInput(generateRandomPassword());
    setAdminNotesInput("");
    setSelected(null);
  };

  const handleConfirmApproval = async () => {
    if (!approveModalRequest) return;
    if (!passwordInput || passwordInput.trim().length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setActionLoading(true);
    try {
      const result = await approveRegistrationRequest(
        approveModalRequest.id,
        passwordInput.trim(),
        adminNotesInput.trim() || undefined
      );
      setApprovalResult({ email: result.email, tempPassword: result.tempPassword });
      setApproveModalRequest(null);
      loadRequests();
      toast.success("Account approved and credentials generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve registration");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await rejectRegistrationRequest(id);
      toast.success("Registration request rejected");
      setSelected(null);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalRequest) return;
    setActionLoading(true);
    try {
      await deleteRegistrationRequest(deleteModalRequest.id);
      toast.success("Registration request deleted permanently");
      setDeleteModalRequest(null);
      setSelected(null);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request");
    } finally {
      setActionLoading(false);
    }
  };

  const copyPassword = async () => {
    if (!approvalResult) return;
    try {
      await navigator.clipboard.writeText(approvalResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy password");
    }
  };

  const tabs: { label: string; value: FilterTab }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  const badgeColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registration Requests</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Review user registration requests and set default portal access passwords.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === tab.value
                  ? "bg-white text-[#0055FE] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-medium pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Name</th>
                <th className="py-3.5 px-5">Email</th>
                <th className="py-3.5 px-5">Requested Role</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0055FE] mx-auto mb-2" />
                    <p className="text-xs font-semibold">Loading registration requests…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    No registration requests found
                  </td>
                </tr>
              ) : filtered.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0055FE] flex items-center justify-center text-xs font-bold shadow-xs">
                        {req.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900">{req.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-semibold">{req.email}</td>
                  <td className="py-4 px-5">
                    <Badge className="bg-slate-100 border-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                      {formatRoleLabel(extractRequestedRole(req))}
                    </Badge>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor(req.status)}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelected(req)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => openApproveModal(req)}
                            disabled={actionLoading}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                            title="Approve & Set Password"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteModalRequest(req)}
                        disabled={actionLoading}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Request"
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

      {/* Details View Modal */}
      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-extrabold text-slate-900">Registration Request Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0055FE] flex items-center justify-center text-lg font-bold">
                  {selected.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-slate-900 font-bold text-sm">{selected.name}</div>
                  <div className="text-slate-500 text-xs font-semibold">{selected.email}</div>
                  {selected.phone && <div className="text-slate-400 text-xs">{selected.phone}</div>}
                </div>
                <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor(selected.status)}`}>
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested Role</div>
                  <div className="text-slate-900 font-bold text-xs">{formatRoleLabel(extractRequestedRole(selected))}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted Date</div>
                  <div className="text-slate-900 font-bold text-xs">{new Date(selected.created_at).toLocaleString()}</div>
                </div>
              </div>

              {selected.message && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Applicant Message / Reason</div>
                  <div className="text-slate-700 text-xs font-medium whitespace-pre-wrap">{selected.message}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {selected.status === "pending" && (
                <>
                  <Button
                    onClick={() => openApproveModal(selected)}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Set Password
                  </Button>
                  <Button
                    onClick={() => handleReject(selected.id)}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs h-10 rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                </>
              )}
              <Button
                onClick={() => { setDeleteModalRequest(selected); setSelected(null); }}
                variant="outline"
                className="border-slate-200 text-rose-600 hover:bg-rose-50 font-bold text-xs h-10 rounded-xl cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval & Password Setup Modal */}
      {approveModalRequest && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setApproveModalRequest(null)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Approve Registration</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Set portal login credentials for applicant.</p>
              </div>
              <button onClick={() => setApproveModalRequest(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{approveModalRequest.name}</span>
                  <Badge className="bg-blue-100 text-[#0055FE] border-blue-200 text-[10px] font-bold uppercase">
                    {formatRoleLabel(extractRequestedRole(approveModalRequest))}
                  </Badge>
                </div>
                <div className="text-[11px] font-semibold text-slate-600">{approveModalRequest.email}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="passwordInput" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#0055FE]" />
                    Set Default Login Password <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setPasswordInput(generateRandomPassword())}
                    className="text-[11px] font-bold text-[#0055FE] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>

                <div className="relative">
                  <Input
                    id="passwordInput"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 rounded-xl text-xs font-mono font-bold pr-10 focus:bg-white focus:border-[#0055FE]"
                    placeholder="Enter default login password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-[10px] font-medium text-slate-400">Admin can share this default password with the user for their initial login.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotesInput" className="text-xs font-bold text-slate-700">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotesInput"
                  rows={2}
                  value={adminNotesInput}
                  onChange={e => setAdminNotesInput(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0055FE]"
                  placeholder="Optional notes regarding approval..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setApproveModalRequest(null)}
                className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-10 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApproval}
                disabled={actionLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl shadow-xs cursor-pointer"
              >
                {actionLoading ? "Approving..." : "Confirm & Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalRequest && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setDeleteModalRequest(null)} />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Delete Registration Request?</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">
              Are you sure you want to permanently delete registration request for <span className="font-bold text-slate-900">&ldquo;{deleteModalRequest.name}&rdquo;</span> ({deleteModalRequest.email})? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalRequest(null)}
                className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-10 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer shadow-xs"
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Credentials Result Modal */}
      {approvalResult && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setApprovalResult(null)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Account Created & Approved!</h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              Portal account created for <span className="text-slate-900 font-bold">{approvalResult.email}</span>. Share these login credentials:
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-2 text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Login Password</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white text-emerald-700 font-mono text-xs px-3 py-2 rounded-lg border border-slate-200 font-bold select-all">
                  {approvalResult.tempPassword}
                </code>
                <button
                  onClick={copyPassword}
                  className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                  title="Copy password"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={() => setApprovalResult(null)}
              className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer shadow-xs"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
