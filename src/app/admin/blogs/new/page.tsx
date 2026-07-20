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
    return <div className="text-white text-center py-20">Loading blog details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/blogs">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {id ? 'Edit Post' : 'Create New Post'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={(e) => handleSubmit(e, false)} 
            disabled={loading}
            className="border-zinc-800 text-white hover:bg-zinc-800"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={(e) => handleSubmit(e, true)} 
            disabled={loading} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <form className="space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Content</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">Post Title <span className="text-red-500">*</span></Label>
              <Input id="title" name="title" required value={formData.title} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-lg" placeholder="Enter post title" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-zinc-300">URL Slug <span className="text-red-500">*</span></Label>
              <Input id="slug" name="slug" required value={formData.slug} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="post-url-slug" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id" className="text-zinc-300">Category</Label>
              <Select value={formData.category_id || ''} onValueChange={(val) => handleSelectChange('category_id', String(val))}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
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
              <Label htmlFor="excerpt" className="text-zinc-300">Excerpt</Label>
              <Textarea 
                id="excerpt" 
                name="excerpt" 
                value={formData.excerpt} 
                onChange={handleChange} 
                className="bg-zinc-950 border-zinc-800 resize-y" 
                placeholder="Brief summary of the post..." 
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-zinc-300">Content <span className="text-red-500">*</span></Label>
              <Textarea 
                id="content" 
                name="content" 
                required
                value={formData.content} 
                onChange={handleChange} 
                className="bg-zinc-950 border-zinc-800 resize-y font-mono text-sm" 
                placeholder="Write your content here (Markdown or HTML supported)..." 
                rows={15}
              />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Featured Image</h3>
          
          <div className="space-y-4">
            {featuredImage ? (
              <div className="relative aspect-video max-w-xl rounded-md overflow-hidden bg-zinc-950 border border-zinc-800">
                <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="aspect-video max-w-xl rounded-md border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-zinc-400 hover:text-zinc-300">
                {uploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-4" />
                    <span>Click to upload featured image</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">SEO Settings</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title" className="text-zinc-300">Meta Title</Label>
              <Input id="meta_title" name="meta_title" value={formData.meta_title} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="SEO Title" />
              <p className="text-xs text-zinc-500">Leave blank to use post title.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meta_description" className="text-zinc-300">Meta Description</Label>
              <Textarea 
                id="meta_description" 
                name="meta_description" 
                value={formData.meta_description} 
                onChange={handleChange} 
                className="bg-zinc-950 border-zinc-800" 
                placeholder="SEO Description" 
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus_keyword" className="text-zinc-300">Focus Keyword</Label>
              <Input id="focus_keyword" name="focus_keyword" value={formData.focus_keyword} onChange={handleChange} className="bg-zinc-950 border-zinc-800" placeholder="e.g. luxury cars 2024" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
