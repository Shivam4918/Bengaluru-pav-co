"use client";

import React, { useState, useEffect } from "react";
import StaffStationHeader from "@/components/StaffStationHeader";
import { sound } from "@/lib/sound";
import {
  validateName,
  validateEmail,
  validatePassword,
  getPasswordStrength,
} from "@/lib/validations";
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Shield,
  RefreshCw,
  Plus,
  Power,
  Users,
  ChefHat,
  Monitor,
  Trash2,
  Edit3,
  Key,
  X,
  ShieldCheck,
  UserPlus,
  Receipt,
  UserCheck,
  Search,
  CreditCard,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  UtensilsCrossed,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [storeData, setStoreData] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [menuItemsList, setMenuItemsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "ORDERS" | "CUSTOMERS" | "STAFF">("OVERVIEW");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  // Customers Pagination State
  const [customersPage, setCustomersPage] = useState<number>(1);
  const [customersPageSize, setCustomersPageSize] = useState<number>(10);

  // Orders Pagination State
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const [ordersPageSize, setOrdersPageSize] = useState<number>(10);

  // Staff Pagination State
  const [staffPage, setStaffPage] = useState<number>(1);
  const [staffPageSize, setStaffPageSize] = useState<number>(5);

  // Inventory Pagination & Search State
  const [inventoryPage, setInventoryPage] = useState<number>(1);
  const [inventoryPageSize, setInventoryPageSize] = useState<number>(5);
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>("ALL");

  // Quick Restock Modal
  const [restockModalItem, setRestockModalItem] = useState<any>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockError, setRestockError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Raw Material Add / Edit Modal State
  const [isRawMaterialModalOpen, setIsRawMaterialModalOpen] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState<any | null>(null);
  const [rawMaterialForm, setRawMaterialForm] = useState({
    name: "",
    category: "VEGETABLES",
    stockQty: 10,
    unit: "KG",
    thresholdQty: 2,
    costPerUnit: 50,
    recipeLinks: [] as { menuItemId: string; qtyPerItem: number; unit: string }[],
  });
  const [rawMaterialSubmitting, setRawMaterialSubmitting] = useState(false);
  const [rawMaterialError, setRawMaterialError] = useState<string | null>(null);
  const [rawMaterialTouched, setRawMaterialTouched] = useState<Record<string, boolean>>({});
  const [rawMaterialFieldErrors, setRawMaterialFieldErrors] = useState<Record<string, string | null>>({});

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "KITCHEN_STAFF" as "KITCHEN_STAFF" | "CASHIER",
  });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffTouched, setStaffTouched] = useState<Record<string, boolean>>({});
  const [staffFieldErrors, setStaffFieldErrors] = useState<Record<string, string | null>>({});

  const loadData = async () => {
    try {
      const [storeRes, invRes, staffRes, custRes, ordersRes] = await Promise.all([
        fetch("/api/store"),
        fetch("/api/inventory"),
        fetch("/api/admin/staff"),
        fetch("/api/admin/customers"),
        fetch("/api/orders?limit=100"),
      ]);
      const sData = await storeRes.json();
      const iData = await invRes.json();
      const staffData = await staffRes.json();
      const custData = await custRes.json();
      const ordersData = await ordersRes.json();

      setStoreData(sData);
      setInventory(iData.items || []);
      if (iData.menuItems) {
        setMenuItemsList(iData.menuItems);
      }
      if (staffData.staff) {
        setStaffList(staffData.staff);
        setCurrentAdminId(staffData.currentAdminId);
      }
      if (custData.customers) {
        setCustomersList(custData.customers);
      }
      if (ordersData.orders) {
        setOrdersList(ordersData.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStore = async () => {
    sound.playClickTick();
    const newStatus = !storeData?.store?.isStoreOpen;
    try {
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStoreOpen: newStatus }),
      });
      if (res.ok) {
        showToast(`Store is now ${newStatus ? "OPEN" : "CLOSED"}`);
        loadData();
      }
    } catch {}
  };

  const handleToggleSurge = async () => {
    sound.playClickTick();
    const newSurge = !storeData?.store?.surgeThrottleActive;
    try {
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surgeThrottleActive: newSurge }),
      });
      if (res.ok) {
        showToast(`Surge Throttle is now ${newSurge ? "ACTIVATED" : "DEACTIVATED"}`);
        loadData();
      }
    } catch {}
  };

  const handleRestockSubmit = async () => {
    if (!restockModalItem) return;
    sound.playClickTick();
    setRestockError(null);

    const qty = Number(restockQty);
    if (isNaN(qty) || qty <= 0) {
      setRestockError("Restock quantity must be greater than zero.");
      return;
    }
    if (qty > 10000) {
      setRestockError("Maximum single restock amount is 10,000 units.");
      return;
    }

    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId: restockModalItem.id,
          adjustmentQty: qty,
          reason: "Batch replenishment via Admin Console",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRestockError(data.error || "Restock failed");
        return;
      }

      showToast(`Restocked ${restockModalItem.name} (+${qty} ${restockModalItem.unit})`);
      setRestockModalItem(null);
      setRestockError(null);
      loadData();
    } catch {
      setRestockError("Connection error while adjusting stock.");
    }
  };

  // =========================================================================
  // Raw Material CRUD Actions
  // =========================================================================
  const handleOpenAddRawMaterial = () => {
    sound.playClickTick();
    setEditingRawMaterial(null);
    setRawMaterialForm({
      name: "",
      category: "VEGETABLES",
      stockQty: 10,
      unit: "KG",
      thresholdQty: 2,
      costPerUnit: 40,
      recipeLinks: [],
    });
    setRawMaterialError(null);
    setIsRawMaterialModalOpen(true);
  };

  const handleOpenEditRawMaterial = (item: any) => {
    sound.playClickTick();
    setEditingRawMaterial(item);
    const existingLinks = (item.recipeBOMs || []).map((bom: any) => ({
      menuItemId: bom.menuItem?.id || bom.menuItemId,
      qtyPerItem: bom.qtyPerItem,
      unit: bom.unit || item.unit,
    }));
    setRawMaterialForm({
      name: item.name,
      category: item.category,
      stockQty: item.stockQty,
      unit: item.unit,
      thresholdQty: item.thresholdQty,
      costPerUnit: item.costPerUnit,
      recipeLinks: existingLinks,
    });
    setRawMaterialError(null);
    setIsRawMaterialModalOpen(true);
  };

  const handleSaveRawMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickTick();
    setRawMaterialError(null);

    // Validate raw material fields
    const nameErr = !rawMaterialForm.name.trim()
      ? "Material name is required."
      : rawMaterialForm.name.trim().length < 2
      ? "Name must be at least 2 characters."
      : null;
    const stockErr =
      rawMaterialForm.stockQty < 0 ? "Stock quantity cannot be negative." : null;
    const threshErr =
      rawMaterialForm.thresholdQty < 0 ? "Safety buffer cannot be negative." : null;
    const costErr =
      rawMaterialForm.costPerUnit <= 0 ? "Cost per unit must be greater than ₹0." : null;

    setRawMaterialTouched({
      name: true,
      stockQty: true,
      thresholdQty: true,
      costPerUnit: true,
    });
    setRawMaterialFieldErrors({
      name: nameErr,
      stockQty: stockErr,
      thresholdQty: threshErr,
      costPerUnit: costErr,
    });

    if (nameErr || stockErr || threshErr || costErr) {
      setRawMaterialError("Please correct the highlighted fields before saving.");
      return;
    }

    setRawMaterialSubmitting(true);

    try {
      if (editingRawMaterial) {
        const res = await fetch("/api/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingRawMaterial.id,
            name: rawMaterialForm.name.trim(),
            category: rawMaterialForm.category,
            stockQty: Number(rawMaterialForm.stockQty),
            unit: rawMaterialForm.unit.trim().toUpperCase(),
            thresholdQty: Number(rawMaterialForm.thresholdQty),
            costPerUnit: Number(rawMaterialForm.costPerUnit),
            recipeLinks: rawMaterialForm.recipeLinks,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update raw material");

        showToast(`Updated raw material: ${rawMaterialForm.name}`);
      } else {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rawMaterialForm.name.trim(),
            category: rawMaterialForm.category,
            stockQty: Number(rawMaterialForm.stockQty),
            unit: rawMaterialForm.unit.trim().toUpperCase(),
            thresholdQty: Number(rawMaterialForm.thresholdQty),
            costPerUnit: Number(rawMaterialForm.costPerUnit),
            recipeLinks: rawMaterialForm.recipeLinks,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add raw material");

        showToast(`Added new raw material: ${rawMaterialForm.name}`);
      }

      setIsRawMaterialModalOpen(false);
      loadData();
    } catch (err: any) {
      setRawMaterialError(err.message || "An error occurred");
    } finally {
      setRawMaterialSubmitting(false);
    }
  };

  const handleDeleteRawMaterial = async (item: any) => {
    sound.playClickTick();
    if (!confirm(`Are you sure you want to delete "${item.name}"? This will also remove it from all linked Recipe BOMs.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory?id=${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete raw material");

      showToast(`Raw material "${item.name}" deleted successfully`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete raw material");
    }
  };

  const handleAddRecipeLinkRow = () => {
    sound.playClickTick();
    const defaultMenuItem = menuItemsList[0]?.id || "";
    setRawMaterialForm({
      ...rawMaterialForm,
      recipeLinks: [
        ...rawMaterialForm.recipeLinks,
        { menuItemId: defaultMenuItem, qtyPerItem: 0.05, unit: rawMaterialForm.unit },
      ],
    });
  };

  const handleRemoveRecipeLinkRow = (index: number) => {
    sound.playClickTick();
    const updated = rawMaterialForm.recipeLinks.filter((_, i) => i !== index);
    setRawMaterialForm({ ...rawMaterialForm, recipeLinks: updated });
  };

  const handleUpdateRecipeLinkRow = (index: number, field: string, value: any) => {
    const updated = [...rawMaterialForm.recipeLinks];
    updated[index] = { ...updated[index], [field]: value };
    setRawMaterialForm({ ...rawMaterialForm, recipeLinks: updated });
  };

  // =========================================================================
  // Staff Management Actions
  // =========================================================================
  const handleOpenAddStaff = () => {
    sound.playClickTick();
    setEditingStaff(null);
    setStaffForm({
      name: "",
      email: "",
      password: "",
      role: "KITCHEN_STAFF",
    });
    setStaffError(null);
    setStaffTouched({});
    setStaffFieldErrors({});
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: any) => {
    sound.playClickTick();
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      password: "",
      role: staff.role,
    });
    setStaffError(null);
    setStaffTouched({});
    setStaffFieldErrors({});
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickTick();
    setStaffError(null);

    const nameErr = validateName(staffForm.name);
    const emailErr = !editingStaff ? validateEmail(staffForm.email) : null;
    let pwdErr: string | null = null;
    if (!editingStaff) {
      pwdErr = validatePassword(staffForm.password);
    } else if (staffForm.password && staffForm.password.trim().length > 0) {
      pwdErr = validatePassword(staffForm.password);
    }

    setStaffTouched({ name: true, email: true, password: true });
    setStaffFieldErrors({ name: nameErr, email: emailErr, password: pwdErr });

    if (nameErr || emailErr || pwdErr) {
      setStaffError("Please correct highlighted fields.");
      return;
    }

    setStaffSubmitting(true);

    try {
      if (editingStaff) {
        const res = await fetch("/api/admin/staff", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStaff.id,
            name: staffForm.name.trim(),
            role: staffForm.role,
            password: staffForm.password ? staffForm.password.trim() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update staff member");

        showToast(`Updated staff details for ${staffForm.name}`);
      } else {
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: staffForm.name.trim(),
            email: staffForm.email.trim().toLowerCase(),
            password: staffForm.password,
            role: staffForm.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add staff member");

        showToast(`Added ${staffForm.name} to ${staffForm.role === "KITCHEN_STAFF" ? "Kitchen KDS" : "Counter POS"}`);
      }

      setIsStaffModalOpen(false);
      loadData();
    } catch (err: any) {
      setStaffError(err.message || "An error occurred");
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staff: any) => {
    sound.playClickTick();
    if (!confirm(`Are you sure you want to remove "${staff.name}" (${staff.email})? Their station login access will be revoked immediately.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff?id=${staff.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete staff");

      showToast(`Staff member ${staff.name} deleted successfully`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete staff member");
    }
  };

  const metrics = storeData?.metrics || {
    grossRevenue: 0,
    paidOrdersCount: 0,
    averageOrderValue: 0,
    totalGST: 0,
  };

  // Filtered lists
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.category.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory =
      inventoryCategoryFilter === "ALL" || item.category === inventoryCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalInventoryPages = Math.max(1, Math.ceil(filteredInventory.length / inventoryPageSize));
  const safeInventoryPage = Math.min(inventoryPage, totalInventoryPages);
  const startInventoryIdx = (safeInventoryPage - 1) * inventoryPageSize;
  const paginatedInventory = filteredInventory.slice(
    startInventoryIdx,
    startInventoryIdx + inventoryPageSize
  );

  const filteredCustomers = customersList.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const totalCustomersPages = Math.max(1, Math.ceil(filteredCustomers.length / customersPageSize));
  const safeCustomersPage = Math.min(customersPage, totalCustomersPages);
  const startCustomersIdx = (safeCustomersPage - 1) * customersPageSize;
  const paginatedCustomers = filteredCustomers.slice(
    startCustomersIdx,
    startCustomersIdx + customersPageSize
  );

  const filteredOrders = ordersList.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.includes(orderSearch))
  );

  const totalOrdersPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPageSize));
  const safeOrdersPage = Math.min(ordersPage, totalOrdersPages);
  const startOrdersIdx = (safeOrdersPage - 1) * ordersPageSize;
  const paginatedOrders = filteredOrders.slice(
    startOrdersIdx,
    startOrdersIdx + ordersPageSize
  );

  const totalStaffPages = Math.max(1, Math.ceil(staffList.length / staffPageSize));
  const safeStaffPage = Math.min(staffPage, totalStaffPages);
  const startStaffIdx = (safeStaffPage - 1) * staffPageSize;
  const paginatedStaff = staffList.slice(
    startStaffIdx,
    startStaffIdx + staffPageSize
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <StaffStationHeader
        stationName="Store Command Center • Master Database & HQ"
        badgeLabel="OWNER HQ"
        stationRole="ADMIN"
      />

      {/* Notice Toast */}
      {toastMessage && (
        <div className="bg-orange-500 text-white font-bold text-xs py-2 px-4 text-center shadow-lg animate-fade-in sticky top-16 z-30">
          {toastMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        {/* Top Header & Operational Master Toggles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl font-black text-white">Store Command & Database HQ</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live customer records, complete orders ledger, personnel access, and inventory BOM.
            </p>
          </div>

          {/* Operational Master Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Store Open/Close Toggle */}
            <button
              onClick={handleToggleStore}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                storeData?.store?.isStoreOpen
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
              }`}
            >
              <Power className="w-4 h-4" />
              <span>Store: {storeData?.store?.isStoreOpen ? "OPEN (Accepting)" : "CLOSED"}</span>
            </button>

            {/* Surge Throttle Toggle */}
            <button
              onClick={handleToggleSurge}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                storeData?.store?.surgeThrottleActive
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Surge Throttle: {storeData?.store?.surgeThrottleActive ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh All Database Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Gross Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              ₹{metrics.grossRevenue.toFixed(2)}
            </div>
            <p className="text-[11px] text-emerald-400 mt-1">Realized settled payments</p>
          </div>

          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Paid Orders</span>
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {metrics.paidOrdersCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{ordersList.length} total orders recorded</p>
          </div>

          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Registered Customers</span>
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {customersList.length}
            </div>
            <p className="text-[11px] text-amber-400 mt-1">Loyalty members signed up</p>
          </div>

          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>GST 5% Composite</span>
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              ₹{metrics.totalGST.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tax compliance ledger</p>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { key: "OVERVIEW", label: "Overview & Recipe BOM", icon: Package },
            { key: "CUSTOMERS", label: `Customers Directory (${customersList.length})`, icon: Users },
            { key: "ORDERS", label: `All Orders Ledger (${ordersList.length})`, icon: Receipt },
            { key: "STAFF", label: `Staff & Station Access (${staffList.length})`, icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  sound.playClickTick();
                  setActiveTab(tab.key as any);
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & RECIPE BOM */}
        {/* ========================================================================= */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6 animate-fade-in">
            {/* Peak Frying Hours Heatmap */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Peak Kadai Frying Hours Heatmap
                  </h3>
                  <p className="text-xs text-slate-400">Order intake distribution across Bengaluru peak meal slots</p>
                </div>
                <span className="text-xs font-semibold text-orange-400">🔥 Peak: 17:00 - 19:30</span>
              </div>

              {/* Hourly distribution bars */}
              <div className="overflow-x-auto pb-2 scrollbar-none">
                <div className="grid grid-cols-8 gap-2 pt-2 min-w-[500px]">
                  {[
                    { slot: "11-12", label: "Lunch", orders: 18, intensity: "bg-orange-500/30" },
                    { slot: "12-14", label: "Noon Rush", orders: 42, intensity: "bg-orange-500/60" },
                    { slot: "14-16", label: "Slump", orders: 12, intensity: "bg-orange-500/20" },
                    { slot: "16-17", label: "Chai Time", orders: 35, intensity: "bg-orange-500/50" },
                    { slot: "17-19", label: "Evening Rush", orders: 68, intensity: "bg-orange-500" },
                    { slot: "19-21", label: "Dinner", orders: 54, intensity: "bg-orange-500/80" },
                    { slot: "21-22", label: "Late Snack", orders: 28, intensity: "bg-orange-500/40" },
                    { slot: "22-23", label: "Night Cap", orders: 14, intensity: "bg-orange-500/20" },
                  ].map((bar) => (
                    <div key={bar.slot} className="flex flex-col items-center">
                      <div className="w-full h-24 bg-slate-800/80 rounded-xl flex items-end p-1 overflow-hidden">
                        <div
                          className={`w-full rounded-lg ${bar.intensity} transition-all`}
                          style={{ height: `${(bar.orders / 70) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-1">{bar.slot}</span>
                      <span className="text-[9px] text-slate-500">{bar.orders} tkts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recipe BOM & Inventory Table with FULL ADD, EDIT, DELETE & PAGINATION */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Package className="w-5 h-5 text-orange-400" />
                    <span>Raw Materials & Recipe BOM Stock Depletion</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ingredients auto-deduct with every Batata Vada Pav, Cheese slice, and Butter Pav prepared.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search input */}
                  <div className="relative w-44 sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search ingredient..."
                      value={inventorySearch}
                      onChange={(e) => {
                        setInventorySearch(e.target.value);
                        setInventoryPage(1);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-2.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Category filter */}
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => {
                      setInventoryCategoryFilter(e.target.value);
                      setInventoryPage(1);
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="VEGETABLES">Vegetables</option>
                    <option value="BAKERY">Bakery</option>
                    <option value="DAIRY">Dairy</option>
                    <option value="DRY_GROCERY">Dry Grocery</option>
                    <option value="SPICES">Spices</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="BEVERAGES">Beverages</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleOpenAddRawMaterial}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Raw Material</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Ingredient & Recipe Links</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">In Stock</th>
                      <th className="p-3.5">Safety Buffer</th>
                      <th className="p-3.5">Unit Cost</th>
                      <th className="p-3.5">BOM Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {paginatedInventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 text-xs">
                          {inventory.length === 0
                            ? 'No raw materials registered. Click "+ Add Raw Material" to create your first ingredient.'
                            : "No raw materials found matching your search or category filter."}
                        </td>
                      </tr>
                    ) : (
                      paginatedInventory.map((item) => {
                        const isLow = item.stockQty <= item.thresholdQty;
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-white flex items-center space-x-2">
                                <span>{item.name}</span>
                              </div>
                              {item.recipeBOMs && item.recipeBOMs.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.recipeBOMs.map((bom: any) => (
                                    <span
                                      key={bom.id}
                                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300 font-mono"
                                      title={`${bom.menuItem?.title}: ${bom.qtyPerItem} ${bom.unit}`}
                                    >
                                      🍽️ {bom.menuItem?.title?.split(" ")[0]} ({bom.qtyPerItem} {bom.unit})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Not linked to any recipe
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-400">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-white text-sm">
                                {item.stockQty.toFixed(1)} {item.unit}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-400">
                              {item.thresholdQty} {item.unit}
                            </td>
                            <td className="p-3.5 text-slate-400 font-mono">
                              ₹{item.costPerUnit}/{item.unit}
                            </td>
                            <td className="p-3.5">
                              {isLow ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>LOW STOCK</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>OPTIMAL</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playClickTick();
                                  setRestockModalItem(item);
                                  setRestockQty(10);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-300 font-semibold rounded-lg text-xs transition-colors"
                                title="Quick batch restock"
                              >
                                + Restock
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditRawMaterial(item)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-lg text-xs transition-colors"
                                title="Edit ingredient details & Recipe BOM links"
                              >
                                <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRawMaterial(item)}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-semibold rounded-lg text-xs transition-colors"
                                title="Delete raw material"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Bar */}
              {filteredInventory.length > 0 && (
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span>
                      Showing <strong className="text-white">{startInventoryIdx + 1}</strong> to{" "}
                      <strong className="text-white">
                        {Math.min(startInventoryIdx + inventoryPageSize, filteredInventory.length)}
                      </strong>{" "}
                      of <strong className="text-white">{filteredInventory.length}</strong> ingredients
                    </span>

                    <div className="flex items-center space-x-1">
                      <span>Per page:</span>
                      <select
                        value={inventoryPageSize}
                        onChange={(e) => {
                          setInventoryPageSize(Number(e.target.value));
                          setInventoryPage(1);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={safeInventoryPage <= 1}
                      onClick={() => {
                        sound.playClickTick();
                        setInventoryPage((p) => Math.max(1, p - 1));
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    {/* Page Number Buttons */}
                    {Array.from({ length: totalInventoryPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          sound.playClickTick();
                          setInventoryPage(pageNum);
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          safeInventoryPage === pageNum
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={safeInventoryPage >= totalInventoryPages}
                      onClick={() => {
                        sound.playClickTick();
                        setInventoryPage((p) => Math.min(totalInventoryPages, p + 1));
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CUSTOMERS DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === "CUSTOMERS" && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 animate-fade-in shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <span>Customer Directory & Pav Loyalty Ledger</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All customer profiles, contact numbers, order frequency, and loyalty points balances.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, or email..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCustomersPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Email & Phone</th>
                    <th className="p-3.5">Total Orders</th>
                    <th className="p-3.5">Lifetime Spend</th>
                    <th className="p-3.5">Pav Points Balance</th>
                    <th className="p-3.5">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                        No customer accounts found matching your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-white">
                          {c.name}
                        </td>
                        <td className="p-3.5">
                          <div className="text-slate-300">{c.email}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{c.phone}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-white">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] font-bold">
                            {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400">
                          ₹{c.lifetimeSpend.toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px]">
                            <Award className="w-3 h-3" />
                            <span>{c.loyaltyPoints} pts</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {new Date(c.joinedDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Customers Pagination Controls */}
            {filteredCustomers.length > 0 && (
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span>
                    Showing <strong className="text-white">{startCustomersIdx + 1}</strong> to{" "}
                    <strong className="text-white">
                      {Math.min(startCustomersIdx + customersPageSize, filteredCustomers.length)}
                    </strong>{" "}
                    of <strong className="text-white">{filteredCustomers.length}</strong> customers
                  </span>

                  <div className="flex items-center space-x-1">
                    <span>Per page:</span>
                    <select
                      value={customersPageSize}
                      onChange={(e) => {
                        setCustomersPageSize(Number(e.target.value));
                        setCustomersPage(1);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={safeCustomersPage <= 1}
                    onClick={() => {
                      sound.playClickTick();
                      setCustomersPage((p) => Math.max(1, p - 1));
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  {/* Page Number Buttons */}
                  {Array.from({ length: totalCustomersPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        sound.playClickTick();
                        setCustomersPage(pageNum);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        safeCustomersPage === pageNum
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safeCustomersPage >= totalCustomersPages}
                    onClick={() => {
                      sound.playClickTick();
                      setCustomersPage((p) => Math.min(totalCustomersPages, p + 1));
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ALL ORDERS LEDGER */}
        {/* ========================================================================= */}
        {activeTab === "ORDERS" && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 animate-fade-in shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-orange-400" />
                  <span>All Store Orders & Transaction Ledger</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete ledger of storefront web orders and counter POS transactions with live preparation statuses.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search token # or customer..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrdersPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Order / Token</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Items Summary</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Order Status</th>
                    <th className="p-3.5">Placed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500 text-xs">
                        No orders recorded yet. As customers order, tickets will stream in here live.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-orange-400">
                          #{o.orderNumber}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{o.customerName || "Guest"}</div>
                          <div className="text-slate-500 text-[11px] font-mono">{o.customerPhone || "—"}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase">
                            {o.orderType}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-300">
                          {o.items?.map((it: any) => `${it.quantity}x ${it.itemTitle || it.name || "Item"}`).join(", ") || "—"}
                        </td>
                        <td className="p-3.5 font-black text-white">
                          ₹{o.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.paymentStatus === "PAID"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === "COMPLETED"
                                ? "bg-blue-500/20 text-blue-400"
                                : o.status === "READY_FOR_PICKUP"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : o.status === "PREPARING"
                                ? "bg-amber-500/20 text-amber-400 animate-pulse"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Orders Pagination Controls */}
            {filteredOrders.length > 0 && (
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span>
                    Showing <strong className="text-white">{startOrdersIdx + 1}</strong> to{" "}
                    <strong className="text-white">
                      {Math.min(startOrdersIdx + ordersPageSize, filteredOrders.length)}
                    </strong>{" "}
                    of <strong className="text-white">{filteredOrders.length}</strong> orders
                  </span>

                  <div className="flex items-center space-x-1">
                    <span>Per page:</span>
                    <select
                      value={ordersPageSize}
                      onChange={(e) => {
                        setOrdersPageSize(Number(e.target.value));
                        setOrdersPage(1);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={safeOrdersPage <= 1}
                    onClick={() => {
                      sound.playClickTick();
                      setOrdersPage((p) => Math.max(1, p - 1));
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  {/* Page Number Buttons */}
                  {Array.from({ length: totalOrdersPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        sound.playClickTick();
                        setOrdersPage(pageNum);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        safeOrdersPage === pageNum
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safeOrdersPage >= totalOrdersPages}
                    onClick={() => {
                      sound.playClickTick();
                      setOrdersPage((p) => Math.min(totalOrdersPages, p + 1));
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STORE STAFF & STATION ACCESS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === "STAFF" && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                  <span>Store Personnel & Station Access Control</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add, edit, or remove staff accounts. Authorized personnel can immediately sign in to their dedicated station.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddStaff}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Staff Member</span>
              </button>
            </div>

            {/* Staff Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Work Login Email</th>
                    <th className="p-3.5">Assigned Station</th>
                    <th className="p-3.5">Access Rights</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                        No staff accounts found. Click "+ Add Staff Member" to authorize personnel.
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((member) => {
                      const isSelf = member.id === currentAdminId || member.email === "shivam4918@gmail.com";
                      const isChef = member.role === "KITCHEN_STAFF";
                      const isCashier = member.role === "CASHIER";
                      const isAdmin = member.role === "ADMIN";

                      return (
                        <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-white flex items-center space-x-2">
                              <span>{member.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                            {member.email}
                          </td>
                          <td className="p-3.5">
                            {isChef && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                                <ChefHat className="w-3.5 h-3.5" />
                                <span>Kitchen KDS (`/kds`)</span>
                              </span>
                            )}
                            {isCashier && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                                <Monitor className="w-3.5 h-3.5" />
                                <span>Express POS (`/pos`)</span>
                              </span>
                            )}
                            {isAdmin && (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Store Admin (Master)</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {isChef && "Orders, Ticket SLAs, Kadai Queue"}
                            {isCashier && "Walk-in billing, KOT, Counter Orders"}
                            {isAdmin && "All Stations & Financial Reports"}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStaff(member)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                              title="Edit details or reset password"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(member)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs font-semibold transition-colors"
                                title="Delete staff account and revoke access immediately"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Staff Pagination Controls */}
            {staffList.length > 0 && (
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span>
                    Showing <strong className="text-white">{startStaffIdx + 1}</strong> to{" "}
                    <strong className="text-white">
                      {Math.min(startStaffIdx + staffPageSize, staffList.length)}
                    </strong>{" "}
                    of <strong className="text-white">{staffList.length}</strong> staff accounts
                  </span>

                  <div className="flex items-center space-x-1">
                    <span>Per page:</span>
                    <select
                      value={staffPageSize}
                      onChange={(e) => {
                        setStaffPageSize(Number(e.target.value));
                        setStaffPage(1);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={safeStaffPage <= 1}
                    onClick={() => {
                      sound.playClickTick();
                      setStaffPage((p) => Math.max(1, p - 1));
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  {/* Page Number Buttons */}
                  {Array.from({ length: totalStaffPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        sound.playClickTick();
                        setStaffPage(pageNum);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        safeStaffPage === pageNum
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safeStaffPage >= totalStaffPages}
                    onClick={() => {
                      sound.playClickTick();
                      setStaffPage((p) => Math.min(totalStaffPages, p + 1));
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT RAW MATERIAL & RECIPE BOM LINKING */}
      {/* ========================================================================= */}
      {isRawMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRawMaterial ? `Edit Raw Material: ${editingRawMaterial.name}` : "Add New Raw Material"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure stock levels, safety threshold alerts, and Recipe BOM auto-depletion.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRawMaterialModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rawMaterialError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{rawMaterialError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRawMaterial} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Ingredient Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Garlic (Lasun)"
                    value={rawMaterialForm.name}
                    onBlur={() => {
                      setRawMaterialTouched((prev) => ({ ...prev, name: true }));
                      setRawMaterialFieldErrors((prev) => ({
                        ...prev,
                        name: !rawMaterialForm.name.trim()
                          ? "Material name is required."
                          : rawMaterialForm.name.trim().length < 2
                          ? "Name must be at least 2 characters."
                          : null,
                      }));
                    }}
                    onChange={(e) => {
                      setRawMaterialForm({ ...rawMaterialForm, name: e.target.value });
                      if (rawMaterialTouched.name) {
                        setRawMaterialFieldErrors((prev) => ({
                          ...prev,
                          name: !e.target.value.trim()
                            ? "Material name is required."
                            : e.target.value.trim().length < 2
                            ? "Name must be at least 2 characters."
                            : null,
                        }));
                      }
                    }}
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors ${
                      rawMaterialTouched.name && rawMaterialFieldErrors.name
                        ? "border-red-500 focus:border-red-500"
                        : rawMaterialTouched.name && !rawMaterialFieldErrors.name
                        ? "border-emerald-500/80 focus:border-emerald-500"
                        : "border-slate-700 focus:border-orange-500"
                    }`}
                  />
                  {rawMaterialTouched.name && rawMaterialFieldErrors.name && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span>{rawMaterialFieldErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Ingredient Category
                  </label>
                  <select
                    value={rawMaterialForm.category}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="VEGETABLES">🥔 Vegetables (Potatoes, Chillies, Coriander)</option>
                    <option value="BAKERY">🍞 Bakery (Laadi Pav, Burger Buns)</option>
                    <option value="DAIRY">🧈 Dairy (Amul Butter, Cheese Slices)</option>
                    <option value="DRY_GROCERY">🌾 Dry Grocery (Besan, Flour, Frying Oil)</option>
                    <option value="SPICES">🌶️ Spices & Seasonings (Thecha, CTC Tea, Mustard)</option>
                    <option value="PACKAGING">📦 Packaging & Disposables</option>
                    <option value="BEVERAGES">🥤 Beverages & Syrups</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0}
                    value={rawMaterialForm.stockQty}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, stockQty: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Unit
                  </label>
                  <select
                    value={rawMaterialForm.unit}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="KG">KG (Kilograms)</option>
                    <option value="GRAMS">GRAMS</option>
                    <option value="PACKETS">PACKETS</option>
                    <option value="PIECES">PIECES</option>
                    <option value="LITRES">LITRES</option>
                    <option value="ML">ML</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" title="Alert triggered when stock falls below this">
                    Safety Buffer
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0}
                    value={rawMaterialForm.thresholdQty}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, thresholdQty: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0}
                    value={rawMaterialForm.costPerUnit}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, costPerUnit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold text-emerald-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Recipe BOM Depletion Mapping Section */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Recipe BOM Auto-Depletion Links</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      When customers order these menu items, this ingredient will auto-deduct from stock.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRecipeLinkRow}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Link Menu Recipe</span>
                  </button>
                </div>

                {rawMaterialForm.recipeLinks.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-500 text-center">
                    No recipe links attached. Click "+ Link Menu Recipe" if this item is part of a menu item recipe.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {rawMaterialForm.recipeLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <select
                          value={link.menuItemId}
                          onChange={(e) => handleUpdateRecipeLinkRow(idx, "menuItemId", e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        >
                          {menuItemsList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center space-x-1 w-32">
                          <input
                            type="number"
                            step="any"
                            min={0.001}
                            placeholder="Qty"
                            value={link.qtyPerItem}
                            onChange={(e) => handleUpdateRecipeLinkRow(idx, "qtyPerItem", Number(e.target.value))}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                          />
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            {rawMaterialForm.unit}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeLinkRow(idx)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove recipe link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRawMaterialModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rawMaterialSubmitting}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
                >
                  {rawMaterialSubmitting
                    ? "Saving..."
                    : editingRawMaterial
                    ? "Update Raw Material"
                    : "Save New Raw Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT STAFF MEMBER */}
      {/* ========================================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingStaff ? `Edit Personnel: ${editingStaff.name}` : "Authorize New Staff Member"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingStaff ? "Update role or reset login password." : "Create station access for kitchen or counter staff."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={staffForm.name}
                  onBlur={() => {
                    setStaffTouched((prev) => ({ ...prev, name: true }));
                    setStaffFieldErrors((prev) => ({ ...prev, name: validateName(staffForm.name) }));
                  }}
                  onChange={(e) => {
                    setStaffForm({ ...staffForm, name: e.target.value });
                    if (staffTouched.name) {
                      setStaffFieldErrors((prev) => ({ ...prev, name: validateName(e.target.value) }));
                    }
                  }}
                  className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${
                    staffTouched.name && staffFieldErrors.name
                      ? "border-red-500 focus:border-red-500"
                      : staffTouched.name && !staffFieldErrors.name
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
                {staffTouched.name && staffFieldErrors.name && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{staffFieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Work Login Email *
                </label>
                <input
                  type="email"
                  disabled={!!editingStaff}
                  placeholder="e.g. ramesh.chef@mumbaipav.co"
                  value={staffForm.email}
                  onBlur={() => {
                    if (!editingStaff) {
                      setStaffTouched((prev) => ({ ...prev, email: true }));
                      setStaffFieldErrors((prev) => ({ ...prev, email: validateEmail(staffForm.email) }));
                    }
                  }}
                  onChange={(e) => {
                    setStaffForm({ ...staffForm, email: e.target.value });
                    if (staffTouched.email && !editingStaff) {
                      setStaffFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                    }
                  }}
                  className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors disabled:opacity-50 ${
                    staffTouched.email && staffFieldErrors.email
                      ? "border-red-500 focus:border-red-500"
                      : staffTouched.email && !staffFieldErrors.email
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
                {staffTouched.email && staffFieldErrors.email && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{staffFieldErrors.email}</span>
                  </p>
                )}
                {editingStaff && (
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Email cannot be changed after creation.</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Assigned Station Role *
                </label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="KITCHEN_STAFF">🍳 Kitchen Display System (KDS) - Fry Chefs</option>
                  <option value="CASHIER">🖥️ Express Counter POS - Cashiers & Walk-in Billing</option>
                  <option value="ADMIN">👑 Store Admin - Full HQ & Inventory Access</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {editingStaff ? "Reset Password (leave blank to keep current)" : "Station Password *"}
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? "text" : "password"}
                    placeholder={editingStaff ? "Enter new password to reset" : "Min 8 chars, 1 upper, 1 special"}
                    value={staffForm.password}
                    onBlur={() => {
                      if (!editingStaff || staffForm.password) {
                        setStaffTouched((prev) => ({ ...prev, password: true }));
                        setStaffFieldErrors((prev) => ({
                          ...prev,
                          password: validatePassword(staffForm.password),
                        }));
                      }
                    }}
                    onChange={(e) => {
                      setStaffForm({ ...staffForm, password: e.target.value });
                      if (staffTouched.password) {
                        setStaffFieldErrors((prev) => ({
                          ...prev,
                          password: e.target.value ? validatePassword(e.target.value) : editingStaff ? null : "Password required",
                        }));
                      }
                    }}
                    className={`w-full bg-slate-950 border rounded-xl pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none transition-colors ${
                      staffTouched.password && staffFieldErrors.password
                        ? "border-red-500 focus:border-red-500"
                        : staffTouched.password && !staffFieldErrors.password && staffForm.password
                        ? "border-emerald-500/80 focus:border-emerald-500"
                        : "border-slate-700 focus:border-orange-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {staffForm.password.length > 0 && getPasswordStrength(staffForm.password).score < 4 && (
                  <div className="mt-2 space-y-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className="font-bold text-emerald-400">{getPasswordStrength(staffForm.password).label}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPasswordStrength(staffForm.password).colorClass}`}
                        style={{ width: `${(getPasswordStrength(staffForm.password).score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {staffTouched.password && staffFieldErrors.password && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{staffFieldErrors.password}</span>
                  </p>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffSubmitting}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
                >
                  {staffSubmitting ? "Saving..." : editingStaff ? "Update Staff" : "Authorize & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK BATCH RESTOCK */}
      {/* ========================================================================= */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Restock {restockModalItem.name}
            </h3>
            <p className="text-xs text-slate-400">
              Current stock: {restockModalItem.stockQty.toFixed(1)} {restockModalItem.unit}
            </p>

            {restockError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{restockError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantity to Add ({restockModalItem.unit}) *
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={restockQty}
                onChange={(e) => {
                  setRestockQty(Number(e.target.value));
                  setRestockError(null);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setRestockModalItem(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRestockSubmit}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
