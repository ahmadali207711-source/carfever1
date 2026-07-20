import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogCard } from '@/components/blog-card';
import { Button } from '@/components/ui/button';
import { User, Link as LinkIcon, FileText, Eye, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/blog-utils';

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

const fallbackAuthors = [
  {
    id: '1',
    name: 'John Doe',
    bio: 'Automotive journalist with 10+ years of experience covering the industry.',
    avatar_url: null,
    created_at: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
    posts: fallbackPosts.filter(p => p.author.name === 'John Doe'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    bio: 'EV enthusiast and technology writer focused on sustainable transportation.',
    avatar_url: null,
    created_at: new Date(Date.now() - 63072000000).toISOString(), // 2 years ago
    posts: fallbackPosts.filter(p => p.author.name === 'Jane Smith'),
  },
  {
    id: 'team',
    name: 'Car Fever Team',
    bio: 'The editorial team at Car Fever bringing you the latest in automotive excellence.',
    avatar_url: null,
    created_at: new Date(Date.now() - 94608000000).toISOString(), // 3 years ago
    posts: fallbackPosts,
  },
];

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  // Fetch unique author IDs from blogs
  const { data: posts } = await supabase
    .from('blogs')
    .select('author_id')
    .eq('status', 'published');
  
  // Get unique author IDs (filter out nulls and ensure strings)
  const uniqueAuthorIds = [...new Set((posts || []).map(post => post.author_id).filter(Boolean))];
  
  // Add fallback author IDs
  const fallbackIds = fallbackAuthors.map(a => ({ id: String(a.id) }));
  
  return [...uniqueAuthorIds.map(id => ({ id: String(id) })), ...fallbackIds];
}

async function getAuthorData(id: string) {
  // First check if it's a fallback author
  const fallbackAuthor = fallbackAuthors.find(a => a.id === id);
  if (fallbackAuthor) {
    return { author: fallbackAuthor, posts: fallbackAuthor.posts };
  }
  
  // In a real app we'd fetch from profiles/users table
  // Since we only have blogs here, we will fetch their info from the posts or mock if it's the 'team' fallback
  
  if (id === 'team') {
    const { data: posts } = await supabase
      .from('blogs')
      .select(`
        id, slug, title, excerpt, featured_image, published_at, views_count,
        categories (name, slug),
        author:author_id (name, avatar_url)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
      
    return {
      author: {
        id: 'team',
        name: 'Car Fever Team',
        bio: 'The editorial team at Car Fever bringing you the latest in automotive excellence.',
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
      posts: posts || []
    };
  }

  // Fallback for actual users (mocking this since we don't have a users table in schema provided)
  const { data: posts } = await supabase
    .from('blogs')
    .select(`
      id, slug, title, excerpt, featured_image, published_at, views_count,
      categories (name, slug),
      author:author_id (name, avatar_url, bio)
    `)
    .eq('author_id', id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (!posts || posts.length === 0) return null;

  const author = posts[0].author;
  if (!author) return null;

  return { author, posts };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getAuthorData(resolvedParams.id);
  if (!data) return { title: 'Author Not Found' };

  return {
    title: `${(data.author as any).name} | Car Fever Authors`,
    description: (data.author as any).bio || `Read articles written by ${(data.author as any).name} on Car Fever.`,
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const resolvedParams = await params;
  const data = await getAuthorData(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { author: rawAuthor, posts } = data;
  const author = rawAuthor as { name: string; bio?: string | null; avatar_url?: string | null; created_at?: string };
  const totalViews = posts.reduce((acc, post) => acc + (post.views_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Author Header */}
        <header className="max-w-4xl mx-auto mb-20 bg-white border border-gray-200 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shrink-0 bg-gray-50 flex items-center justify-center shadow-md">
              {author.avatar_url ? (
                <Image src={author.avatar_url} alt={author.name} width={160} height={160} className="object-cover w-full h-full" />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{author.name}</h1>
              <p className="text-lg text-gray-500 mb-6 max-w-2xl">
                {author.bio || 'Automotive enthusiast contributing to Car Fever.'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
                <a href="#" className="p-2.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#0055FE] hover:border-[#0055FE]/30 transition-colors">
                  <LinkIcon className="w-4 h-4" />
                </a>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                <div className="flex flex-col">
                  <span className="flex items-center text-xs text-gray-500 mb-1"><FileText className="w-3 h-3 mr-1" /> Total Articles</span>
                  <span className="text-xl font-bold text-gray-900">{posts.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center text-xs text-gray-500 mb-1"><Eye className="w-3 h-3 mr-1" /> Total Views</span>
                  <span className="text-xl font-bold text-gray-900">{totalViews.toLocaleString()}</span>
                </div>
                <div className="flex flex-col col-span-2 md:col-span-1">
                  <span className="flex items-center text-xs text-gray-500 mb-1"><Calendar className="w-3 h-3 mr-1" /> Member Since</span>
                  <span className="text-base font-medium text-gray-900">{formatDate(author.created_at || new Date().toISOString())}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Author's Posts */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-[#0055FE] pl-4">Articles by {author.name}</h2>
          
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
        </section>

      </div>
    </div>
  );
}
