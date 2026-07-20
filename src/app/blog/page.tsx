import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'

export const revalidate = 3600

export default async function BlogPage() {
  const supabase = await createServerClient()

  const { data: posts, error } = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, content, featured_image, status, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching blogs:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">Latest from Our Blog</h1>

        {!posts || posts.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-xl transition">
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-3 line-clamp-2">{post.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.published_at || post.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.ceil((post.content?.length || 0) / 200)} min read
                    </div>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-[#0055FE] font-semibold hover:underline"
                  >
                    Read More →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}