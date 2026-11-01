"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import { OrderData } from "@/lib/types";
import { sound } from "@/lib/sound";
import {
  CheckCircle2,
  Clock,
  Flame,
  ShoppingBag,
  Bell,
  MapPin,
  Utensils,
  ChevronRight,
  PhoneCall,
  MessageSquare,
  ArrowLeft,
  Volume2,
} from "lucide-react";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastBuzzedStatus, setLastBuzzedStatus] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Poll order status every 3 seconds for real-time live synchronization
  useEffect(() => {
    let isMounted = true;

    async function fetchOrderStatus() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.order && isMounted) {
          setOrder(data.order);

          // If order is READY_FOR_PICKUP and wasn't buzzed yet
          if (
            data.order.status === "READY_FOR_PICKUP" &&
            lastBuzzedStatus !== "READY_FOR_PICKUP"
          ) {
            setLastBuzzedStatus("READY_FOR_PICKUP");
            if (soundEnabled) {
              sound.playOrderReadyChime();
            }
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {}
          }
        }
      } catch (err) {
        console.error("Tracking poll error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, lastBuzzedStatus, soundEnabled]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading your live kadai ticket...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Could not locate ticket details for &ldquo;{orderId}&rdquo;. Please verify the order number.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-orange-500/20"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  // Define steps
  const isDelivery = order.orderType === "DELIVERY";

  const STEPS = [
    { id: "CONFIRMED", label: "Order Confirmed", desc: "Ticket received at kitchen", icon: CheckCircle2 },
    { id: "PREPARING", label: "Kadai Frying", desc: "Hot vadas & butter pav in the pan", icon: Flame },
    {
      id: "READY_FOR_PICKUP",
      label: isDelivery ? "Packed for Rider" : "Ready at Counter",
      desc: isDelivery ? "Waiting for rider pickup" : "Please collect your hot token!",
      icon: Bell,
    },
    {
      id: "COMPLETED",
      label: isDelivery ? "Delivered" : "Order Completed",
      desc: "Enjoy authentic Mumbai street taste!",
      icon: CheckCircle2,
    },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return 0;
      case "CONFIRMED":
        return 0;
      case "PREPARING":
        return 1;
      case "READY_FOR_PICKUP":
      case "OUT_FOR_DELIVERY":
        return 2;
      case "COMPLETED":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isReady = order.status === "READY_FOR_PICKUP";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Unified Enterprise Navbar */}
      <Navbar />

      {/* Top Tracking Subheader */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) sound.playClickTick();
              }}
              className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1.5 ${
                soundEnabled
                  ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{soundEnabled ? "Buzzer ON" : "Muted"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* Big Digital Token Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 text-center transition-all ${
            isReady
              ? "bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/60 shadow-2xl shadow-emerald-500/20"
              : "bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border-slate-800 shadow-xl"
          }`}
        >
          {/* Sizzling badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-3">
            <span>Ticket:</span>
            <span className="font-mono text-orange-400 font-bold">{order.orderNumber}</span>
          </div>

          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Your Digital Counter Token
          </div>

          {/* High visibility Token Number */}
          <div className="my-2">
            <span
              className={`text-5xl sm:text-7xl font-black tracking-tight ${
                isReady
                  ? "text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-pulse"
                  : "text-white"
              }`}
            >
              #{order.tokenNo}
            </span>
          </div>

          {/* Dynamic Status Callout */}
          <div className="mt-2">
            {isReady ? (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm shadow-lg animate-bounce">
                <Bell className="w-4 h-4" />
                <span>HOT & READY FOR PICKUP!</span>
              </div>
            ) : order.status === "PREPARING" ? (
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-xs">
                <Flame className="w-3.5 h-3.5 animate-bounce" />
                <span>Fresh in Kadai • Frying right now</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Order confirmed. In queue for kadai frying.</div>
            )}
          </div>

          {/* Fulfillment Mode Pill */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              {order.orderType === "DINE_IN" ? (
                <>
                  <Utensils className="w-3.5 h-3.5 text-orange-400" />
                  <span>Dine-In • {order.tableNo || "Counter Seat"}</span>
                </>
              ) : order.orderType === "DELIVERY" ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>Direct Delivery • Bengaluru {order.deliveryPincode}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Takeaway • {order.pickupSlot || "Immediate Counter"}</span>
                </>
              )}
            </div>
            <div className="text-slate-500">•</div>
            <div className="text-slate-400">
              {order.paymentStatus === "PAID" ? (
                <span className="text-emerald-400 font-semibold">✓ Paid Online (Razorpay)</span>
              ) : (
                <span className="text-amber-400 font-semibold">Pay at Counter (₹{order.totalAmount.toFixed(0)})</span>
              )}
            </div>
          </div>
        </div>

        {/* Live Step Progress Tracker */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Live Kitchen Tracking
          </h3>

          <div className="relative">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPassed = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.id} className="flex items-start space-x-4 relative pb-7 last:pb-0">
                  {/* Connecting line */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 -bottom-1 w-0.5 transition-colors ${
                        idx < currentStepIdx ? "bg-orange-500" : "bg-slate-800"
                      }`}
                    />
                  )}

                  {/* Icon Circle */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20"
                        : isPassed
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Text Description */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-bold ${
                          isCurrent ? "text-white" : isPassed ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 animate-pulse">
                          Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticket Line Items
            </h3>
            <span className="text-xs text-slate-400">{order.items?.length || 0} items</span>
          </div>

          <div className="space-y-3 divide-y divide-slate-800/80">
            {order.items?.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {item.quantity}x {item.itemTitle}
                  </div>
                  {(() => {
                    if (!item.selectedModifiersJson) return null;
                    try {
                      const parsed = typeof item.selectedModifiersJson === "string" 
                        ? JSON.parse(item.selectedModifiersJson) 
                        : item.selectedModifiersJson;
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {parsed.map((m: any) => m.name || m.title || "").filter(Boolean).join(", ")}
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                </div>
                <div className="text-sm font-bold text-slate-200">
                  ₹{item.totalPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Bill summary */}
          <div className="pt-4 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>5% GST</span>
              <span>₹{order.gstAmount.toFixed(2)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
              <span>Total Paid / Payable</span>
              <span className="text-orange-400">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Need Help / Contact */}
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <div className="font-semibold text-slate-200">Mumbai Pav Co. Koramangala Hub</div>
            <div className="text-[11px]">Questions about your order? Call our fry counter at +91 84694 28342.</div>
          </div>
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
            <a
              href="tel:+918469428342"
              className="flex-1 sm:flex-none justify-center flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold border border-slate-700 transition-colors"
              title="Call Store at +91 84694 28342"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Store</span>
            </a>
            <a
              href={`https://wa.me/918469428342?text=${encodeURIComponent(
                `Hi Mumbai Pav Co, I have a query about my order #${order.tokenNo || order.orderNumber || ''}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none justify-center flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold border border-emerald-500/30 transition-colors"
              title="Chat on WhatsApp at +91 84694 28342"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
