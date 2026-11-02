"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import MenuCustomizerModal from "@/components/MenuCustomizerModal";
import CartDrawer from "@/components/CartDrawer";
import { MenuItemData, ModifierItem, CartItem } from "@/lib/types";
import { sound } from "@/lib/sound";
import {
  Flame,
  Search,
  Sparkles,
  Clock,
  Plus,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Tag,
  ChefHat,
  Monitor,
  LayoutDashboard,
  QrCode,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function StorefrontContent() {
  const searchParams = useSearchParams();
  const tableQuery = searchParams.get("table");

  // State
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [storeSetting, setStoreSetting] = useState<any>(null);
  const [activeQueueCount, setActiveQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  // Cart & Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItemData | null>(null);
  const [expandedBOM, setExpandedBOM] = useState<string | null>(null);

  // Fetch initial data & live menu from database
  useEffect(() => {
    async function loadStorefrontData() {
      try {
        setLoading(true);
        const [storeRes, menuRes] = await Promise.all([
          fetch("/api/store"),
          fetch("/api/menu"),
        ]);
        const storeData = await storeRes.json();
        const menuData = await menuRes.json();

        if (storeData.store) {
          setStoreSetting(storeData.store);
          setActiveQueueCount(storeData.activeQueueCount || 0);
        }

        if (menuData.items && menuData.items.length > 0) {
          setMenuItems(menuData.items);
        }
        if (menuData.categories && menuData.categories.length > 0) {
          setCategories(menuData.categories);
        }
      } catch (err) {
        console.error("Initial load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadStorefrontData();

    // Read local cart if exists
    const saved = localStorage.getItem("mpc_cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save cart changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mpc_cart", JSON.stringify(cart));
    }
  }, [cart]);

  // Customizer trigger
  const handleOpenCustomizer = (item: MenuItemData) => {
    sound.playClickTick();
    setCustomizingItem(item);
  };

  const handleAddToCart = (
    item: MenuItemData,
    quantity: number,
    spiceLevel: "MILD" | "MEDIUM" | "THECHA_HOT",
    selectedModifiers: ModifierItem[]
  ) => {
    const sortedModNames = selectedModifiers.map((m) => m.name).sort().join("|");
    const cartItemId = `${item.id}_${spiceLevel}_${sortedModNames}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const modifiersCost = selectedModifiers.reduce((acc, m) => acc + (m.extraPrice || 0), 0);
        return [
          ...prevCart,
          {
            cartItemId,
            menuItemId: item.id,
            title: item.title,
            price: item.price + modifiersCost,
            quantity,
            spiceLevel,
            selectedModifiers,
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    sound.playClickTick();
    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    sound.playClickTick();
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mpc_cart");
    }
  };

  const handleReorder = (orderItems: any[]) => {
    sound.playOrderReadyChime();
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      for (const oi of orderItems) {
        let selectedMods: ModifierItem[] = [];
        try {
          if (oi.selectedModifiersJson) {
            selectedMods = JSON.parse(oi.selectedModifiersJson);
          }
        } catch {}

        const cartItemId = `${oi.menuItemId}_MEDIUM_${selectedMods.map((m: any) => m.name).sort().join("|")}`;
        const existingIndex = updatedCart.findIndex((i) => i.cartItemId === cartItemId);
        if (existingIndex > -1) {
          updatedCart[existingIndex].quantity += oi.quantity;
        } else {
          updatedCart.push({
            cartItemId,
            menuItemId: oi.menuItemId,
            title: oi.itemTitle,
            price: oi.unitPrice,
            quantity: oi.quantity,
            spiceLevel: "MEDIUM",
            selectedModifiers: selectedMods,
          });
        }
      }
      return updatedCart;
    });
    setIsCartOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Fallback catalog for immediate seamless display
  const DEFAULT_MENU_ITEMS: MenuItemData[] = [
    {
      id: "classic-mumbai-vada-pav",
      categoryId: "vada-pav",
      title: "Classic Mumbai Batata Vada Pav",
      slug: "classic-mumbai-vada-pav",
      description: "Golden spiced potato dumpling in freshly baked soft pav, laced with tangy tamarind, mint-coriander chutney, and fiery dry garlic thecha.",
      price: 49.0,
      prepTimeMin: 5,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MEDIUM",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      modifiers: [
        { id: "m1", name: "Extra Dry Garlic Thecha Chutney", groupName: "CHUTNEY", extraPrice: 10 },
        { id: "m2", name: "Amul Melted Cheese Slice", groupName: "CHEESE", extraPrice: 20 },
        { id: "m3", name: "Extra Butter Grilled Pav", groupName: "PAV", extraPrice: 15 },
      ],
    },
    {
      id: "cheese-burst-vada-pav",
      categoryId: "vada-pav",
      title: "Cheese Burst Vada Pav",
      slug: "cheese-burst-vada-pav",
      description: "Crispy batata vada layered with molten melted Amul cheese and pan-toasted butter pav. Absolute indulgence!",
      price: 79.0,
      prepTimeMin: 6,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MILD",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      modifiers: [
        { id: "m1", name: "Extra Dry Garlic Thecha Chutney", groupName: "CHUTNEY", extraPrice: 10 },
        { id: "m3", name: "Extra Butter Grilled Pav", groupName: "PAV", extraPrice: 15 },
      ],
    },
    {
      id: "ulta-vada-pav",
      categoryId: "vada-pav",
      title: "Ulta Vada Pav (Upside Down)",
      slug: "ulta-vada-pav",
      description: "Soft pav stuffed from inside with spiced potato filling, dipped in chickpea batter, and deep-fried till golden crisp.",
      price: 69.0,
      prepTimeMin: 7,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "THECHA_HOT",
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
      modifiers: [
        { id: "m1", name: "Extra Dry Garlic Thecha Chutney", groupName: "CHUTNEY", extraPrice: 10 },
        { id: "m2", name: "Amul Melted Cheese Slice", groupName: "CHEESE", extraPrice: 20 },
      ],
    },
    {
      id: "kolhapuri-thecha-vada-pav",
      categoryId: "vada-pav",
      title: "Kolhapuri Thecha Vada Pav",
      slug: "kolhapuri-thecha-vada-pav",
      description: "For spice warriors! Crushed green chilli garlic thecha slathered inside a steaming hot batata vada.",
      price: 59.0,
      prepTimeMin: 5,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "THECHA_HOT",
      imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
      modifiers: [
        { id: "m2", name: "Amul Melted Cheese Slice", groupName: "CHEESE", extraPrice: 20 },
        { id: "m3", name: "Extra Butter Grilled Pav", groupName: "PAV", extraPrice: 15 },
      ],
    },
    {
      id: "mumbai-express-combo",
      categoryId: "combos",
      title: "Mumbai Express Combo",
      slug: "mumbai-express-combo",
      description: "2 Signature Classic Batata Vada Pavs + 1 Hot Masala Cutting Chai + Fried Salted Mirchi. Perfect evening snack!",
      price: 119.0,
      prepTimeMin: 6,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MEDIUM",
      imageUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80",
      modifiers: [
        { id: "m2", name: "Amul Melted Cheese Slice", groupName: "CHEESE", extraPrice: 20 },
      ],
    },
    {
      id: "kadak-mumbai-cutting-chai",
      categoryId: "beverages",
      title: "Kadak Mumbai Cutting Chai",
      slug: "kadak-mumbai-cutting-chai",
      description: "Slow-brewed Assam CTC tea infused with fresh crushed ginger, cardamom, lemongrass, and cloves.",
      price: 25.0,
      prepTimeMin: 3,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MILD",
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "ratnagiri-mango-lassi",
      categoryId: "beverages",
      title: "Ratnagiri Mango Lassi",
      slug: "ratnagiri-mango-lassi",
      description: "Thick creamy yogurt churned with pure Ratnagiri Alphonso mango pulp and saffron strands.",
      price: 65.0,
      prepTimeMin: 3,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "MILD",
      imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "salted-fried-mirchi-fry",
      categoryId: "sides",
      title: "Salted Fried Green Chillies (Mirchi Fry)",
      slug: "salted-fried-mirchi-fry",
      description: "Crisp-fried green chillies tossed in rock salt and amchur powder. The non-negotiable pav partner!",
      price: 20.0,
      prepTimeMin: 2,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "THECHA_HOT",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    },
  ];

  const activeCatalog = menuItems.length > 0 ? menuItems : DEFAULT_MENU_ITEMS;

  const filteredItems = activeCatalog.filter((item) => {
    if (selectedCategory !== "all" && item.categoryId !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (vegOnly && !item.isVeg) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isStoreOpen={storeSetting?.isStoreOpen ?? true}
        activeQueueCount={activeQueueCount}
        onReorder={handleReorder}
      />

      {/* Sizzling Live Announcement Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 py-1.5 px-4 text-center text-xs font-semibold text-white tracking-wide overflow-hidden shadow-inner flex items-center justify-center space-x-2">
        <Flame className="w-3.5 h-3.5 animate-bounce flex-shrink-0" />
        <span className="truncate">
          {storeSetting?.bannerNotice ||
            "🔥 Kadai is sizzling! Fresh golden Batata Vadas prepared in pure groundnut & sunflower oil."}
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.12),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bengaluru&apos;s Artisanal Pav & Vada Pav Craft Kitchen</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Authentic Mumbai Flavours. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
                Fresh From Kadai To Pav.
              </span>
            </h1>

            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Crispy spiced Batata Vadas, pillow-soft butter pav, crushed garlic thecha, and cutting chai.
              Fried in small batches every 15 minutes at our Koramangala flagship.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>Koramangala 5th Block Hub</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>~8 Min Average Fry Time</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>100% Amul Butter & Pure Besan</span>
              </div>
            </div>
          </div>

          {/* Quick Table QR Notice if table is present */}
          {tableQuery && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-center md:text-left flex-shrink-0">
              <span className="text-xs uppercase tracking-wider font-bold text-orange-400">
                Dine-In Table QR Detected
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">Table #{tableQuery}</h3>
              <p className="text-xs text-slate-400 mt-1">Your order will be served directly to your table!</p>
            </div>
          )}
        </div>

        {/* Customer Experience Highlights */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800/80 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center space-x-3">
              <span className="text-2xl">🥡</span>
              <div>
                <div className="text-xs font-bold text-white">Hot Takeaway</div>
                <div className="text-[10px] text-slate-400">Scheduled counter pickup</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center space-x-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <div className="text-xs font-bold text-white">Dine-In Table QR</div>
                <div className="text-[10px] text-slate-400">Order direct from your table</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center space-x-3">
              <span className="text-2xl">🛵</span>
              <div>
                <div className="text-xs font-bold text-white">Direct Delivery</div>
                <div className="text-[10px] text-slate-400">Bengaluru PIN code verified</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center space-x-3">
              <span className="text-2xl">🎁</span>
              <div>
                <div className="text-xs font-bold text-white">Pav Rewards</div>
                <div className="text-[10px] text-slate-400">Earn points for free chai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Search */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Category Pills & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Items" },
              { id: "vada-pav", label: "Signature Vada Pav" },
              { id: "combos", label: "Street Combos" },
              { id: "beverages", label: "Chai & Coolers" },
              { id: "sides", label: "Sides & Thecha" },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClickTick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vada pav, chai, combos..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image Container with Badges */}
                <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Bestseller Badge */}
                  {item.isBestseller && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center space-x-1">
                      <span>★ BESTSELLER</span>
                    </div>
                  )}

                  {/* Prep Time */}
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-orange-400" />
                    <span>~{item.prepTimeMin}m fry</span>
                  </div>

                  {/* Spice indicator */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] font-semibold text-slate-300">
                    {item.spiceLevel === "THECHA_HOT" ? "🌶️ Spicy" : "🟠 Classic"}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Nutrition & Kitchen Quality Promise */}
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClickTick();
                        setExpandedBOM(expandedBOM === item.id ? null : item.id);
                      }}
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-400/90 hover:text-amber-300 py-0.5 px-2 rounded-md bg-amber-500/10 border border-amber-500/25 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{expandedBOM === item.id ? "Hide Quality & Nutrition" : "Nutrition & Kitchen Promise"}</span>
                      {expandedBOM === item.id ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>

                    {expandedBOM === item.id && (
                      <div className="mt-2 p-2.5 bg-slate-950/90 rounded-xl border border-amber-500/30 text-[10px] space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between font-bold text-amber-400 uppercase tracking-wider text-[9px]">
                          <span>Pure Mumbai Taste Promise</span>
                          <span className="text-emerald-400 font-bold">100% Fresh Daily</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-slate-300 text-[10px]">
                          <div className="flex items-center space-x-1">
                            <span className="text-amber-400 font-bold">🥔</span>
                            <span>Mountain Batata</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-amber-400 font-bold">🍞</span>
                            <span>Daily Baked Pav</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-amber-400 font-bold">🌿</span>
                            <span>Fresh Thecha & Chutney</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-amber-400 font-bold">🔥</span>
                            <span>Groundnut Oil Frying</span>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800 flex justify-between text-slate-400 text-[9px]">
                          <span>🔥 ~310 kcal / serving</span>
                          <span className="text-emerald-400 font-semibold">✓ 0g Trans Fats • Non-GMO</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Add Action */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Price</span>
                  <div className="text-lg font-black text-white">₹{item.price.toFixed(0)}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCustomizer(item)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Cart Bar for Mobile */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden z-30 animate-bounce-slight">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-2xl shadow-orange-500/40"
          >
            <div className="flex items-center space-x-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-white text-orange-600 flex items-center justify-center text-xs font-black">
                {totalCartCount}
              </span>
              <span>View Kadai</span>
            </div>
            <div className="text-sm font-black flex items-center space-x-1">
              <span>Checkout</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      {/* Production Customer Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-16 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 text-white font-black text-base mb-2">
              <span>🌶️</span>
              <span>BENGALURU PAV CO.</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Bengaluru&apos;s First Authentic Artisanal Vada Pav & Pav Street Food Craft Kitchen.
              Fresh small-batch frying in pure groundnut oil every 15 minutes.
            </p>
            <div className="mt-3 text-[10px] text-slate-500 space-y-0.5">
              <p>FSSAI Lic. 11224333000451</p>
              <p>GSTIN: 29AABCU9603R1ZM</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Koramangala Flagship Hub
            </h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              #402, 80 Feet Main Road, 4th Block, Koramangala, Bengaluru - 560034
            </p>
            <p className="text-slate-400 text-[11px] mt-2">
              Serving: Koramangala, HSR Layout, Indiranagar, BTM, Bellandur, JP Nagar
            </p>
            <p className="text-orange-400 font-bold text-[11px] mt-2">
              Kitchen Hours: 11:00 AM – 11:30 PM
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Customer Services
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a href="#menu" className="hover:text-orange-400 transition-colors">
                  Signature Vada Pav Catalog
                </a>
              </li>
              <li>
                <span className="text-slate-300">Bengaluru PIN Code Delivery Geofence</span>
              </li>
              <li>
                <span className="text-slate-300">Pav Rewards VIP Club (50 Welcome Pts)</span>
              </li>
              <li>
                <span className="text-slate-300">Contact: orders@mumbaipavco.in</span>
              </li>
              <li>
                <a
                  href="tel:+918469428342"
                  className="text-slate-300 hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>📞 Call: +91 84694 28342</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/918469428342?text=Hi%20Mumbai%20Pav%20Co%2C%20I%20have%20an%20inquiry%20regarding%20orders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <span>💬 WhatsApp: +91 84694 28342</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Internal Operations
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              For kitchen chefs, counter cashiers, and store operations managers:
            </p>
            <Link
              href="/staff/login"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-colors"
            >
              <span>🔒 Staff & Operations Login</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 text-center text-[10px] text-slate-600">
          © 2026 Bengaluru Pav Co. All Rights Reserved. Built with Next.js App Router, Prisma ORM, and Razorpay Payments.
        </div>
      </footer>

      {/* Item Customizer Modal */}
      <MenuCustomizerModal
        item={customizingItem}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        tableNumberPrefill={tableQuery}
      />
    </div>
  );
}

export default function StorefrontPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <StorefrontContent />
    </Suspense>
  );
}
