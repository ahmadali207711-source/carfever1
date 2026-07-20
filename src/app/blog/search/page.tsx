import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { BlogCard } from '@/components/blog-card';
import { BlogSearch } from '@/components/blog-search';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Search Blog | Car Fever',
  description: 'Search through our automotive articles and reviews.',
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogSearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';

  let posts: any[] = [];
  
  if (query) {
    const { data } = await supabase
      .from('blogs')
      .select(`
        id, slug, title, excerpt, content, featured_image, published_at, views_count,
        categories (name, slug),
        author:author_id (name, avatar_url)
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .order('published_at', { ascending: false });
      
    posts = data || [];
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        
        <header className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Search Results</h1>
          <div className="flex justify-center mb-8">
            <BlogSearch />
          </div>
          {query && (
            <p className="text-lg text-gray-500">
              Found <span className="text-gray-900 font-medium">{posts.length}</span> results for "<span className="text-gray-900 font-medium">{query}</span>"
            </p>
          )}
        </header>

        {!query ? (
          <div className="text-center py-20 bg-white shadow-sm rounded-2xl border border-gray-200 max-w-3xl mx-auto">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Enter a search term above to find articles.</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map(post => (
                <BlogCard key={post.id} post={post} />
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
            <p className="text-gray-500 text-lg mb-6">No articles found matching your criteria.</p>
            <p className="text-sm text-gray-400">Try adjusting your search or checking for typos.</p>
          </div>
        )}

      </div>
    </div>
  );
}
