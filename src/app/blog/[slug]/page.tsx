import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate, calculateReadTime } from '@/lib/blog-utils';
import { BlogCard } from '@/components/blog-card';
import { BlogTOC } from '@/components/blog-toc';
import { BlogShare } from '@/components/blog-share';
import { BlogNewsletter } from '@/components/blog-newsletter';
import { ChevronRight, Clock, User, Calendar } from 'lucide-react';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const fallbackPosts = [
  {
    id: '1',
    slug: 'first-blog',
    title: 'Latest Car Trends 2026',
    excerpt: 'Discover the newest trends in the automotive industry for 2026.',
    content: `
      <h2>The Future of Automotive Technology</h2>
      <p>The automotive industry is undergoing a massive transformation in 2026. Electric vehicles are becoming mainstream, and autonomous driving technology is advancing at an unprecedented pace.</p>
      
      <h3>Electric Vehicle Adoption</h3>
      <p>More than 50% of new car sales are expected to be electric by the end of the year. This shift is driven by both consumer demand and regulatory changes.</p>
      
      <h3>Autonomous Features</h3>
      <p>Level 3 autonomous driving is now available in multiple production vehicles, offering hands-free driving in certain conditions.</p>
      
      <p>Stay tuned for more updates as we continue to cover the latest in automotive innovation.</p>
    `,
    featured_image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000',
    published_at: new Date().toISOString(),
    views_count: 1200,
    categories: { name: 'News', slug: 'news' },
    category_id: '1',
    author: { name: 'John Doe', avatar_url: null, bio: 'Automotive journalist with 10+ years of experience covering the industry.' },
    author_id: '1',
    tags: ['electric', 'trends', '2026'],
    allow_comments: false,
    meta_title: 'Latest Car Trends 2026 | Car Fever',
    meta_description: 'Discover the newest trends in the automotive industry for 2026.',
  },
  {
    id: '2',
    slug: 'second-blog',
    title: 'Electric Vehicles: The Future',
    excerpt: 'Everything you need to know about electric vehicles and their impact.',
    content: `
      <h2>Why Electric Vehicles Are Here to Stay</h2>
      <p>Electric vehicles (EVs) represent the future of transportation. With zero tailpipe emissions and lower operating costs, they are quickly replacing traditional gasoline-powered cars.</p>
      
      <h3>Benefits of EVs</h3>
      <ul>
        <li>Lower fuel costs</li>
        <li>Reduced maintenance</li>
        <li>Environmental benefits</li>
        <li>Quiet and smooth operation</li>
      </ul>
      
      <h3>Charging Infrastructure</h3>
      <p>The charging network is expanding rapidly, making EV ownership more convenient than ever before.</p>
      
      <p>Join us as we explore the electric future of automobiles.</p>
    `,
    featured_image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    views_count: 850,
    categories: { name: 'Electric', slug: 'electric' },
    category_id: '2',
    author: { name: 'Jane Smith', avatar_url: null, bio: 'EV enthusiast and technology writer focused on sustainable transportation.' },
    author_id: '2',
    tags: ['electric', 'future', 'sustainability'],
    allow_comments: true,
    meta_title: 'Electric Vehicles: The Future | Car Fever',
    meta_description: 'Everything you need to know about electric vehicles and their impact.',
  },
];

export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('blogs')
    .select('slug')
    .eq('status', 'published');
  
  const staticSlugs = (posts || []).map((post) => ({
    slug: String(post.slug),
  }));
  
  // Add our fallback slugs
  const fallbackSlugs = fallbackPosts.map(post => ({ slug: String(post.slug) }));
  
  return [...staticSlugs, ...fallbackSlugs];
}

async function getPost(slug: string) {
  // First check if it's a fallback post
  const fallbackPost = fallbackPosts.find(p => p.slug === slug);
  if (fallbackPost) return fallbackPost;
  
  // Otherwise try to fetch from Supabase
  const { data: post, error } = await supabase
    .from('blogs')
    .select(`
      *,
      categories (name, slug)
    `)
    .eq('slug', slug)
    .single();

  if (error || !post) return null;
  return post;
}

