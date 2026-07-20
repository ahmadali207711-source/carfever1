import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogCard } from '@/components/blog-card';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

// Fallback data
const fallbackPosts = [
  {
    id: '1',
    slug: 'first-blog',
    title: 'Latest Car Trends 2026',
    excerpt: 'Discover the newest trends in the automotive industry for 2026.',
    featured_image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800',
    published_at: new Date().toISOString(),
    views_count: 1200,
    categories: { name: 'News', slug: 'news' },
    author: { name: 'John Doe', avatar_url: null },
  },
  {
    id: '2',
    slug: 'second-blog',
    title: 'Electric Vehicles: The Future',
    excerpt: 'Everything you need to know about electric vehicles and their impact.',
    featured_image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    views_count: 850,
    categories: { name: 'Electric', slug: 'electric' },
    author: { name: 'Jane Smith', avatar_url: null },
  },
];

const fallbackCategories = [
  { id: '1', name: 'News', slug: 'news', description: 'Latest automotive news and updates.' },
  { id: '2', name: 'Electric', slug: 'electric', description: 'Electric vehicle news, reviews, and guides.' },
  { id: '3', name: 'Reviews', slug: 'reviews', description: 'In-depth car reviews and comparisons.' },
];

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { data: categories } = await supabase
    .from('categories')
    .select('slug');
  
  // Add fallback category slugs
  const fallbackSlugs = fallbackCategories.map(cat => ({ slug: String(cat.slug) }));
  
  return [...(categories || []).map((cat) => ({ slug: String(cat.slug) })), ...fallbackSlugs];
}

async function getCategoryData(slug: string) {
  // Check if it's a fallback category
  const fallbackCat = fallbackCategories.find(cat => cat.slug === slug);
  if (fallbackCat) {
    const relatedPosts = fallbackPosts.filter(post => post.categories?.slug === slug);
    return { category: fallbackCat, posts: relatedPosts };
  }
  
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) return null;

  const { data: posts } = await supabase
    .from('blogs')
    .select(`
      id, slug, title, excerpt, featured_image, published_at, views_count,
      categories (name, slug),
      author:author_id (name, avatar_url)
    `)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return { category, posts: posts || [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getCategoryData(resolvedParams.slug);
  if (!data) return { title: 'Category Not Found' };

  return {
    title: `${data.category.name} Archives | Car Fever Blog`,
    description: data.category.description || `Browse all articles in the ${data.category.name} category on Car Fever.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const data = await getCategoryData(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  const { category, posts } = data;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        <header className="max-w-3xl mx-auto text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-6">
            <Layers className="w-8 h-8 text-[#0055FE]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-gray-500 mb-6">
              {category.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
            <span>{posts.length} {posts.length === 1 ? 'Article' : 'Articles'}</span>
          </div>
        </header>

        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map(post => (
                <BlogCard key={post.id} post={post as any} />
              ))}
            </div>
            {posts.length >= 9 && (
              <div className="flex justify-center">
                <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white shadow-sm rounded-2xl border border-gray-200 max-w-3xl mx-auto">
            <p className="text-gray-500 text-lg mb-4">No articles found in this category.</p>
            <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50">
              Back to Blog
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
