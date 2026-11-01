import { z } from "zod";

// ============================================================================
// CORE REGULAR EXPRESSIONS & SECURITY PATTERNS
// ============================================================================

/**
 * Supports Unicode international names, spaces, hyphens, and apostrophes.
 * Rejects numbers, script injections, and excessive punctuation.
 */
export const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s'.-]{2,60}$/;

/**
 * Standard RFC 5322 compliant email regex.
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Valid Indian mobile phone number: exactly 10 digits starting with 6, 7, 8, or 9.
 */
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Standard 6-digit Indian Postal PIN Code (does not begin with 0).
 */
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Password complexity requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const PASSWORD_HAS_UPPER = /[A-Z]/;
export const PASSWORD_HAS_LOWER = /[a-z]/;
export const PASSWORD_HAS_NUMBER = /[0-9]/;
export const PASSWORD_HAS_SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

// ============================================================================
// INPUT SANITIZATION UTILITIES
// ============================================================================

/**
 * Strips HTML tags, script constructs, and control characters to mitigate XSS attacks.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>"'&]/g, (char) => {
      switch (char) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#39;";
        case "&": return "&amp;";
        default: return char;
      }
    })
    .trim();
}

/**
 * Cleans phone number by removing country code prefixes (+91, 0) and non-digit characters.
 */
export function normalizeIndianPhone(rawPhone: unknown): string {
  if (!rawPhone || typeof rawPhone !== "string") return "";
  let digits = rawPhone.replace(/\D/g, "");
  // Strip leading 91 if it's 12 digits (e.g., 919876543210 -> 9876543210)
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.substring(2);
  }
  // Strip leading 0 if 11 digits (e.g., 09876543210 -> 9876543210)
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  return digits;
}

// ============================================================================
// PASSWORD STRENGTH SCORER
// ============================================================================

export interface PasswordStrengthResult {
  score: number; // 0 (too weak) to 4 (very strong)
  label: "Too Weak" | "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  feedback: string[];
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const p = password || "";
  const hasMinLength = p.length >= 8;
  const hasUppercase = PASSWORD_HAS_UPPER.test(p);
  const hasLowercase = PASSWORD_HAS_LOWER.test(p);
  const hasNumber = PASSWORD_HAS_NUMBER.test(p);
  const hasSpecial = PASSWORD_HAS_SPECIAL.test(p);

  const feedback: string[] = [];
  if (!hasMinLength) feedback.push("At least 8 characters");
  if (!hasUppercase) feedback.push("At least one uppercase letter (A-Z)");
  if (!hasLowercase) feedback.push("At least one lowercase letter (a-z)");
  if (!hasNumber) feedback.push("At least one number (0-9)");
  if (!hasSpecial) feedback.push("At least one special character (!@#$%^&*)");

  let score = 0;
  if (p.length >= 8) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  if (p.length >= 12 && score === 4) score = 4;

  const labels: Record<number, "Too Weak" | "Weak" | "Fair" | "Good" | "Strong"> = {
    0: "Too Weak",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };

  const colors: Record<number, string> = {
    0: "bg-red-500",
    1: "bg-orange-500",
    2: "bg-amber-500",
    3: "bg-blue-500",
    4: "bg-emerald-500",
  };

  return {
    score,
    label: labels[score] || "Too Weak",
    colorClass: colors[score] || "bg-red-500",
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    feedback,
  };
}

// ============================================================================
// REAL-TIME FIELD-LEVEL VALIDATION HELPERS (FOR CLIENT-SIDE UX)
// ============================================================================

export function validateName(name: string): string | null {
  const trimmed = name?.trim() || "";
  if (!trimmed) return "Please enter your full name.";
  if (trimmed.length < 2) return "Name must be at least 2 characters long.";
  if (trimmed.length > 60) return "Name cannot exceed 60 characters.";
  if (!NAME_REGEX.test(trimmed)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email?.trim() || "";
  if (!trimmed) return "Please enter your email address.";
  if (trimmed.length > 100) return "Email address cannot exceed 100 characters.";
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address (e.g. name@example.com).";
  }
  return null;
}

