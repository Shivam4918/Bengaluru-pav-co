"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sound } from "@/lib/sound";
import { X, Search, Bell, Clock, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState("");
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/realtime")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeOrders) {
          setActiveOrders(data.activeOrders);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookup = async (tokenOrId: string) => {
    sound.playClickTick();
    const query = tokenOrId.trim();
    if (!query) {
      setError("Please enter a token number (e.g. 101) or order ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find matching order in active or query api
      const target = activeOrders.find(
        (o) => String(o.tokenNo) === query || o.orderNumber.toLowerCase() === query.toLowerCase() || o.id === query
      );

      if (target) {
        onClose();
        router.push(`/order/${target.id}`);
        return;
      }

      // Query API directly
      const res = await fetch(`/api/orders/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          onClose();
          router.push(`/order/${data.order.id}`);
          return;
        }
      }

      setError(`Could not find active ticket for "${query}". Try checking your receipt for the token number.`);
    } catch {
      setError("Failed to fetch order details. Please check your token number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Live Token Tracker</h3>
              <p className="text-[11px] text-slate-400">Track kitchen frying status & audio buzzer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Field */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Enter Token / Order Number
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup(tokenInput)}
                placeholder="e.g. 101 or MPC-20261021-0101"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <button
              onClick={() => handleLookup(tokenInput)}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow"
            >
              Track
            </button>
          </div>
          {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
        </div>

        {/* Quick Pick Active Orders */}
        {activeOrders.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Live Frying Tickets Right Now ({activeOrders.length})
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleLookup(order.id)}
                  className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm font-black text-orange-400 font-mono">
                      #{order.tokenNo}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {order.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {order.orderType} • {order.items?.length || 1} items
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-orange-400">
                    <span>{order.status}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
