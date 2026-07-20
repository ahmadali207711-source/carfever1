"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-xl">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/5 via-white to-[#0055FE]/5" />

          {/* Glow effects */}
          <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-[#FF6B00]/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-[#0055FE]/10 blur-[120px] rounded-full" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,85,254,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,85,254,0.1) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content */}
          <div className="relative px-6 sm:px-12 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="text-xs font-medium text-gray-700">
                Ready to sell? Get the best price
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Sell Your Car at the{" "}
              <span className="bg-gradient-to-r from-[#FF6B00] to-[#0055FE] bg-clip-text text-transparent">
                Best Price
              </span>
            </h2>

            <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">
              List your car for free and reach thousands of potential buyers.
              Our platform ensures you get the value your car deserves.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10 max-w-4xl mx-auto">
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 group-hover:bg-[#FF6B00]/10 group-hover:border-[#FF6B00]/30 transition-all duration-300">
                  <span className="text-2xl font-bold text-gray-900 group-hover:text-[#FF6B00]">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Details</h3>
                <p className="text-sm text-gray-600">Share your car's make, model, and condition.</p>
              </div>

              <div className="hidden md:block w-16 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 group-hover:bg-[#0055FE]/10 group-hover:border-[#0055FE]/30 transition-all duration-300">
                  <span className="text-2xl font-bold text-gray-900 group-hover:text-[#0055FE]">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Offers</h3>
                <p className="text-sm text-gray-600">Receive competitive offers from our network.</p>
              </div>

              <div className="hidden md:block w-16 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 group-hover:bg-[#00B67A]/10 group-hover:border-[#00B67A]/30 transition-all duration-300">
                  <span className="text-2xl font-bold text-gray-900 group-hover:text-[#00B67A]">3</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sell Instantly</h3>
                <p className="text-sm text-gray-600">Get paid instantly and securely.</p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Link href="/sell-car">
                <Button
                  size="lg"
                  className="bg-[#0055FE] hover:bg-blue-700 text-white font-semibold px-12 transition-all duration-300 h-14 text-lg rounded-full shadow-md"
                >
                  Sell Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