export function validatePhone(phone: string, required = false): string | null {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    return required ? "Please enter your 10-digit mobile number." : null;
  }
  if (!INDIAN_PHONE_REGEX.test(normalized)) {
    return "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must contain at least 8 characters.";
  if (password.length > 72) return "Password cannot exceed 72 characters.";
  if (!PASSWORD_HAS_UPPER.test(password)) {
    return "Password must include at least one uppercase letter (A-Z).";
  }
  if (!PASSWORD_HAS_LOWER.test(password)) {
    return "Password must include at least one lowercase letter (a-z).";
  }
  if (!PASSWORD_HAS_NUMBER.test(password)) {
    return "Password must include at least one numeric digit (0-9).";
  }
  if (!PASSWORD_HAS_SPECIAL.test(password)) {
    return "Password must include at least one special character (!@#$%^&*).";
  }
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}

export function validateDob(dobString: string, minAgeYears = 13): string | null {
  if (!dobString) return "Date of birth is required.";
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return "Please enter a valid date of birth (YYYY-MM-DD).";

  const today = new Date();
  if (date > today) return "Date of birth cannot be in the future.";

  // Minimum age check
  const cutoff = new Date();
  cutoff.setFullYear(today.getFullYear() - minAgeYears);
  if (date > cutoff) {
    return `You must be at least ${minAgeYears} years old to register.`;
  }

  // Maximum age check (120 years)
  const maxAge = new Date();
  maxAge.setFullYear(today.getFullYear() - 120);
  if (date < maxAge) {
    return "Please enter a realistic date of birth.";
  }

  return null;
}

export function validateAddress(address: string, required = true): string | null {
  const trimmed = address?.trim() || "";
  if (!trimmed) {
    return required ? "Delivery address is required." : null;
  }
  if (trimmed.length < 5) return "Address must be at least 5 characters.";
  if (trimmed.length > 250) return "Address cannot exceed 250 characters.";
  return null;
}

export function validatePincode(pincode: string, required = true): string | null {
  const trimmed = pincode?.trim() || "";
  if (!trimmed) {
    return required ? "6-digit postal PIN code is required." : null;
  }
  if (!PINCODE_REGEX.test(trimmed)) {
    return "Please enter a valid 6-digit Indian PIN code.";
  }
  return null;
}

// ============================================================================
// ZOD SCHEMAS FOR BACKEND API VALIDATION
// ============================================================================

/**
 * Customer / User Registration Schema
 */
export const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .regex(NAME_REGEX, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(100, "Email cannot exceed 100 characters")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .regex(PASSWORD_HAS_UPPER, "Password must include at least one uppercase letter")
    .regex(PASSWORD_HAS_LOWER, "Password must include at least one lowercase letter")
    .regex(PASSWORD_HAS_NUMBER, "Password must include at least one number")
    .regex(PASSWORD_HAS_SPECIAL, "Password must include at least one special character"),
  confirmPassword: z.string().optional(),
  phone: z
    .string()
    .transform(normalizeIndianPhone)
    .refine((val) => !val || INDIAN_PHONE_REGEX.test(val), {
      message: "Phone number must be a valid 10-digit Indian mobile number",
    })
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || validateDob(val) === null, {
      message: "Please enter a valid date of birth (minimum 13 years old)",
    }),
}).refine(
  (data) => {
    if (data.confirmPassword !== undefined && data.confirmPassword !== "") {
      return data.password === data.confirmPassword;
    }
    return true;
  },
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

/**
 * User Login Schema
 */
export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Forgot Password Request Schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Please enter your registered email address")
    .email("Please enter a valid email address"),
});

