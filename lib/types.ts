export interface ModifierItem {
  id: string;
  name: string;
  groupName: string;
  extraPrice: number;
  isRequired?: boolean;
}

export interface MenuItemData {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  prepTimeMin: number;
  isVeg: boolean;
  isAvailable: boolean;
  isBestseller: boolean;
  spiceLevel: "MILD" | "MEDIUM" | "THECHA_HOT";
  imageUrl: string;
  modifiers?: ModifierItem[];
  category?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface CartItem {
  cartItemId: string; // unique string combining item id + modifiers
  menuItemId: string;
  title: string;
  price: number;
  quantity: number;
  spiceLevel: "MILD" | "MEDIUM" | "THECHA_HOT";
  selectedModifiers: ModifierItem[];
}

export type OrderType = "TAKEAWAY" | "DINE_IN" | "DELIVERY";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethod =
  | "RAZORPAY_UPI"
  | "RAZORPAY_CARD"
  | "CASH_ON_DELIVERY"
  | "COUNTER_CASH"
  | "COUNTER_UPI";

export interface OrderData {
  id: string;
  orderNumber: string;
  tokenNo: number;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: PaymentMethod;
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  tableNo?: string | null;
  pickupSlot?: string | null;
  deliveryAddress?: string | null;
  deliveryPincode?: string | null;
  customerNotes?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  createdAt: string;
  prepStartedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  items: Array<{
    id: string;
    itemTitle: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    selectedModifiersJson?: string | null;
  }>;
}
