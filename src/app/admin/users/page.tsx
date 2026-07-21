'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  Eye,
  Loader2,
  Users as UsersIcon,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  FileText,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateUserStatus, fetchAllUsers, getAdminProfile } from '@/lib/admin-actions';
import type { DbUser, UserStatus, UserRole } from '@/lib/supabase/types';

const STATUS_STYLE: Record<UserStatus, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
};

const ROLE_STYLE: Record<UserRole, string> = {
  buyer:               'bg-blue-50 text-blue-700 border-blue-200',
  seller:              'bg-purple-50 text-purple-700 border-purple-200',
  admin:               'bg-rose-50 text-rose-700 border-rose-200',
  content_manager:     'bg-teal-50 text-teal-700 border-teal-200',
  inspection_manager:  'bg-orange-50 text-orange-700 border-orange-200',
};

const ROLE_LABEL: Record<UserRole, string> = {
  buyer:               'Buyer',
  seller:              'Seller',
  admin:               'Admin',
  content_manager:     'Content Mgr',
  inspection_manager:  'Inspection Mgr',
};

function getInitial(name: string): string {
  return (name?.trim()?.[0] ?? '?').toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProfileModal({
  user,
  onClose,
}: {
  user: DbUser;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows: { label: string; value: React.ReactNode; icon: React.ReactNode }[] = [
    { label: 'Email',          icon: <Mail className="w-3.5 h-3.5" />,      value: user.email },
    { label: 'Phone',          icon: <Phone className="w-3.5 h-3.5" />,     value: user.phone ?? '—' },
    { label: 'Role',           icon: <ShieldCheck className="w-3.5 h-3.5"/>,value: (
        <Badge className={`text-[10px] font-bold px-2 py-0.5 uppercase border ${ROLE_STYLE[user.role]}`}>
          {ROLE_LABEL[user.role]}
        </Badge>
      )},
    { label: 'Status',         icon: <Clock className="w-3.5 h-3.5" />,     value: (
        <Badge className={`text-[10px] font-bold px-2 py-0.5 uppercase border ${STATUS_STYLE[user.status]}`}>
          {user.status}
        </Badge>
      )},
    { label: 'Listings',       icon: <FileText className="w-3.5 h-3.5" />,  value: user.listings_count },
    { label: 'Last Login',     icon: <Clock className="w-3.5 h-3.5" />,     value: formatDateTime(user.last_login) },
    { label: 'Member Since',   icon: <Calendar className="w-3.5 h-3.5" />,  value: formatDate(user.created_at) },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">User Profile</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 px-6 py-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0055FE] to-emerald-500 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitial(user.name)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{user.id}</p>
          </div>
        </div>

        {user.bio && (
          <div className="mx-6 mb-4 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-600 leading-relaxed">{user.bio}</p>
          </div>
        )}

        <div className="px-6 pb-6 space-y-3">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                {row.icon}
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {row.label}
                </span>
              </div>
              <div className="text-xs text-slate-700 text-right truncate max-w-[55%] font-medium">
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users,       setUsers]       = useState<DbUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<DbUser | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  useEffect(() => {
    getAdminProfile().then(p => setCurrentAdmin(p)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllUsers(debouncedSearch || undefined, page);
      setUsers(result.data as DbUser[]);
      setTotalUsers(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(() => ({
    total:     totalUsers,
    active:    users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    sellers:   users.filter(u => u.role === 'seller').length,
  }), [users, totalUsers]);

  const handleToggleStatus = async (user: DbUser) => {
    const nextStatus: UserStatus =
      user.status === 'active' ? 'suspended' : 'active';

    setUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, status: nextStatus } : u)),
    );
    setTogglingId(user.id);

    try {
      await updateUserStatus(user.id, nextStatus);
      toast.success(
        nextStatus === 'suspended'
          ? `${user.name} has been suspended.`
          : `${user.name} is now active.`,
      );
    } catch (err: any) {
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, status: user.status } : u)),
      );
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          User Management
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Monitor and manage registered platform users.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',  value: stats.total,     color: 'text-slate-900' },
          { label: 'Active',       value: stats.active,    color: 'text-emerald-600' },
          { label: 'Suspended',    value: stats.suspended, color: 'text-rose-600' },
          { label: 'Sellers',      value: stats.sellers,   color: 'text-purple-600' },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className={`text-2xl font-extrabold mt-2 ${s.color}`}>
              {loading ? (
                <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl text-xs font-medium pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] transition-all shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Contact</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Joined</th>
                <th className="py-3.5 px-5">Listings</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 bg-slate-200 rounded" />
                          <div className="h-2.5 w-20 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="h-3 w-20 bg-slate-100 rounded" />
                      </td>
                    ))}
                    <td className="py-4 px-5">
                      <div className="flex justify-end gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    <UsersIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      {searchQuery ? 'No users match your search.' : 'No users registered yet.'}
                    </p>
                  </td>
                </tr>
              )}

              {!loading && users.map(user => {
                const isToggling = togglingId === user.id;
                const isSelf = currentAdmin && (
                  user.id === currentAdmin.id ||
                  (user.email && currentAdmin.email && user.email.toLowerCase() === currentAdmin.email.toLowerCase())
                );

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/70 transition-colors ${isSelf ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0055FE] to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden shadow-xs">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitial(user.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                              {user.name}
                            </p>
                            {isSelf && (
                              <Badge className="bg-blue-100 text-[#0055FE] border-blue-200 text-[9px] font-extrabold px-1.5 py-0">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                            {user.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {user.phone ?? '—'}
                      </p>
                    </td>

                    <td className="py-4 px-5">
                      <Badge
                        className={`text-[10px] font-bold px-2.5 py-0.5 uppercase border ${ROLE_STYLE[user.role]}`}
                      >
                        {ROLE_LABEL[user.role]}
                      </Badge>
                    </td>

                    <td className="py-4 px-5">
                      <Badge
                        className={`text-[10px] font-bold px-2.5 py-0.5 uppercase border ${STATUS_STYLE[user.status]}`}
                      >
                        {user.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-5 text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="py-4 px-5 text-xs font-bold text-slate-800">
                      {user.listings_count}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setProfileUser(user)}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (isSelf) {
                              toast.info('You cannot suspend your own active admin account.');
                              return;
                            }
                            handleToggleStatus(user);
                          }}
                          disabled={isToggling || isSelf}
                          className={`p-2 rounded-xl border transition-all ${
                            isSelf
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                              : user.status === 'active'
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 cursor-pointer'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                          }`}
                          title={
                            isSelf
                              ? 'You cannot suspend your own account'
                              : user.status === 'active'
                              ? 'Suspend User'
                              : 'Activate User'
                          }
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : user.status === 'active' ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Page <span className="text-slate-800 font-bold">{page}</span> of{' '}
              <span className="text-slate-800 font-bold">{totalPages}</span> ({totalUsers} total)
            </p>
            <div className="flex items-center gap-2">
              {totalPages > 1 && (
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <button onClick={fetchUsers}
                className="text-xs font-bold text-[#0055FE] hover:underline flex items-center gap-1 cursor-pointer">
                <Loader2 className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {profileUser && (
        <ProfileModal
          user={profileUser}
          onClose={() => setProfileUser(null)}
        />
      )}
    </div>
  );
}