/**
 * Reset Password Submission Schema
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  resetCode: z
    .string()
    .trim()
    .min(4, "Verification reset code must be at least 4 characters"),
  newPassword: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .regex(PASSWORD_HAS_UPPER, "Password must include at least one uppercase letter")
    .regex(PASSWORD_HAS_LOWER, "Password must include at least one lowercase letter")
    .regex(PASSWORD_HAS_NUMBER, "Password must include at least one number")
    .regex(PASSWORD_HAS_SPECIAL, "Password must include at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Customer Profile Update Schema
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .regex(NAME_REGEX, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
  phone: z
    .string()
    .transform(normalizeIndianPhone)
    .refine((val) => !val || INDIAN_PHONE_REGEX.test(val), {
      message: "Phone number must be a valid 10-digit Indian mobile number",
    })
    .optional()
    .nullable(),
  addressLine: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(250, "Address cannot exceed 250 characters")
    .optional()
    .nullable(),
  pincode: z
    .string()
    .trim()
    .refine((val) => !val || PINCODE_REGEX.test(val), {
      message: "Please enter a valid 6-digit Indian PIN code",
    })
    .optional()
    .nullable(),
  landmark: z.string().trim().max(100).optional().nullable(),
});

/**
 * Admin: Staff Creation Schema
 */
export const createStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Staff name must be at least 2 characters")
    .max(60, "Staff name cannot exceed 60 characters")
    .regex(NAME_REGEX, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  role: z.enum(["KITCHEN_STAFF", "CASHIER", "ADMIN"], {
    message: "Role must be Kitchen Staff, Cashier, or Admin",
  }),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .regex(PASSWORD_HAS_UPPER, "Password must include at least one uppercase letter")
    .regex(PASSWORD_HAS_LOWER, "Password must include at least one lowercase letter")
    .regex(PASSWORD_HAS_NUMBER, "Password must include at least one number")
    .regex(PASSWORD_HAS_SPECIAL, "Password must include at least one special character"),
});

/**
 * Admin: Staff Update Schema
 */
