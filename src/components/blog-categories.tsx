import Link from 'next/link';
import { Layers } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

export function BlogCategories({ categories }: { categories: Category[] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((category) => (
        <Link 
          key={category.id} 
          href={`/blog/category/${category.slug}`}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#0055FE]/30 hover:bg-gray-50 hover:shadow-sm transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-[#0055FE]/10 transition-colors">
            <Layers className="w-5 h-5 text-gray-500 group-hover:text-[#0055FE] transition-colors" />
          </div>
          <h3 className="font-medium text-gray-900 text-center mb-1">{category.name}</h3>
          <span className="text-xs text-gray-500">{category.post_count || 0} Articles</span>
        </Link>
      ))}
    </div>
  );
}
