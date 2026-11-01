"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentSessionUser, setSessionUser, AuthUser } from "@/lib/auth";
import { sound } from "@/lib/sound";
import {
  ChefHat,
  Monitor,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface StaffStationHeaderProps {
  stationName: string;
  badgeLabel: string;
  stationRole: "KITCHEN_STAFF" | "CASHIER" | "ADMIN";
}

export default function StaffStationHeader({
  stationName,
  badgeLabel,
  stationRole,
}: StaffStationHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getCurrentSessionUser());
  }, []);

  const handleLogout = async () => {
    sound.playClickTick();
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
    router.push("/staff/login");
  };

  const navLinks = [
    { href: "/kds", label: "Kitchen KDS", icon: ChefHat, allowed: ["KITCHEN_STAFF", "ADMIN"] },
    { href: "/pos", label: "Express POS", icon: Monitor, allowed: ["CASHIER", "ADMIN"] },
    { href: "/admin", label: "Admin HQ", icon: LayoutDashboard, allowed: ["ADMIN"] },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Station Brand Title */}
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg hover:bg-orange-500/30 transition-colors"
              title="Return to Customer Storefront"
            >
              🌶️
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm sm:text-base text-white">
                  MUMBAI PAV CO.
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                  {badgeLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">{stationName}</p>
            </div>
          </div>

          {/* Permitted Station Links for Staff */}
          <div className="hidden md:flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const canAccess = user ? link.allowed.includes(user.role) : true;

              if (!canAccess) return null;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    isActive
                      ? "bg-orange-500 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">
                {user ? user.name : "Staff Member"}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                ● Active Station Duty
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-500/20 hover:text-red-400 text-slate-300 border border-slate-800 text-xs font-bold transition-colors"
              title="Log out of station"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout Station</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
