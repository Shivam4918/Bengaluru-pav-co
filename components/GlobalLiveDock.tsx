"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { sound } from "@/lib/sound";
import { getCurrentSessionUser, AuthUser } from "@/lib/auth";
import {
  Flame,
  Bell,
  ChefHat,
  Monitor,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Lock,
  Search,
} from "lucide-react";

export default function GlobalLiveDock() {
  const [activeCount, setActiveCount] = useState(0);
  const [readyTokens, setReadyTokens] = useState<any[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [myRecentOrder, setMyRecentOrder] = useState<any>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);

  // Poll realtime bus every 3.5s
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setCollapsed(true);
    }
    setSessionUser(getCurrentSessionUser());
    async function poll() {
      try {
        const res = await fetch("/api/realtime");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setActiveCount(data.activeOrders?.length || 0);
          setReadyTokens(data.readyTokens || []);
          if (data.store) {
            setStoreOpen(data.store.isStoreOpen);
          }
        }
      } catch {}

      // Check local storage for customer's most recent order
      if (typeof window !== "undefined") {
        const lastOrderId = localStorage.getItem("mpc_last_order_id");
        if (lastOrderId) {
          try {
            const oRes = await fetch(`/api/orders/${lastOrderId}`);
            if (oRes.ok) {
              const oData = await oRes.json();
              if (isMounted && oData.order) {
                setMyRecentOrder(oData.order);
              }
            }
          } catch {}
        }
      }
    }

    poll();
    const interval = setInterval(poll, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const latestReady = readyTokens[0];

  return (
    <aside
      aria-label="Live Kitchen Pulse"
      className="fixed bottom-20 right-3 sm:bottom-4 sm:right-4 z-40 max-w-[calc(100vw-24px)] sm:max-w-sm w-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header Strip */}
        <div className="px-3.5 py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  storeOpen ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  storeOpen ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
            </span>
            <span className="font-bold text-white text-[11px] tracking-wide uppercase">
              Live Kitchen Pulse
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setSoundOn(!soundOn);
                if (!soundOn) sound.playClickTick();
              }}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Toggle audio buzzer"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-orange-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Body Content */}
        {!collapsed && (
          <div className="p-3 space-y-2.5 text-xs">
            {/* Active Kadai Frying & Ready Pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold">
                <Flame className="w-3.5 h-3.5 animate-bounce" />
                <span>{activeCount} frying in kadai</span>
              </div>

              {latestReady ? (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold animate-pulse">
                  <Bell className="w-3.5 h-3.5" />
                  <span>#{latestReady.tokenNo} Ready!</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500">All caught up</span>
              )}
            </div>

            {/* If Customer has an active order */}
            {myRecentOrder && myRecentOrder.status !== "COMPLETED" && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-950/60 to-slate-900 border border-orange-500/40 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    Your Active Ticket
                  </div>
                  <div className="text-sm font-black text-white">
                    Token #{myRecentOrder.tokenNo}
                    <span className="text-[10px] font-semibold text-slate-400 ml-1.5">
                      ({myRecentOrder.status})
                    </span>
                  </div>
                </div>
                <Link
                  href={`/order/${myRecentOrder.id}`}
                  className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] shadow"
                >
                  View Live
                </Link>
              </div>
            )}

            {/* Quick Links depending on Role */}
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              {sessionUser && sessionUser.role !== "CUSTOMER" ? (
                <>
                  <span className="text-slate-500 font-semibold">{sessionUser.role}:</span>
                  <div className="flex items-center space-x-2 font-bold text-orange-400">
                    <Link href="/kds" className="hover:underline">KDS</Link>
                    <span>•</span>
                    <Link href="/pos" className="hover:underline">POS</Link>
                    <span>•</span>
                    <Link href="/admin" className="hover:underline">HQ</Link>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-slate-500 font-medium">Customer Portal</span>
                  <Link
                    href="/staff/login"
                    className="flex items-center space-x-1 text-slate-400 hover:text-white"
                  >
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>Staff Login</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
