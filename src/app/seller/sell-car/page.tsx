"use client";

import { SellCarForm } from "@/components/sell-car-form";

export default function SellerSellCarPage() {
  return (
    <div className="py-4">
      <SellCarForm isSellerPortal={true} />
    </div>
  );
}
