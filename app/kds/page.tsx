"use client";

import React, { useState, useEffect } from "react";
import StaffStationHeader from "@/components/StaffStationHeader";
import { OrderData } from "@/lib/types";
import { sound } from "@/lib/sound";
import {
  ChefHat,
  Clock,
  Flame,
  CheckCircle2,
  Printer,
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<OrderData | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"ALL" | "INCOMING" | "PREPARING" | "READY">("ALL");

  const parseModifiersList = (json: string | null | undefined): string => {
    if (!json) return "";
    try {
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m: any) => m.name || m.title || "").filter(Boolean).join(", ");
      }
    } catch {}
    return "";
  };

  // Poll active orders every 3 seconds
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?limit=60");
      if (!res.ok) return;
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("KDS fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter columns
  const incomingOrders = orders.filter((o) => o.status === "CONFIRMED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY_FOR_PICKUP");

  // Timer helper: returns minutes elapsed since createdAt or prepStartedAt
  const getElapsedMinutes = (order: OrderData) => {
    const start = order.prepStartedAt ? new Date(order.prepStartedAt) : new Date(order.createdAt);
    const diffMs = Date.now() - start.getTime();
    return Math.floor(diffMs / 60000);
  };

  // Status transition handler
  const handleTransition = async (orderId: string, newStatus: string) => {
    sound.playClickTick();
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actorRole: "KITCHEN_STAFF",
          actorName: "Chef Tukaram",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update ticket");
      }

      if (newStatus === "READY_FOR_PICKUP") {
        if (buzzerEnabled) {
          sound.playKitchenBuzzer();
        }
        setActionNotice(`🔔 Buzzed Customer for Token #${orderId}! WhatsApp & SMS ping sent.`);
      } else if (newStatus === "PREPARING") {
        setActionNotice(`🍳 Kadai frying started. Recipe BOM inventory deducted.`);
      }

      setTimeout(() => setActionNotice(null), 4000);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || "Status update failed");
    }
  };

  const handlePrintKOT = (order: OrderData) => {
    sound.playClickTick();
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Staff Station Header */}
      <StaffStationHeader
        stationName="Kadai Fryers 1 & 2 • Live Preparation Cadence"
        badgeLabel="KITCHEN STATION"
        stationRole="KITCHEN_STAFF"
      />

      {/* KDS Station Banner Strip */}
      <div className="bg-slate-900 border-b border-slate-800 p-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-black text-white">
                  KITCHEN DISPLAY STATION (KDS)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  LIVE CADENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kadai 1 & Kadai 2 • Auto-BOM Depletion Active • Active Queue: {incomingOrders.length + preparingOrders.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Buzzer sound toggle */}
            <button
              onClick={() => {
                setBuzzerEnabled(!buzzerEnabled);
                if (!buzzerEnabled) sound.playClickTick();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                buzzerEnabled
                  ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {buzzerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{buzzerEnabled ? "Audio Buzzer ON" : "Muted"}</span>
            </button>

            {/* Manual refresh button */}
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Refresh tickets"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="bg-emerald-500 text-slate-950 text-xs font-black py-2 px-4 text-center shadow-lg animate-fade-in flex items-center justify-center space-x-2">
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Mobile Station Column Filter Pills */}
      <div className="flex md:hidden items-center justify-between p-1.5 mx-4 mt-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold gap-1">
        <button
          onClick={() => setMobileTab("ALL")}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all ${
            mobileTab === "ALL" ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setMobileTab("INCOMING")}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all ${
            mobileTab === "INCOMING" ? "bg-amber-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          New ({incomingOrders.length})
        </button>
        <button
          onClick={() => setMobileTab("PREPARING")}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all ${
            mobileTab === "PREPARING" ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          Frying ({preparingOrders.length})
        </button>
        <button
          onClick={() => setMobileTab("READY")}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all ${
            mobileTab === "READY" ? "bg-emerald-500 text-slate-950 font-black shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          Ready ({readyOrders.length})
        </button>
      </div>

      {/* Kanban Board */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Incoming New Orders */}
        <div className={`${mobileTab === "ALL" || mobileTab === "INCOMING" ? "flex" : "hidden"} md:flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden`}>
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                Incoming New Orders
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
              {incomingOrders.length}
            </span>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {incomingOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No new orders in queue. Kadai ready for next batch!
              </div>
            ) : (
              incomingOrders.map((order) => {
                const elapsedMin = getElapsedMinutes(order);
                const isOverdue = elapsedMin >= 8;

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isOverdue
                        ? "bg-red-950/40 border-red-500/60 ring-2 ring-red-500/40"
                        : "bg-slate-900 border-slate-700/80 hover:border-amber-500/50"
                    }`}
                  >
                    {/* Header: Token & Timer */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-black text-amber-400">
                          #{order.tokenNo}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {order.orderType}
                        </span>
                      </div>

                      {/* Color coded timer */}
                      <div
                        className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-bold ${
                          isOverdue
                            ? "bg-red-500 text-white animate-pulse"
                            : elapsedMin >= 5
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMin}m ago</span>
                      </div>
                    </div>

                    {/* Table / Slot info */}
                    <div className="text-xs text-slate-300 mb-2">
                      <span className="font-semibold text-white">{order.customerName}</span>
                      {order.tableNo && <span className="text-orange-400"> • {order.tableNo}</span>}
                      {order.pickupSlot && <span> • {order.pickupSlot}</span>}
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 py-2 border-y border-slate-800 text-xs">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <span className="font-bold text-white">
                            {item.quantity}x {item.itemTitle}
                          </span>
                          {parseModifiersList(item.selectedModifiersJson) && (
                            <span className="text-[10px] text-slate-400 ml-2">
                              {parseModifiersList(item.selectedModifiersJson)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        onClick={() => handleTransition(order.id, "PREPARING")}
                        className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Frying</span>
                      </button>
                      <button
                        onClick={() => handlePrintKOT(order)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                        title="Print Kitchen Ticket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: In Preparation / Frying */}
        <div className={`${mobileTab === "ALL" || mobileTab === "PREPARING" ? "flex" : "hidden"} md:flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden`}>
          <div className="p-4 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              <h2 className="text-sm font-bold text-orange-300 uppercase tracking-wider">
                In Preparation / Frying
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs font-black">
              {preparingOrders.length}
            </span>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No orders currently in fryers.
              </div>
            ) : (
              preparingOrders.map((order) => {
                const elapsedMin = getElapsedMinutes(order);
                const isOverdue = elapsedMin >= 8;

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isOverdue
                        ? "bg-red-950/40 border-red-500 ring-2 ring-red-500/40"
                        : "bg-slate-900 border-orange-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-black text-orange-400">
                          #{order.tokenNo}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                          {order.orderType}
                        </span>
                      </div>

                      {/* Timer Alert */}
                      <div
                        className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-black ${
                          isOverdue
                            ? "bg-red-500 text-white animate-pulse"
                            : elapsedMin >= 5
                            ? "bg-amber-500 text-slate-950"
                            : "bg-orange-500/20 text-orange-400"
                        }`}
                      >
                        {isOverdue && <AlertTriangle className="w-3 h-3" />}
                        <span>{elapsedMin}m in kadai</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 mb-2 font-medium">
                      {order.customerName} {order.tableNo && `• Table: ${order.tableNo}`}
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 py-2 border-y border-slate-800 text-xs">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <span className="font-bold text-white">
                            {item.quantity}x {item.itemTitle}
                          </span>
                          {parseModifiersList(item.selectedModifiersJson) && (
                            <span className="text-[10px] text-orange-300 ml-2">
                              {parseModifiersList(item.selectedModifiersJson)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Mark Ready Button */}
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        onClick={() => handleTransition(order.id, "READY_FOR_PICKUP")}
                        className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Ready & Buzz Customer</span>
                      </button>
                      <button
                        onClick={() => handlePrintKOT(order)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Ready / Packed */}
        <div className={`${mobileTab === "ALL" || mobileTab === "READY" ? "flex" : "hidden"} md:flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden`}>
          <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                Ready / Packed
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black">
              {readyOrders.length}
            </span>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {readyOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No orders waiting for handover.
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl border bg-slate-900 border-emerald-500/30 shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-emerald-400">
                      #{order.tokenNo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      WAITING PICKUP
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 mb-2">
                    <span className="font-semibold text-white">{order.customerName}</span>
                    <span className="text-slate-500"> • {order.customerPhone}</span>
                  </div>

                  <div className="py-2 border-y border-slate-800 text-xs text-slate-300 space-y-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.itemTitle}</span>
                      </div>
                    ))}
                  </div>

                  {/* Complete Handover Button */}
                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleTransition(order.id, "COMPLETED")}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Handed Over (Done)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Hidden Thermal KOT Print Template */}
      {printingOrder && (
        <div id="thermal-receipt" className="hidden print:block">
          <div className="text-center border-b pb-2 mb-2">
            <h2 className="text-base font-bold">BENGALURU PAV CO. (KDS KOT)</h2>
            <p>Flagship: Koramangala 5th Block, BLR</p>
            <p>================================</p>
            <p className="text-lg font-bold">TOKEN #{printingOrder.tokenNo}</p>
            <p>{printingOrder.orderNumber}</p>
            <p>Mode: {printingOrder.orderType} {printingOrder.tableNo && `[${printingOrder.tableNo}]`}</p>
            <p>Time: {new Date().toLocaleTimeString()}</p>
            <p>================================</p>
          </div>
          <div className="space-y-1">
            {printingOrder.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span>{item.quantity}x {item.itemTitle}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <p>Customer: {printingOrder.customerName}</p>
            <p>Phone: {printingOrder.customerPhone}</p>
            {printingOrder.customerNotes && <p>Note: {printingOrder.customerNotes}</p>}
            <p className="text-center mt-3">** HOT FROM KADAI **</p>
          </div>
        </div>
      )}
    </div>
  );
}
