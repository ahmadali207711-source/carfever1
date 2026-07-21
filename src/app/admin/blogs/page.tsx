'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, Eye, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminBlogs, deleteBlog, publishBlog } from '@/lib/admin-actions';

function StatusBadge({ status }: { status: string }) {
  const isPub = status === 'published';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
      isPub ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
    }`}>
      {isPub ? 'Published' : 'Draft'}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
      <p className="text-xs font-medium text-slate-400">Page {page} of {totalPages}</p>
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

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 450);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminBlogs(debounced, page);
      setBlogs(result.data || []);
      setTotalPages(result.totalPages);
    } catch {
      toast.error('Failed to load blogs');
    }
    setLoading(false);
  }, [debounced, page]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post permanently?')) return;
    try { await deleteBlog(id); toast.success('Deleted'); setBlogs(b => b.filter(x => x.id !== id)); }
    catch { toast.error('Delete failed'); }
  };

  const handlePublish = async (id: string) => {
    setPublishing(id);
    try {
      await publishBlog(id);
      toast.success('Published!');
      setBlogs(b => b.map(x => x.id === id ? { ...x, published: true, published_at: new Date().toISOString() } : x));
    } catch { toast.error('Publish failed'); }
    setPublishing(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Blog Posts</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage articles, reviews, and platform insights.</p>
        </div>
        <Link href="/admin/blogs/new" prefetch={false}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0055FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Write Post
        </Link>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className="w-full bg-white border border-slate-200 rounded-xl text-xs font-medium pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] transition-all shadow-xs"
          placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Post</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Published</th>
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
                    <td className="py-4 px-5"><div className="h-4 w-24 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : blogs.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                  No posts found. <Link href="/admin/blogs/new" prefetch={false} className="text-[#0055FE] font-bold underline">Write one</Link>
                </td></tr>
              ) : blogs.map(blog => (
                <tr key={blog.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-slate-900 text-xs max-w-xs truncate">{blog.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(blog.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-semibold">{blog.category || 'Uncategorized'}</td>
                  <td className="py-4 px-5"><StatusBadge status={blog.published ? 'published' : 'draft'} /></td>
                  <td className="py-4 px-5 text-slate-500">{blog.created_at ? new Date(blog.created_at).toLocaleDateString() : '—'}</td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/blogs/new?id=${blog.id}`} prefetch={false} title="Edit"
                        className="p-2 rounded-xl bg-blue-50 text-[#0055FE] hover:bg-blue-100 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <Link href={`/blog/${blog.slug || blog.id}`} prefetch={false} target="_blank" title="Preview"
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {!blog.published && (
                        <button onClick={() => handlePublish(blog.id)} disabled={publishing === blog.id} title="Publish"
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer">
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(blog.id)} title="Delete"
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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