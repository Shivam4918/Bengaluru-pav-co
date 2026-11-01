"use client";

import React, { useState } from "react";
import StaffStationHeader from "@/components/StaffStationHeader";
import { sound } from "@/lib/sound";
import { validateName, validatePhone, normalizeIndianPhone } from "@/lib/validations";
import {
  Monitor,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Receipt,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface POSItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}

const QUICK_MENU = [
  { id: "classic-1", title: "Classic Batata Vada Pav", price: 49 },
  { id: "cheese-1", title: "Cheese Burst Vada Pav", price: 79 },
  { id: "ulta-1", title: "Ulta Vada Pav", price: 69 },
  { id: "thecha-1", title: "Kolhapuri Thecha Pav", price: 59 },
  { id: "combo-1", title: "Mumbai Express Combo", price: 119 },
  { id: "chai-1", title: "Mumbai Cutting Chai", price: 25 },
  { id: "lassi-1", title: "Ratnagiri Mango Lassi", price: 65 },
  { id: "mirchi-1", title: "Fried Mirchi Fry", price: 20 },
];

export default function CounterPOSPage() {
  const [basket, setBasket] = useState<POSItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Guest");
  const [customerPhone, setCustomerPhone] = useState("8469428342");
  const [paymentMode, setPaymentMode] = useState<"COUNTER_CASH" | "COUNTER_UPI">("COUNTER_CASH");
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);

  // Field-level states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const addItem = (item: { id: string; title: string; price: number }) => {
    sound.playClickTick();
    setBasket((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    sound.playClickTick();
    setBasket((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as POSItem[]
    );
  };

  const clearBasket = () => {
    sound.playClickTick();
    setBasket([]);
  };

  const subtotal = basket.reduce((sum, i) => sum + i.price * i.qty, 0);
  const gst = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + gst).toFixed(2));

  const handlePunchOrder = async () => {
    if (basket.length === 0) {
      setPosError("Please select items from the menu first.");
      return;
    }

    const nameErr = validateName(customerName);
    const phoneErr = validatePhone(customerPhone, true);

    setFieldErrors({ customerName: nameErr, customerPhone: phoneErr });
    setTouched({ customerName: true, customerPhone: true });

    if (nameErr || phoneErr) {
      setPosError(nameErr || phoneErr || "Please fix input errors.");
      return;
    }

    sound.playClickTick();
    setIsSubmitting(true);
    setPosError(null);

    try {
      const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "TAKEAWAY",
          customerName: customerName.trim() || "Walk-in Guest",
          customerPhone: normalizeIndianPhone(customerPhone) || "8469428342",
          paymentMethod: paymentMode,
          idempotencyKey,
          pickupSlot: "Instant Counter Delivery",
          items: basket.map((b) => ({
            menuItemId: b.id,
            itemTitle: b.title,
            unitPrice: b.price,
            quantity: b.qty,
            spiceLevel: "MEDIUM",
            selectedModifiers: [],
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "POS Punch failed");

      sound.playOrderReadyChime();
      setRecentOrder(data.order);
      setBasket([]);
      setPosError(null);
    } catch (err: any) {
      setPosError(err.message || "Failed to punch POS order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <StaffStationHeader
        stationName="Counter Register 1 • Front Cashier Express"
        badgeLabel="CASHIER POS"
        stationRole="CASHIER"
      />

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Touch Item Catalog (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-orange-400" />
              <h2 className="text-base font-bold text-white">Express Counter POS</h2>
            </div>
            <span className="text-xs text-slate-400">One-tap quick punch</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-orange-500 rounded-2xl flex flex-col justify-between text-left transition-all active:scale-95 shadow-sm hover:shadow-orange-500/10 min-h-[110px]"
              >
                <div className="font-bold text-sm text-white leading-tight">{item.title}</div>
                <div className="mt-3 flex items-center justify-between w-full">
                  <span className="text-base font-black text-orange-400">₹{item.price}</span>
                  <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Recent Token Receipt Callout */}
          {recentOrder && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg">
                  #{recentOrder.tokenNo}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Order Punched Successfully!</div>
                  <div className="text-xs text-slate-400">
                    {recentOrder.orderNumber} • ₹{recentOrder.totalAmount.toFixed(0)} ({recentOrder.paymentMethod})
                  </div>
                </div>
              </div>
              <button
                onClick={handlePrintReceipt}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Bill</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Register Ticket Summary (5 cols) */}
        <div id="register-bill" className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl scroll-mt-20">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                <Receipt className="w-4 h-4 text-orange-400" />
                <span>Current Register Bill</span>
              </h3>
              {basket.length > 0 && (
                <button
                  onClick={clearBasket}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Customer Inputs with Validation */}
            <div className="grid grid-cols-2 gap-2 my-2">
              <div>
                <input
                  type="text"
                  value={customerName}
                  onBlur={() => {
                    markTouched("customerName");
                    setFieldErrors((prev) => ({
                      ...prev,
                      customerName: validateName(customerName),
                    }));
                  }}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (touched.customerName) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        customerName: validateName(e.target.value),
                      }));
                    }
                  }}
                  placeholder="Guest Name *"
                  className={`w-full bg-slate-800 border rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    touched.customerName && fieldErrors.customerName
                      ? "border-red-500 focus:border-red-500"
                      : touched.customerName && !fieldErrors.customerName
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
                {touched.customerName && fieldErrors.customerName && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.customerName}</span>
                  </p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onBlur={() => {
                    markTouched("customerPhone");
                    setFieldErrors((prev) => ({
                      ...prev,
                      customerPhone: validatePhone(customerPhone, true),
                    }));
                  }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setCustomerPhone(digits);
                    if (touched.customerPhone) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        customerPhone: validatePhone(digits, true),
                      }));
                    }
                  }}
                  placeholder="10-digit Phone *"
                  className={`w-full bg-slate-800 border rounded-lg p-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-colors ${
                    touched.customerPhone && fieldErrors.customerPhone
                      ? "border-red-500 focus:border-red-500"
                      : touched.customerPhone && !fieldErrors.customerPhone && customerPhone.length === 10
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
                {touched.customerPhone && fieldErrors.customerPhone && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.customerPhone}</span>
                  </p>
                )}
              </div>
            </div>

            {posError && (
              <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{posError}</span>
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {basket.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Tap any item on the left to add to bill.
                </div>
              ) : (
                basket.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-slate-400">₹{item.price} each</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-white">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-white w-14 text-right">
                        ₹{item.price * item.qty}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Mode & Punch Button */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            {/* Payment Mode Pills */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClickTick();
                  setPaymentMode("COUNTER_CASH");
                }}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMode === "COUNTER_CASH"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash Counter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClickTick();
                  setPaymentMode("COUNTER_UPI");
                }}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMode === "COUNTER_UPI"
                    ? "bg-orange-500/20 border-orange-500 text-orange-400"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Counter UPI QR</span>
              </button>
            </div>

            {/* Total breakdown */}
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>5% GST</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
                <span>Total Due</span>
                <span className="text-orange-400">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Punch Order Button */}
            <button
              onClick={handlePunchOrder}
              disabled={basket.length === 0 || isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Punching & Printing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Punch Order & Generate Token</span>
                  <span>(₹{grandTotal.toFixed(0)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bill Trigger */}
      {basket.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-bounce-slight">
          <button
            onClick={() => {
              document.getElementById("register-bill")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm shadow-2xl shadow-orange-500/40"
          >
            <span>Punch Bill ({basket.reduce((s, i) => s + i.qty, 0)} items)</span>
            <span>Total: ₹{grandTotal.toFixed(0)} ↓</span>
          </button>
        </div>
      )}

      {/* Hidden Thermal Print Receipt */}
      {recentOrder && (
        <div id="thermal-receipt" className="hidden print:block">
          <div className="text-center border-b pb-2 mb-2">
            <h2 className="text-lg font-bold">MUMBAI PAV CO.</h2>
            <p>Bengaluru Koramangala Hub</p>
            <p>GSTIN: 29AABCU9603R1ZM</p>
            <p>--------------------------------</p>
            <p className="text-xl font-bold">TOKEN #{recentOrder.tokenNo}</p>
            <p>{recentOrder.orderNumber}</p>
            <p>Mode: {recentOrder.paymentMethod}</p>
            <p>{new Date().toLocaleString()}</p>
            <p>--------------------------------</p>
          </div>
          <div className="space-y-1">
            {recentOrder.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs">
                <span>{item.quantity}x {item.itemTitle}</span>
                <span>₹{item.totalPrice}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{recentOrder.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>GST 5%:</span>
              <span>₹{recentOrder.gstAmount}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>Total Paid:</span>
              <span>₹{recentOrder.totalAmount}</span>
            </div>
          </div>
          <p className="text-center mt-3">** THANK YOU! VISIT AGAIN **</p>
        </div>
      )}
    </div>
  );
}
