'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Mail,
  UserIcon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageSquare,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Users,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitRegistrationRequest } from '@/lib/registration-actions';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Register - Car Fever',
  description: 'Submit a registration request to join Car Fever marketplace.',
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'content_manager' | 'inspection_manager'>('buyer');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Full name is required'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Valid email address is required'); return; }

    try {
      const result = await submitRegistrationRequest({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim() || undefined,
        role,
        message: message.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        const msg = result.error || 'Failed to submit request';
        if (msg.includes('Failed to fetch') || msg.includes('fetch failed')) {
          setError('Network connection issue. Please check your connection and try again.');
        } else {
          setError(msg);
        }
      }
    } catch (err: any) {
      setError('Network connection issue. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Request Received
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-4 mb-3">Registration Submitted!</h1>
            <p className="text-slate-600 leading-relaxed mb-2">
              Your request for <strong className="text-slate-900 capitalize">{role.replace('_', ' ')}</strong> role has been dispatched to the CarFever review team.
            </p>
            <p className="text-xs text-slate-400 mb-8">
              We review applications within 24 hours. You will receive your access credentials via email once approved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => router.push('/')} variant="outline" className="flex-1 border-slate-200 text-slate-700 font-bold h-12 rounded-2xl">
                Go to Home Page
              </Button>
              <Button onClick={() => router.push('/buy-car')} className="flex-1 bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 rounded-2xl shadow-lg shadow-blue-500/20">
                Browse Marketplace
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900">

        {/* ── LEFT PANEL: BRANDING & HERO SHOWCASE ── */}
        <div className="lg:w-1/2 bg-gradient-to-br from-[#0043cb] via-[#0055FE] to-[#0080ff] relative overflow-hidden p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white min-h-[400px] lg:min-h-screen">
          {/* Background Orbs */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white leading-none">
                  Car<span className="text-blue-200">Fever</span>
                </span>
                <span className="text-[10px] text-blue-100/80 tracking-[0.2em] uppercase font-semibold mt-1">
                  Registration Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-auto py-12 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Join Pakistan's Premier Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
              Apply for Account <br />
              & Access Controls
            </h1>

            <p className="text-base text-blue-100/90 leading-relaxed mb-8">
              Whether you are buying certified vehicles, listing inventory, managing content, or performing 200-point inspections, CarFever provides a dedicated portal.
            </p>

            {/* Role Features List */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-bold text-sm">
                  🔍
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Buyers & Sellers</h4>
                  <p className="text-xs text-blue-100/80">Instant vehicle search, inspection reports & direct deal closing</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-bold text-sm">
                  📝
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Content & Inspection Managers</h4>
                  <p className="text-xs text-blue-100/80">Manage blog posts, SEO configurations, and field inspections</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-blue-100/70">
            <span>© 2026 CarFever Inc.</span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> Verified Network
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL: LIGHT FORM ── */}
        <div className="lg:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between items-center relative overflow-y-auto">
          <div className="w-full max-w-md my-auto">

            {/* Back link */}
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0055FE] transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Home
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0055FE] hover:underline"
              >
                Sign In Instead
              </Link>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0055FE] mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Request Registration Access
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Fill in your details below. The administrator will review and activate your account.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 text-xs text-rose-700 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ali Ahmed"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Role Selection Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Requested Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'buyer', label: '🔍 Car Buyer', desc: 'Browse & Buy' },
                    { id: 'seller', label: '💰 Car Seller', desc: 'Post Listings' },
                    { id: 'content_manager', label: '📝 Content Manager', desc: 'Blogs & SEO' },
                    { id: 'inspection_manager', label: '🔍 Inspector', desc: 'Car Reports' },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRole(option.id as any)}
                      className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                        role === option.id
                          ? 'border-[#0055FE] bg-blue-50/70 text-[#0055FE] shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{option.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Message / Remarks (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <textarea
                    rows={2}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Brief note for the administrator..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0055FE] hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Application…
                  </span>
                ) : (
                  <>
                    <span>Submit Access Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Bottom links */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
              <div>
                Already registered?{' '}
                <Link href="/login" className="font-bold text-[#0055FE] hover:underline">
                  Sign in to portal
                </Link>
              </div>
            </div>

          </div>

          <div className="mt-6 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            CarFever Portal Registration
          </div>
        </div>

      </div>
    </>
  );
}
