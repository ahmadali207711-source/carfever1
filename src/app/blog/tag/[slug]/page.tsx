import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogCard } from '@/components/blog-card';
import { Button } from '@/components/ui/button';
import { Hash } from 'lucide-react';
import Link from 'next/link';

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
    tags: ['electric', 'trends', '2026'],
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
    tags: ['electric', 'future', 'sustainability'],
  },
];

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Fetch all tags from blogs
  const { data: posts } = await supabase
    .from('blogs')
    .select('tags')
    .eq('status', 'published');
  
  // Collect all unique tags
  const allTags = new Set<string>();
  (posts || []).forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag: string) => allTags.add(tag));
    }
  });
  
  // Collect fallback tags
  const fallbackTags = new Set<string>();
  fallbackPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => fallbackTags.add(tag));
    }
  });
  
  // Combine and return (filter out nulls and convert to string)
  return Array.from([...allTags, ...fallbackTags]).filter(Boolean).map(tag => ({ slug: String(tag) }));
}

async function getTagData(slug: string) {
  // First check fallback posts
  const fallbackTagged = fallbackPosts.filter(post => post.tags && post.tags.includes(slug));
  if (fallbackTagged.length > 0) {
    return { tag: slug, posts: fallbackTagged };
  }
  
  // Supabase JSONB querying for tags array
  const { data: posts } = await supabase
    .from('blogs')
    .select(`
      id, slug, title, excerpt, featured_image, published_at, views_count, tags,
      categories (name, slug),
      author:author_id (name, avatar_url)
    `)
    .eq('status', 'published')
    .contains('tags', [slug])
    .order('published_at', { ascending: false });

  return { tag: slug, posts: posts || [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `#${resolvedParams.slug} Archives | Car Fever Blog`,
    description: `Browse all articles tagged with #${resolvedParams.slug} on Car Fever.`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { tag, posts } = await getTagData(resolvedParams.slug);

  if (!posts.length) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">#{tag}</h1>
          <div className="py-20 bg-white shadow-sm rounded-2xl border border-gray-200 max-w-3xl mx-auto">
            <p className="text-gray-500 text-lg mb-6">No articles found with this tag.</p>
            <Link href="/blog">
              <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        <header className="max-w-3xl mx-auto text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-6">
            <Hash className="w-8 h-8 text-[#0055FE]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 capitalize">
            {tag}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
            <span>{posts.length} {posts.length === 1 ? 'Article' : 'Articles'}</span>
          </div>
        </header>

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

      </div>
    </div>
  );
}
