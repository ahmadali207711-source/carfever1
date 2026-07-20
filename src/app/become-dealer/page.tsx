"use client";

import { useState } from "react";
import { applyForDealer } from "@/lib/dealer-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, CheckCircle2, Loader2, Link as LinkIcon, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function BecomeDealerPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      company_name: formData.get("company_name") as string,
      license_number: formData.get("license_number") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      city: formData.get("city") as string,
      address: formData.get("address") as string,
      website: formData.get("website") as string,
      description: formData.get("description") as string,
      user_id: null, // Depending on your auth setup, you'd pull this from session. Using null for demo if unauthenticated.
      logo_url: null,
      business_hours: null,
    };

    try {
      await applyForDealer(data);
      setSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#F8F9FA] pt-32 pb-20 flex items-center justify-center">
          <div className="max-w-md mx-auto p-8 bg-white border border-gray-200 rounded-3xl text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Received!</h2>
          <p className="text-gray-500 mb-8">
            Thank you for applying to join our verified dealer network. Our team will review your details and contact you shortly.
          </p>
          <Link href="/">
            <Button className="w-full bg-[#0055FE] hover:bg-blue-700 h-12 text-base font-bold rounded-xl text-white">
              Return Home
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F9FA] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Become a <span className="text-[#0055FE]">Verified Dealer</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Join Pakistan's premier luxury car marketplace and reach thousands of high-intent buyers.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Company Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input required name="company_name" className="pl-10 h-12 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="Your Dealership Name" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Trade License Number *</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input required name="license_number" className="pl-10 h-12 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="Registration No." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input required type="email" name="email" className="pl-10 h-12 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="dealership@email.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input required type="tel" name="phone" className="pl-10 h-12 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="+92 3XX XXXXXXX" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input required name="city" className="pl-10 h-12 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="Lahore, Karachi, etc." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Website (Optional)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="url" name="website" className="pl-10 h-12 bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="https://www.yourdealer.com" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Complete Address *</label>
              <Textarea required name="address" className="min-h-[80px] bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="Full physical address of your showroom..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Dealership Description *</label>
              <Textarea required name="description" className="min-h-[120px] bg-white border-gray-200 text-gray-900 rounded-xl focus-visible:ring-[#0055FE]" placeholder="Tell buyers about your dealership, years of experience, types of cars you specialize in..." />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 bg-[#0055FE] hover:bg-blue-700 text-white text-base font-bold rounded-xl transition-all disabled:opacity-70">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>
    </main>
    <Footer />
  </>
  );
}
