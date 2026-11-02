"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import TrackOrderModal from "./TrackOrderModal";
import TableQRModal from "./TableQRModal";
import CustomerAuthModal from "./CustomerAuthModal";
import { getCurrentSessionUser, setSessionUser, AuthUser } from "@/lib/auth";
import { sound } from "@/lib/sound";
import {
  ShoppingBag,
  Flame,
  Search,
  QrCode,
  User,
  Gift,
  Shield,
  ChevronDown,
} from "lucide-react";

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
  isStoreOpen?: boolean;
  activeQueueCount?: number;
  onReorder?: (items: any[]) => void;
}

export default function Navbar({
  cartCount = 0,
  onOpenCart,
  isStoreOpen = true,
  activeQueueCount = 0,
  onReorder,
}: NavbarProps) {
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const local = getCurrentSessionUser();
    if (local) {
      setCurrentUser(local);
    }
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          setSessionUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Brand Identity */}
            <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-base sm:text-xl shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
                🌶️
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-sm sm:text-lg md:text-xl tracking-tight text-white truncate">
                    BENGALURU <span className="text-orange-500">PAV CO.</span>
                  </span>
                  <span className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full flex-shrink-0">
                    Koramangala Hub
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block truncate">
                  Artisanal Street Vada Pav & Chai • Bengaluru
                </p>
              </div>
            </Link>

            {/* Customer Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link
                href="/#menu"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Street Menu</span>
              </Link>

              <button
                onClick={() => {
                  sound.playClickTick();
                  setIsTrackModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <Search className="w-4 h-4 text-orange-400" />
                <span>Track Order</span>
              </button>

              <button
                onClick={() => {
                  sound.playClickTick();
                  setIsQRModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Dine-In Table QR</span>
              </button>
            </nav>

            {/* Right Tools: Live Pill, Auth & Cart */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Live Kitchen Status Pill */}
              <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isStoreOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span className="text-slate-300 font-semibold text-[11px]">
                  {isStoreOpen ? "Hot Fryers Live" : "Closed"}
                </span>
                {activeQueueCount > 0 && (
                  <span className="bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                    {activeQueueCount} frying
                  </span>
                )}
              </div>

              {/* Customer Account & Loyalty Profile */}
              {currentUser ? (
                <button
                  onClick={() => {
                    sound.playClickTick();
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs transition-colors flex-shrink-0"
                >
                  <div className="w-6 h-6 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-white text-xs leading-none">
                      {currentUser.name.split(" ")[0]}
                    </div>
                    {currentUser.role === "CUSTOMER" ? (
                      <div className="text-[10px] text-amber-400 font-semibold">
                        {currentUser.loyaltyPoints} pts
                      </div>
                    ) : (
                      <div className="text-[10px] text-orange-400 font-bold">
                        Staff: {currentUser.role}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playClickTick();
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex-shrink-0"
                >
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Cart Drawer Trigger */}
              {onOpenCart && (
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex-shrink-0"
                  aria-label="View Cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Kadai</span>
                  {cartCount > 0 && (
                    <span className="w-5 h-5 bg-white text-orange-600 text-[11px] font-black rounded-full flex items-center justify-center shadow">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Customer Links Row */}
          <div className="flex md:hidden items-center justify-around py-1.5 border-t border-slate-800/80 text-xs">
            <Link
              href="/#menu"
              className="flex items-center space-x-1 font-bold text-slate-300 hover:text-orange-400 py-1.5 px-2 rounded-lg transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Menu</span>
            </Link>
            <button
              onClick={() => {
                sound.playClickTick();
                setIsTrackModalOpen(true);
              }}
              className="flex items-center space-x-1 font-bold text-slate-300 hover:text-orange-400 py-1.5 px-2 rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-orange-400" />
              <span>Track Ticket</span>
            </button>
            <button
              onClick={() => {
                sound.playClickTick();
                setIsQRModalOpen(true);
              }}
              className="flex items-center space-x-1 font-bold text-slate-300 hover:text-emerald-400 py-1.5 px-2 rounded-lg transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Table QR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Customer Modals */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />

      <TableQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onSelectTable={() => {}}
      />

      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        onReorder={onReorder}
      />
    </>
  );
}
