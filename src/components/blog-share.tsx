'use client';

import { Share2, Link as LinkIcon, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BlogShareProps {
  url: string;
  title: string;
}

export function BlogShare({ url, title }: BlogShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = [
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      color: 'hover:text-amber-500 hover:bg-amber-500/10',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-500 mr-2">Share this article:</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`Share on ${link.name}`}
          className={`p-2 rounded-full text-gray-500 bg-white border border-gray-200 shadow-sm transition-colors ${link.color}`}
        >
          <link.icon className="w-4 h-4" />
        </a>
      ))}
      <button
        onClick={copyToClipboard}
        title="Copy Link"
        className="p-2 rounded-full text-gray-500 bg-white border border-gray-200 shadow-sm transition-colors hover:text-[#0055FE] hover:bg-[#0055FE]/5 hover:border-[#0055FE]/30"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
