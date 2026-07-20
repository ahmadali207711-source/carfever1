"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-4 z-50 p-3 rounded-full bg-neon-red/90 backdrop-blur-sm text-white shadow-lg shadow-neon-red/30 hover:bg-neon-red transition-all duration-200 active:scale-90 animate-in fade-in zoom-in-90 duration-200 lg:bottom-6 lg:right-6 touch-manipulation"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