async function getRelatedPosts(categoryId: string, currentPostId: string) {
  const fallbackRelated = fallbackPosts.filter(p => p.id !== currentPostId && p.category_id === categoryId).slice(0, 3);
  if (fallbackRelated.length > 0) return fallbackRelated;
  
  const { data } = await supabase
    .from('blogs')
    .select(`
      id, slug, title, excerpt, featured_image, published_at, views_count,
      categories (name, slug)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .neq('id', currentPostId)
    .limit(3);
    
  return data || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.meta_title || `${post.title} | Car Fever Blog`,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
      images: post.featured_image ? [post.featured_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = post.category_id ? await getRelatedPosts(post.category_id, post.id) : [];
  const readTime = calculateReadTime(post.content);
  
  const shareUrl = `https://carfever.com/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        <nav className="flex items-center text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2 shrink-0" />
          <Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
          {post.categories && (
            <>
              <ChevronRight className="w-4 h-4 mx-2 shrink-0" />
              <Link href={`/blog/category/${post.categories.slug}`} className="hover:text-gray-900 transition-colors">
                {post.categories.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4 mx-2 shrink-0" />
          <span className="text-gray-900 truncate">{post.title}</span>
        </nav>

        <header className="max-w-4xl mx-auto mb-12 text-center">
          {post.categories && (
            <Link href={`/blog/category/${post.categories.slug}`}>
              <span className="inline-block rounded-full bg-blue-50 text-[#0055FE] border border-blue-100 px-4 py-1.5 text-sm font-semibold mb-6 hover:bg-[#0055FE] hover:text-white transition-colors">
                {post.categories.name}
              </span>
            </Link>
          )}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-8 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                {post.author?.avatar_url ? (
                  <Image src={post.author.avatar_url} alt={post.author.name} width={40} height={40} className="object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <span className="font-medium text-gray-900">{post.author?.name || 'Car Fever Team'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{post.published_at ? formatDate(post.published_at) : 'Draft'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readTime} min read</span>
            </div>
          </div>
          
          <div className="flex justify-center mb-10">
            <BlogShare url={shareUrl} title={post.title} />
          </div>
        </header>

        <div className="max-w-5xl mx-auto mb-16 relative aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
          <Image
            src={post.featured_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop'}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 xl:col-span-9">
            <article className="prose max-w-none 
              prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl
              prose-a:text-[#0055FE] hover:prose-a:text-blue-700
              prose-img:rounded-xl prose-img:border prose-img:border-gray-200
              prose-hr:border-gray-200
              prose-blockquote:border-[#0055FE] prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200"
            >
              {post.content.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : (
                <div className="whitespace-pre-wrap font-sans">{post.content}</div>
              )}
            </article>

            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-500">Tags:</span>
                {post.tags.map((tag: string) => (
                  <Link key={tag} href={`/blog/tag/${tag}`}>
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-[#0055FE] hover:text-[#0055FE] transition-colors shadow-sm">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-12 p-8 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-gray-100">
                {post.author?.avatar_url ? (
                  <Image src={post.author.avatar_url} alt={post.author.name} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Written by {post.author?.name || 'Car Fever Team'}</h3>
                <p className="text-gray-500 mb-4">{post.author?.bio || 'Automotive enthusiast and reviewer bringing you the latest updates from the performance and luxury car world.'}</p>
                <Link href={`/blog/author/${post.author_id || 'team'}`} className="text-[#0055FE] hover:text-blue-700 text-sm font-medium">
                  View all posts by this author →
                </Link>
              </div>
            </div>

            <div className="mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-[#0055FE] pl-4">Comments</h3>
              {post.allow_comments ? (
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 text-center text-gray-500">
                  <p className="mb-4">Comments are currently disabled for this post.</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">Comments are turned off for this post.</p>
              )}
            </div>

          </div>

          <div className="lg:col-span-4 xl:col-span-3">
            <BlogTOC content={post.content} />
          </div>
        </div>

      </div>

      {relatedPosts.length > 0 && (
        <div className="mt-24 border-t border-gray-200 pt-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {relatedPosts.map((relatedPost: any) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 mt-24">
        <BlogNewsletter />
      </div>
    </div>
  );
}
