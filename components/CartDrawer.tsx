"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CartItem, OrderType, PaymentMethod } from "@/lib/types";
import { validateBengaluruPincode, POPULAR_BENGALURU_LOCALITIES } from "@/lib/bengaluru-zones";
import { evaluateCoupon, ACTIVE_COUPONS } from "@/lib/coupons";
import { sound } from "@/lib/sound";
import { getCurrentSessionUser, setSessionUser, AuthUser } from "@/lib/auth";
import {
  validateName,
  validatePhone,
  validateEmail,
  validateAddress,
  validatePincode,
  normalizeIndianPhone,
} from "@/lib/validations";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  MapPin,
  Utensils,
  Clock,
  CreditCard,
  Gift,
  Sparkles,
} from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  tableNumberPrefill?: string | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  tableNumberPrefill = null,
}: CartDrawerProps) {
  const router = useRouter();

  const [orderType, setOrderType] = useState<OrderType>(
    tableNumberPrefill ? "DINE_IN" : "TAKEAWAY"
  );
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [tableNo, setTableNo] = useState(tableNumberPrefill || "Table 1");
  const [pickupSlot, setPickupSlot] = useState("Immediate Pickup (~10 mins)");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("560034");
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY_UPI");

  // Coupon Engine state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field-level touched and error states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Auto-fill customer details from session & /api/auth/me
  useEffect(() => {
    if (!isOpen) return;

    const localUser = getCurrentSessionUser();
    if (localUser) {
      setCurrentUser(localUser);
      setCustomerName((prev) => prev || localUser.name);
      setCustomerEmail((prev) => prev || localUser.email);
      if (localUser.phone) {
        setCustomerPhone((prev) => prev || localUser.phone || "");
      }
    }

    // Refresh user profile from server to ensure fresh points & addresses
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          setSessionUser(data.user);
          setCustomerName((prev) => prev || data.user.name);
          setCustomerEmail((prev) => prev || data.user.email);
          if (data.user.phone) {
            setCustomerPhone((prev) => prev || data.user.phone);
          }
          if (data.user.addresses && data.user.addresses.length > 0) {
            setSavedAddresses(data.user.addresses);
            const def = data.user.addresses.find((a: any) => a.isDefault) || data.user.addresses[0];
            if (def) {
              setDeliveryAddress((prev) => prev || def.addressLine);
              setDeliveryPincode((prev) => prev || def.pincode);
            }
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // Subtotal calculation
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Delivery zone calculation
  const zoneInfo = orderType === "DELIVERY" ? validateBengaluruPincode(deliveryPincode) : null;
  const deliveryFee = zoneInfo?.isServiceable ? zoneInfo.deliveryFee : 0;

  // Coupon evaluation
  let discountAmount = 0;
  if (appliedCoupon) {
    const check = evaluateCoupon(appliedCoupon.code, subtotal, items);
    if (check.isValid) {
      discountAmount = check.discountAmount;
    }
  }

  // Loyalty Points Redemption (50 points = ₹25.00 discount)
  const canRedeemPoints = !!(currentUser && currentUser.loyaltyPoints >= 50);
  const loyaltyDiscount = redeemPoints && canRedeemPoints ? Math.min(25.0, Math.max(0, subtotal - discountAmount)) : 0;
  const totalDiscount = discountAmount + loyaltyDiscount;

  // 5% Composite GST on Food
  const taxable = Math.max(0, subtotal - totalDiscount);
  const gstAmount = Number((taxable * 0.05).toFixed(2));
  const grandTotal = Number((taxable + gstAmount + (orderType === "DELIVERY" ? deliveryFee : 0)).toFixed(2));

  const handleApplyCoupon = (codeToApply?: string) => {
    sound.playClickTick();
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    const res = evaluateCoupon(code, subtotal, items);
    if (res.isValid) {
      setAppliedCoupon(res.appliedCoupon);
      setCouponMessage(res.message);
      setCouponCode(code);
    } else {
      setAppliedCoupon(null);
      setCouponMessage(res.message);
    }
  };

  const handleCheckout = async () => {
    sound.playClickTick();
    setErrorMessage(null);

    // Validate all checkout fields
    const nameErr = validateName(customerName);
    const phoneErr = validatePhone(customerPhone, true);
    const emailErr = customerEmail ? validateEmail(customerEmail) : null;
    const notesErr = customerNotes && customerNotes.length > 200 ? "Cooking notes cannot exceed 200 characters." : null;
    
    let tableErr: string | null = null;
    if (orderType === "DINE_IN" && (!tableNo || tableNo.trim().length === 0)) {
      tableErr = "Please provide your Table number.";
    }

    let addrErr: string | null = null;
    let pinErr: string | null = null;
    if (orderType === "DELIVERY") {
      addrErr = validateAddress(deliveryAddress, true);
      pinErr = validatePincode(deliveryPincode, true);
      if (!pinErr && !zoneInfo?.isServiceable) {
        pinErr = zoneInfo?.message || "PIN code is currently out of delivery range.";
      }
    }

    const currentErrors: Record<string, string | null> = {
      customerName: nameErr,
      customerPhone: phoneErr,
      customerEmail: emailErr,
      tableNo: tableErr,
      deliveryAddress: addrErr,
      deliveryPincode: pinErr,
      customerNotes: notesErr,
    };

    setFieldErrors(currentErrors);
    setTouched({
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      tableNo: true,
      deliveryAddress: true,
      deliveryPincode: true,
      customerNotes: true,
    });

    if (items.length === 0) {
      setErrorMessage("Your Kadai is empty. Add hot vada pavs first!");
      return;
    }

    const hasErrors = Object.values(currentErrors).some((err) => err !== null);
    if (hasErrors) {
      setErrorMessage("Please correct the highlighted fields before placing your order.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate unique idempotency key
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 2. Prepare payload
      const payload = {
        orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        tableNo: orderType === "DINE_IN" ? tableNo.trim() : null,
        pickupSlot: orderType === "TAKEAWAY" ? pickupSlot : null,
        deliveryAddress: orderType === "DELIVERY" ? deliveryAddress.trim() : null,
        deliveryPincode: orderType === "DELIVERY" ? deliveryPincode.trim() : null,
        customerNotes: customerNotes.trim() || null,
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
        redeemLoyaltyPoints: redeemPoints && canRedeemPoints,
        idempotencyKey,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          itemTitle: item.title,
          unitPrice: item.price,
          quantity: item.quantity,
          spiceLevel: item.spiceLevel,
          selectedModifiers: item.selectedModifiers,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order creation failed");
      }

      const createdOrder = data.order;

      // 3. Handle Razorpay Checkout Flow
      if (paymentMethod.startsWith("RAZORPAY")) {
        // Simulated signature verification for instant test flow
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrder.id,
            razorpay_order_id: data.gatewayOrder?.id || `order_sim_${createdOrder.id}`,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: `mock_sig_${data.gatewayOrder?.id || `order_sim_${createdOrder.id}`}`,
          }),
        });

        if (!verifyRes.ok) {
          const verifyData = await verifyRes.json();
          throw new Error(verifyData.error || "Payment signature verification failed");
        }
      }

      // Success! Clear cart, play sound, store active order, navigate to Live Tracking Screen
      sound.playOrderReadyChime();
      if (typeof window !== "undefined") {
        localStorage.setItem("mpc_last_order_id", createdOrder.id);
      }

      // Sync customer points in local session
      if (currentUser) {
        const netChange = (redeemPoints && canRedeemPoints ? -50 : 0) + 10;
        const newPoints = Math.max(0, currentUser.loyaltyPoints + netChange);
        const updated = { ...currentUser, loyaltyPoints: newPoints };
        setCurrentUser(updated);
        setSessionUser(updated);
      }

      onClearCart();
      onClose();
      router.push(`/order/${createdOrder.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Your Street Kadai</h2>
              <p className="text-[11px] text-slate-400">
                {items.reduce((s, i) => s + i.quantity, 0)} hot items queued
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Order Mode Switcher */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Dining Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {[
                { id: "TAKEAWAY", label: "Takeaway", icon: Clock },
                { id: "DINE_IN", label: "Table QR", icon: Utensils },
                { id: "DELIVERY", label: "Delivery", icon: MapPin },
              ].map((mode) => {
                const Icon = mode.icon;
                const isSelected = orderType === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      sound.playClickTick();
                      setOrderType(mode.id as OrderType);
                    }}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-orange-500 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Mode-Specific Details */}
          {orderType === "TAKEAWAY" && (
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
              <span className="text-xs font-medium text-slate-300">Pickup Scheduling</span>
              <select
                value={pickupSlot}
                onChange={(e) => setPickupSlot(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Immediate Pickup (~10 mins)">Immediate Hot Pickup (~10 mins)</option>
                <option value="In 20 minutes">In 20 minutes</option>
                <option value="In 30 minutes">In 30 minutes</option>
                <option value="Evening Snack (17:00 - 17:30)">Evening Frying (17:00 - 17:30)</option>
              </select>
            </div>
          )}

          {orderType === "DINE_IN" && (
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Table / Counter Number *</span>
              <input
                type="text"
                value={tableNo}
                onBlur={() => {
                  markTouched("tableNo");
                  setFieldErrors((prev) => ({
                    ...prev,
                    tableNo: !tableNo.trim() ? "Please provide your Table number." : null,
                  }));
                }}
                onChange={(e) => {
                  setTableNo(e.target.value);
                  if (touched.tableNo) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      tableNo: !e.target.value.trim() ? "Please provide your Table number." : null,
                    }));
                  }
                }}
                placeholder="e.g. Table 4 or Counter Bar"
                className={`w-full bg-slate-800 border rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.tableNo && fieldErrors.tableNo
                    ? "border-red-500 focus:border-red-500"
                    : touched.tableNo && !fieldErrors.tableNo
                    ? "border-emerald-500/80 focus:border-emerald-500"
                    : "border-slate-700 focus:border-orange-500"
                }`}
              />
              {touched.tableNo && fieldErrors.tableNo && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.tableNo}</span>
                </p>
              )}
            </div>
          )}

          {orderType === "DELIVERY" && (
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-300">Bengaluru PIN Code *</span>
                  {zoneInfo?.isServiceable ? (
                    <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{zoneInfo.zoneName} (₹{zoneInfo.deliveryFee})</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-400">Out of delivery range</span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={deliveryPincode}
                  onBlur={() => {
                    markTouched("deliveryPincode");
                    const err = validatePincode(deliveryPincode, true);
                    setFieldErrors((prev) => ({
                      ...prev,
                      deliveryPincode: err || (!zoneInfo?.isServiceable ? "PIN code out of delivery range." : null),
                    }));
                  }}
                  onChange={(e) => {
                    const pin = e.target.value.replace(/\D/g, "");
                    setDeliveryPincode(pin);
                    if (touched.deliveryPincode) {
                      const err = validatePincode(pin, true);
                      setFieldErrors((prev) => ({
                        ...prev,
                        deliveryPincode: err,
                      }));
                    }
                  }}
                  placeholder="560034"
                  className={`w-full bg-slate-800 border rounded-lg p-2 text-xs text-white font-mono focus:outline-none transition-colors ${
                    touched.deliveryPincode && fieldErrors.deliveryPincode
                      ? "border-red-500 focus:border-red-500"
                      : touched.deliveryPincode && !fieldErrors.deliveryPincode
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
                {touched.deliveryPincode && fieldErrors.deliveryPincode && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.deliveryPincode}</span>
                  </p>
                )}
              </div>

              {/* Localities shortcuts */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px]">
                {POPULAR_BENGALURU_LOCALITIES.slice(0, 4).map((loc) => (
                  <button
                    key={loc.pin}
                    type="button"
                    onClick={() => {
                      setDeliveryPincode(loc.pin);
                      markTouched("deliveryPincode");
                      setFieldErrors((prev) => ({ ...prev, deliveryPincode: null }));
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700 whitespace-nowrap"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>

              {/* Saved addresses for quick 1-click selection */}
              {savedAddresses.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Saved Delivery Addresses</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          sound.playClickTick();
                          setDeliveryAddress(addr.addressLine);
                          setDeliveryPincode(addr.pincode);
                          markTouched("deliveryAddress");
                          markTouched("deliveryPincode");
                          setFieldErrors((prev) => ({
                            ...prev,
                            deliveryAddress: null,
                            deliveryPincode: null,
                          }));
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all text-left flex items-center space-x-1 ${
                          deliveryAddress === addr.addressLine
                            ? "bg-orange-500/20 border-orange-500 text-orange-300 font-semibold"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                        }`}
                      >
                        <MapPin className="w-3 h-3 text-orange-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{addr.addressLine} ({addr.pincode})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-medium text-slate-300">Street / Flat Address *</span>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onBlur={() => {
                    markTouched("deliveryAddress");
                    setFieldErrors((prev) => ({
                      ...prev,
                      deliveryAddress: validateAddress(deliveryAddress, true),
                    }));
                  }}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    if (touched.deliveryAddress) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        deliveryAddress: validateAddress(e.target.value, true),
                      }));
                    }
                  }}
                  placeholder="House/Flat No, Apartment, Street, Landmark..."
                  className={`w-full bg-slate-800 border rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors mt-1 resize-none ${
                    touched.deliveryAddress && fieldErrors.deliveryAddress
                      ? "border-red-500 focus:border-red-500"
                      : touched.deliveryAddress && !fieldErrors.deliveryAddress
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
                {touched.deliveryAddress && fieldErrors.deliveryAddress && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{fieldErrors.deliveryAddress}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. Items List */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Selected Pavs & Snacks ({items.length})
            </label>
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Your Kadai is empty. Choose from our delicious Mumbai street menu!
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex-1 mr-3">
                      <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-orange-400 font-medium">₹{item.price}</span>
                        <span>•</span>
                        <span>{item.spiceLevel}</span>
                      </div>
                      {item.selectedModifiers.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          + {item.selectedModifiers.map((m) => m.name).join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.cartItemId)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Customer Contact Details */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Customer Details (For Token & Pickup Alert)
              </label>
              {currentUser && (
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Auto-filled</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  placeholder="Your Full Name *"
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

            <div>
              <input
                type="email"
                value={customerEmail}
                onBlur={() => {
                  markTouched("customerEmail");
                  if (customerEmail) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      customerEmail: validateEmail(customerEmail),
                    }));
                  }
                }}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (touched.customerEmail && e.target.value) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      customerEmail: validateEmail(e.target.value),
                    }));
                  }
                }}
                placeholder="Email Address (Optional, for digital receipt)"
                className={`w-full bg-slate-800 border rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  touched.customerEmail && fieldErrors.customerEmail
                    ? "border-red-500 focus:border-red-500"
                    : touched.customerEmail && !fieldErrors.customerEmail && customerEmail
                    ? "border-emerald-500/80 focus:border-emerald-500"
                    : "border-slate-700 focus:border-orange-500"
                }`}
              />
              {touched.customerEmail && fieldErrors.customerEmail && (
                <p className="text-[10px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.customerEmail}</span>
                </p>
              )}
            </div>

            <div>
              <input
                type="text"
                maxLength={200}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Cooking note: e.g. Extra dry thecha on the side (max 200 chars)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* 5. Pav Rewards Loyalty Points Engine */}
          <div className="pt-2 border-t border-slate-800">
            {currentUser ? (
              canRedeemPoints ? (
                <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-orange-500/35 rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Pav Rewards Member Benefit</span>
                    </div>
                    <span className="text-xs font-black text-amber-400 font-mono bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {currentUser.loyaltyPoints} Pts
                    </span>
                  </div>
                  <label className="flex items-center space-x-2 text-xs text-slate-200 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={redeemPoints}
                      onChange={(e) => {
                        sound.playClickTick();
                        setRedeemPoints(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <span className="font-semibold">
                      Redeem 50 Points to save <span className="text-emerald-400 font-black">₹25.00</span>
                    </span>
                  </label>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Gift className="w-3.5 h-3.5 text-orange-400" />
                    <span>Pav Rewards: <strong className="text-white font-mono">{currentUser.loyaltyPoints} Pts</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Earn {50 - currentUser.loyaltyPoints} more to save ₹25
                  </span>
                </div>
              )
            ) : (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Sign in to earn 10 points per order & claim rewards</span>
                </div>
              </div>
            )}
          </div>

          {/* 6. Coupon Codes */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-orange-400" />
                <span>Apply Coupon</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. BOMBAIFIRST"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold"
              >
                Apply
              </button>
            </div>
            {couponMessage && (
              <p
                className={`text-[11px] ${
                  appliedCoupon ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {couponMessage}
              </p>
            )}

            {/* Quick coupon pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-[10px]">
              {Object.keys(ACTIVE_COUPONS).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleApplyCoupon(code)}
                  className="px-2 py-0.5 rounded-full border border-dashed border-orange-500/40 bg-orange-500/10 text-orange-400 whitespace-nowrap hover:bg-orange-500/20"
                >
                  ⚡ {code}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Payment Method */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod("RAZORPAY_UPI")}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                  paymentMethod === "RAZORPAY_UPI"
                    ? "bg-orange-500/20 border-orange-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                <CreditCard className="w-4 h-4 text-orange-400" />
                <div className="text-left">
                  <div className="font-semibold">Razorpay UPI / QR</div>
                  <div className="text-[10px] text-slate-400">GPay, PhonePe, Cards</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "bg-orange-500/20 border-orange-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  ₹
                </div>
                <div className="text-left">
                  <div className="font-semibold">Cash / Counter Pay</div>
                  <div className="text-[10px] text-slate-400">Pay at pickup / delivery</div>
                </div>
              </button>
            </div>
          </div>

          {/* 7. Bill Summary Breakdown */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Item Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Pav Rewards (50 Pts Redeemed)</span>
                <span>-₹{loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>GST (5% composite street food)</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
            {orderType === "DELIVERY" && (
              <div className="flex justify-between text-slate-400">
                <span>Hot Frying Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>To Pay</span>
              <span className="text-orange-400 text-base">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="p-4 pb-6 sm:pb-4 bg-slate-950 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={handleCheckout}
            disabled={isSubmitting || items.length === 0}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-orange-500/30 active:scale-[0.98] transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Order & Verifying...</span>
              </span>
            ) : (
              <>
                <span>Confirm & Place Order</span>
                <span>• ₹{grandTotal.toFixed(0)}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
          <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit Encrypted Razorpay Checkout • Verified Webhooks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
