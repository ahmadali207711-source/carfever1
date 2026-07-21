"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SellCarForm } from "@/components/sell-car-form";

export default function SellCarPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 lg:pt-28 pb-20 bg-slate-50 font-sans text-slate-900 px-4 sm:px-6 lg:px-8">
        <SellCarForm isSellerPortal={false} />
      </main>
      <Footer />
    </>
  );
}