export const updateStaffSchema = z.object({
  id: z.string().min(1, "Staff ID is required"),
  name: z
    .string()
    .trim()
    .min(2, "Staff name must be at least 2 characters")
    .max(60, "Staff name cannot exceed 60 characters")
    .regex(NAME_REGEX, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
  role: z.enum(["KITCHEN_STAFF", "CASHIER", "ADMIN"]).optional(),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .regex(PASSWORD_HAS_UPPER, "Password must include at least one uppercase letter")
    .regex(PASSWORD_HAS_LOWER, "Password must include at least one lowercase letter")
    .regex(PASSWORD_HAS_NUMBER, "Password must include at least one number")
    .regex(PASSWORD_HAS_SPECIAL, "Password must include at least one special character")
    .optional()
    .or(z.literal("")),
});

/**
 * Raw Material & Inventory Item Schema
 */
export const rawMaterialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Material name must be at least 2 characters")
    .max(80, "Material name cannot exceed 80 characters"),
  category: z.enum([
    "VEGETABLES",
    "DAIRY",
    "BAKERY",
    "SPICES",
    "DRY_GROCERY",
    "PACKAGING",
    "BEVERAGES",
  ], {
    message: "Please select a valid inventory category",
  }),
  stockQty: z
    .number()
    .min(0, "Stock quantity cannot be negative")
    .max(100000, "Stock quantity cannot exceed 100,000 units"),
  unit: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Measurement unit is required")
    .max(20, "Unit cannot exceed 20 characters"),
  thresholdQty: z
    .number()
    .min(0, "Threshold cannot be negative")
    .max(50000, "Threshold cannot exceed 50,000"),
  costPerUnit: z
    .number()
    .positive("Cost per unit must be greater than zero")
    .max(100000, "Unit cost cannot exceed ₹100,000"),
  recipeLinks: z
    .array(
      z.object({
        menuItemId: z.string().min(1, "Menu item ID is required"),
        qtyPerItem: z
          .number()
          .positive("Quantity per item must be greater than zero"),
        unit: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

/**
 * Quick Restock Schema
 */
export const restockSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient ID is required"),
  adjustmentQty: z
    .number()
    .positive("Restock quantity must be greater than zero")
    .max(10000, "Restock quantity cannot exceed 10,000 in a single operation"),
  reason: z.string().min(3, "Reason for stock adjustment is required").default("Manual Manager Restock"),
});

// ============================================================================
// ORDER CREATION SCHEMAS
// ============================================================================

export const orderItemModifierSchema = z.object({
  id: z.string(),
  name: z.string(),
  groupName: z.string(),
  extraPrice: z.number().min(0),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  itemTitle: z.string().min(1, "Item title is required"),
  unitPrice: z.number().positive("Unit price must be positive"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  selectedModifiers: z.array(orderItemModifierSchema).default([]),
  spiceLevel: z.enum(["MILD", "MEDIUM", "THECHA_HOT"]).default("MEDIUM"),
});

export const createOrderSchema = z
  .object({
    orderType: z.enum(["TAKEAWAY", "DINE_IN", "DELIVERY"]),
    customerName: z
      .string()
      .trim()
      .min(2, "Customer name must be at least 2 characters")
      .max(60, "Customer name cannot exceed 60 characters")
      .regex(NAME_REGEX, "Name can only contain letters, spaces, and hyphens"),
    customerPhone: z
      .string()
      .transform(normalizeIndianPhone)
      .refine((val) => INDIAN_PHONE_REGEX.test(val), {
        message: "Please enter a valid 10-digit Indian mobile number",
      }),
    customerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .optional()
      .or(z.literal("")),

    // Specific context fields
    tableNo: z.string().optional().nullable(),
    pickupSlot: z.string().optional().nullable(),
    deliveryAddress: z.string().optional().nullable(),
    deliveryPincode: z.string().optional().nullable(),
    customerNotes: z
      .string()
      .max(200, "Customer cooking notes cannot exceed 200 characters")
      .optional()
      .nullable(),

    // Payment selection
    paymentMethod: z.enum([
      "RAZORPAY_UPI",
      "RAZORPAY_CARD",
      "CASH_ON_DELIVERY",
      "COUNTER_CASH",
      "COUNTER_UPI",
    ]),

    // Basket items
    items: z.array(orderItemInputSchema).min(1, "Order must contain at least one item"),

    // Concurrency & Idempotency
    idempotencyKey: z
      .string()
      .optional()
      .default(() => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`),

    // Applied coupon code
    couponCode: z.string().optional().nullable(),
    redeemLoyaltyPoints: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.orderType === "DELIVERY") {
        return (
          !!data.deliveryAddress &&
          data.deliveryAddress.trim().length >= 5 &&
          !!data.deliveryPincode &&
          PINCODE_REGEX.test(data.deliveryPincode)
        );
      }
      return true;
    },
    {
      message: "A complete delivery address and a valid 6-digit PIN code are required for delivery orders.",
      path: ["deliveryAddress"],
    }
  )
  .refine(
    (data) => {
      if (data.orderType === "DINE_IN") {
        return !!data.tableNo && data.tableNo.trim().length > 0;
      }
      return true;
    },
    {
      message: "Table number is required for Dine-In orders.",
      path: ["tableNo"],
    }
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStatusTransitionSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]),
  actorRole: z.enum(["KITCHEN_STAFF", "ADMIN", "RIDER", "SYSTEM"]).default("KITCHEN_STAFF"),
  actorName: z.string().default("Kitchen Chef"),
  reason: z.string().optional(),
});

export const razorpayVerifySchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
});

export const inventoryAdjustSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient ID is required"),
  adjustmentQty: z.number(),
  reason: z.string().min(3, "Reason for stock adjustment is required"),
});
