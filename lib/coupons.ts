import { CartItem } from "./types";

export interface CouponRule {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FLAT" | "FREE_ITEM";
  discountValue: number; // e.g., 20 for 20%, or 30 for 30 Rs flat
  minCartValue: number;
  freeItemTitle?: string;
  freeItemValue?: number;
}

export const ACTIVE_COUPONS: Record<string, CouponRule> = {
  BOMBAIFIRST: {
    code: "BOMBAIFIRST",
    description: "Flat ₹50 OFF on your first Mumbai street-food order above ₹199",
    discountType: "FLAT",
    discountValue: 50,
    minCartValue: 199,
  },
  PAVLOVER: {
    code: "PAVLOVER",
    description: "15% OFF up to ₹75 on orders above ₹250",
    discountType: "PERCENTAGE",
    discountValue: 15,
    minCartValue: 250,
  },
  BUY5GET1CHAI: {
    code: "BUY5GET1CHAI",
    description: "Order 5 or more Vada Pavs & get Free Masala Cutting Chai (₹25 value)!",
    discountType: "FREE_ITEM",
    discountValue: 25,
    minCartValue: 200,
    freeItemTitle: "Free Masala Cutting Chai",
    freeItemValue: 25,
  },
};

export function evaluateCoupon(
  code: string,
  subtotal: number,
  items: CartItem[]
): {
  isValid: boolean;
  discountAmount: number;
  message: string;
  appliedCoupon?: CouponRule;
} {
  const normalized = (code || "").trim().toUpperCase();
  const rule = ACTIVE_COUPONS[normalized];

  if (!rule) {
    return {
      isValid: false,
      discountAmount: 0,
      message: "Invalid coupon code. Try BOMBAIFIRST or BUY5GET1CHAI",
    };
  }

  if (subtotal < rule.minCartValue) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Minimum order value of ₹${rule.minCartValue} required for coupon ${rule.code}. Add ₹${(rule.minCartValue - subtotal).toFixed(0)} more!`,
    };
  }

  if (rule.code === "BUY5GET1CHAI") {
    const pavCount = items.reduce((sum, item) => {
      if (item.title.toLowerCase().includes("pav")) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);

    if (pavCount < 5) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Buy at least 5 Vada Pavs to unlock Free Masala Chai! Currently have ${pavCount} in cart.`,
      };
    }
  }

  let discount = 0;
  if (rule.discountType === "FLAT") {
    discount = rule.discountValue;
  } else if (rule.discountType === "PERCENTAGE") {
    discount = Math.min((subtotal * rule.discountValue) / 100, 75);
  } else if (rule.discountType === "FREE_ITEM") {
    discount = rule.freeItemValue || 25;
  }

  return {
    isValid: true,
    discountAmount: Math.round(discount),
    message: `🎉 Coupon applied: ${rule.description}`,
    appliedCoupon: rule,
  };
}
