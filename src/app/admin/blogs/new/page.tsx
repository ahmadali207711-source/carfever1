'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createBlog, updateBlog, uploadImage } from '@/lib/admin-actions';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function EditBlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    status: 'draft',
    allow_comments: true
  });

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchBlog();
    }
  }, [id]);

  async function fetchCategories() {
    const supabase = createClient();
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  async function fetchBlog() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          category_id: data.category_id || '',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          focus_keyword: data.focus_keyword || '',
          status: data.status || 'draft',
          allow_comments: data.allow_comments !== false
        });
        setFeaturedImage(data.featured_image || '');
      }
    } catch (error) {
      toast.error('Failed to fetch blog details');
      router.push('/admin/blogs');
    } finally {
      setFetching(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title if title is being edited and we're creating new
    if (name === 'title' && !id) {
      setFormData(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFeaturedImage(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isPublish = false) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        featured_image: featuredImage,
        status: (isPublish ? 'published' : formData.status) as 'draft' | 'published' | 'scheduled',
        ...(isPublish ? { published_at: new Date().toISOString() } : {})
      };

      if (id) {
        await updateBlog(id, dataToSave);
        toast.success(isPublish ? 'Blog published successfully' : 'Blog updated successfully');
      } else {
        await createBlog(dataToSave);
        toast.success(isPublish ? 'Blog published successfully' : 'Blog created successfully');
      }
      router.push('/admin/blogs');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-slate-500 text-center py-20 text-xs font-semibold">Loading blog details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/blogs" prefetch={false}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {id ? 'Edit Blog Post' : 'Create New Post'}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Draft, format, and publish your content.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={(e) => handleSubmit(e, false)} 
            disabled={loading}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl shadow-xs"
          >
            <Save className="w-4 h-4 mr-2 text-slate-500" />
            Save Draft
          </Button>
          <Button 
            onClick={(e) => handleSubmit(e, true)} 
            disabled={loading} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-500/20"
          >
            <Eye className="w-4 h-4 mr-2" />
            Publish Post
          </Button>
        </div>
      </div>

      <form className="space-y-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Post Content</h3>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-slate-700">Post Title <span className="text-rose-500">*</span></Label>
              <Input id="title" name="title" required value={formData.title} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="Enter post title" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-xs font-bold text-slate-700">URL Slug <span className="text-rose-500">*</span></Label>
              <Input id="slug" name="slug" required value={formData.slug} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="post-url-slug" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id" className="text-xs font-bold text-slate-700">Category</Label>
              <Select value={formData.category_id || ''} onValueChange={(val) => handleSelectChange('category_id', String(val))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                  {categories.length === 0 && <SelectItem value="uncategorized" disabled>No categories available</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt" className="text-xs font-bold text-slate-700">Excerpt</Label>
              <Textarea 
                id="excerpt" 
                name="excerpt" 
                value={formData.excerpt} 
                onChange={handleChange} 
                className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium resize-y focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" 
                placeholder="Brief summary of the post..." 
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-xs font-bold text-slate-700">Content <span className="text-rose-500">*</span></Label>
              <Textarea 
                id="content" 
                name="content" 
                required
                value={formData.content} 
                onChange={handleChange} 
                className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-mono resize-y focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" 
                placeholder="Write your content here (Markdown or HTML supported)..." 
                rows={14}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Featured Image</h3>
          
          <div className="space-y-4">
            {featuredImage ? (
              <div className="relative aspect-video max-w-xl rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-3 right-3 text-xs font-bold rounded-xl shadow-xs"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="aspect-video max-w-xl rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
                {uploading ? (
                  <span className="text-xs font-bold text-slate-500">Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">Click to upload featured image</span>
                    <span className="text-[11px] text-slate-400 mt-1">PNG, JPG or WEBP up to 5MB</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">SEO Settings</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title" className="text-xs font-bold text-slate-700">Meta Title</Label>
              <Input id="meta_title" name="meta_title" value={formData.meta_title} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="SEO Title" />
              <p className="text-[11px] text-slate-400">Leave blank to use post title.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meta_description" className="text-xs font-bold text-slate-700">Meta Description</Label>
              <Textarea 
                id="meta_description" 
                name="meta_description" 
                value={formData.meta_description} 
                onChange={handleChange} 
                className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" 
                placeholder="SEO Description" 
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus_keyword" className="text-xs font-bold text-slate-700">Focus Keyword</Label>
              <Input id="focus_keyword" name="focus_keyword" value={formData.focus_keyword} onChange={handleChange} className="bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE]" placeholder="e.g. luxury cars 2024" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
