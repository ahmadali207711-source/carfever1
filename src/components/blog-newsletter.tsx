'use client';

import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function BlogNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      toast.success('Successfully subscribed to newsletter!');
      
      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="bg-[#0055FE] rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto overflow-hidden relative shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-[#00B67A]/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="w-16 h-16 bg-[#00B67A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border border-[#00B67A]/50">
          <Mail className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Stay in the Fast Lane
        </h2>
        <p className="text-blue-100 max-w-lg mx-auto mb-8">
          Subscribe to the Car Fever newsletter for the latest automotive news, expert reviews, and exclusive marketplace offers delivered straight to your inbox.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status !== 'idle'}
            className="h-12 bg-white text-gray-900 border-transparent focus-visible:ring-white placeholder:text-gray-400"
          />
          <Button 
            type="submit" 
            disabled={status !== 'idle'}
            className={`h-12 px-8 ${status === 'success' ? 'bg-[#00B67A] hover:bg-emerald-500' : 'bg-[#FF6B00] hover:bg-orange-600'} text-white transition-colors border-none`}
          >
            {status === 'loading' ? 'Subscribing...' : 
             status === 'success' ? <><CheckCircle className="w-4 h-4 mr-2" /> Subscribed</> : 
             'Subscribe'}
          </Button>
        </form>
        <p className="text-xs text-blue-200 mt-4">
          We care about your data in our privacy policy. No spam, ever.
        </p>
      </div>
    </div>
  );
}
