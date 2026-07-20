'use client';

import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function BlogTOC({ content }: { content: string }) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // In a real implementation with a markdown parser, we would extract headings properly.
    // Here we'll simulate it or use a simple regex on HTML content if provided.
    // For this example, assuming headings are rendered with IDs in the DOM.
    const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'));
    
    const extractedHeadings: TOCItem[] = elements.map((element) => {
      // Ensure element has an ID
      if (!element.id) {
        element.id = element.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
      }
      return {
        id: element.id,
        text: element.textContent || '',
        level: element.tagName === 'H2' ? 2 : 3,
      };
    });

    setHeadings(extractedHeadings);

    // Setup intersection observer for highlighting active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    elements.forEach((elem) => observer.observe(elem));
    
    return () => observer.disconnect();
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-6 hidden lg:block shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">Table of Contents</h3>
      <nav>
        <ul className="space-y-3">
          {headings.map((heading) => (
            <li 
              key={heading.id} 
              className={`${heading.level === 3 ? 'ml-4' : ''}`}
            >
              <a
                href={`#${heading.id}`}
                className={`text-sm transition-colors block ${
                  activeId === heading.id 
                    ? 'text-[#0055FE] font-medium' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                  setActiveId(heading.id);
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
