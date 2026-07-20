import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Clock, User } from 'lucide-react';
import { formatDate } from '@/lib/blog-utils';

export interface BlogCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    featured_image?: string;
    published_at: string;
    views_count?: number;
    categories?: {
      name: string;
      slug: string;
    };
    author?: {
      name: string;
      avatar_url?: string;
    };
  };
  featured?: boolean;
}

export const BlogCard = React.memo(function BlogCard({ post, featured = false }: BlogCardProps) {
  // Calculate estimated read time without needing full content (assume ~1000 chars = 1 min)
  const estimatedReadTime = Math.max(1, Math.ceil((post.excerpt?.length || 500) / 1000 + 2));

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-gray-200 transition-all hover:border-[#0055FE]/30 hover:shadow-md ${featured ? 'md:flex-row md:items-center' : ''}`}>
      <div className={`relative overflow-hidden aspect-video ${featured ? 'md:w-1/2 md:aspect-[4/3]' : 'w-full'}`}>
        <Link href={`/blog/${post.slug}`} className="block h-full w-full relative">
          <Image
            src={post.featured_image || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop'}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          />
        </Link>
        {post.categories && (
          <div className="absolute top-4 left-4 z-10">
            <Link href={`/blog/category/${post.categories.slug}`} className="inline-block">
              <span className="inline-block rounded-full bg-[#0055FE] px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                {post.categories.name}
              </span>
            </Link>
          </div>
        )}
      </div>
      
      <div className={`flex flex-col flex-1 p-6 ${featured ? 'md:w-1/2 md:p-8 md:justify-center' : ''}`}>
        <Link href={`/blog/${post.slug}`}>
          <h3 className={`font-bold text-gray-900 transition-colors group-hover:text-[#0055FE] line-clamp-2 ${featured ? 'text-2xl md:text-3xl mb-3' : 'text-xl mb-2'}`}>
            {post.title}
          </h3>
        </Link>
        
        <p className={`text-gray-500 mb-6 flex-1 ${featured ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
          {post.excerpt || 'Read more about this exciting update in the automotive world.'}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
              {post.author?.avatar_url ? (
                <Image src={post.author.avatar_url} alt={post.author.name} width={32} height={32} className="object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                {post.author?.name || 'Car Fever Team'}
              </span>
              <span className="text-[10px] text-gray-500">
                {post.published_at ? formatDate(post.published_at) : 'Just now'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-gray-500 gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{estimatedReadTime} min read</span>
          </div>
        </div>
      </div>
    </div>
  );
});
