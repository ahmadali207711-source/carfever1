"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Car,
  MessageSquare,
  ShieldCheck,
  FileText,
  ExternalLink,
  Settings,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAdminAnalytics } from "@/lib/admin-actions";
import Link from "next/link";

interface RealStats {
  totalUsers: number;
  totalCars: number;
  approvedCars: number;
  pendingCars: number;
  totalInquiries: number;
  totalInspections: number;
  totalBlogs: number;
  publishedBlogs: number;
  totalViews: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<RealStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAdminAnalytics();
        setStats({
          totalUsers: data.totalUsers,
          totalCars: data.totalCars,
          approvedCars: data.totalCars,
          pendingCars: 0,
          totalInquiries: data.totalInquiries,
          totalInspections: 0,
          totalBlogs: data.totalBlogs,
          publishedBlogs: data.totalBlogs,
          totalViews: data.totalViews,
        });
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statCards = [
    { label: "Total Views",    value: loading ? "…" : stats?.totalViews.toLocaleString() ?? 0,    icon: Eye,          color: "text-[#0055FE]", bg: "bg-blue-50" },
    { label: "Car Listings",   value: loading ? "…" : stats?.totalCars.toLocaleString() ?? 0,     icon: Car,          color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Registered Users",value: loading ? "…" : stats?.totalUsers.toLocaleString() ?? 0,    icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Blog Articles",  value: loading ? "…" : stats?.totalBlogs.toLocaleString() ?? 0,    icon: FileText,     color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Inquiries",      value: loading ? "…" : stats?.totalInquiries.toLocaleString() ?? 0,icon: MessageSquare,color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Analytics</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Real-time marketplace metrics and performance insights.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Google Analytics 4</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Integrated analytics tracking page views, sessions, and visitor demographics.
            </p>
          </div>
          <Link
            href="https://analytics.google.com"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            Open GA Console <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
