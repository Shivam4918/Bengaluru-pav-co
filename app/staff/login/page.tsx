"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setSessionUser } from "@/lib/auth";
import { sound } from "@/lib/sound";
import { validateEmail } from "@/lib/validations";
import {
  ChefHat,
  Monitor,
  LayoutDashboard,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const errorMessage = searchParams.get("error");

  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "KITCHEN_STAFF" | "CASHIER">("ADMIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage);

  // Field validation states
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [fieldErrors, setFieldErrors] = useState<{ email?: string | null; password?: string | null }>({});

  const roleMeta = {
    ADMIN: {
      title: "Store HQ Command Center",
      desc: "For Business Owners & Operations Managers",
      icon: LayoutDashboard,
      color: "from-blue-500 to-indigo-600",
      placeholderEmail: "admin@mumbaipavco.in",
      targetPath: "/admin",
      roleLabel: "Store Owner / Admin",
    },
    KITCHEN_STAFF: {
      title: "Kitchen Station Display (KDS)",
      desc: "For Fry Chefs & Food Preparation Staff",
      icon: ChefHat,
      color: "from-amber-500 to-orange-600",
      placeholderEmail: "kds@mumbaipavco.in",
      targetPath: "/kds",
      roleLabel: "Head Fry Chef",
    },
    CASHIER: {
      title: "Counter POS Register",
      desc: "For Front Cashiers & Walk-in Billing",
      icon: Monitor,
      color: "from-emerald-500 to-green-600",
      placeholderEmail: "pos@mumbaipavco.in",
      targetPath: "/pos",
      roleLabel: "Counter Cashier",
    },
  };

  const handleRoleSelect = (roleKey: "ADMIN" | "KITCHEN_STAFF" | "CASHIER") => {
    sound.playClickTick();
    setSelectedRole(roleKey);
    setEmail("");
    setPassword("");
    setError(null);
    setTouched({});
    setFieldErrors({});
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickTick();
    setError(null);

    const emailErr = validateEmail(email);
    const pwdErr = !password ? "Password is required." : null;

    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailErr, password: pwdErr });

    if (emailErr || pwdErr) {
      setError("Please fix the errors below before continuing.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Invalid credentials.");
      }

      const user = data.user;

      // Verify role authorization for chosen station
      if (selectedRole === "ADMIN" && user.role !== "ADMIN") {
        throw new Error("Access denied. Admin role required for Store HQ.");
      }
      if (selectedRole === "KITCHEN_STAFF" && user.role !== "KITCHEN_STAFF" && user.role !== "ADMIN") {
        throw new Error("Access denied. Kitchen Staff or Admin role required.");
      }
      if (selectedRole === "CASHIER" && user.role !== "CASHIER" && user.role !== "ADMIN") {
        throw new Error("Access denied. Cashier or Admin role required.");
      }

      setSessionUser(user);
      sound.playOrderReadyChime();

      // Determine destination based on selected station role
      let target = roleMeta[selectedRole].targetPath;

      // If a specific redirect was requested and user is authorized, use it
      if (rawRedirect && rawRedirect !== "/staff/login") {
        if (rawRedirect.startsWith("/admin") && user.role !== "ADMIN") {
          target = roleMeta[selectedRole].targetPath;
        } else if (rawRedirect.startsWith("/pos") && user.role !== "CASHIER" && user.role !== "ADMIN") {
          target = roleMeta[selectedRole].targetPath;
        } else if (rawRedirect.startsWith("/kds") && user.role !== "KITCHEN_STAFF" && user.role !== "ADMIN") {
          target = roleMeta[selectedRole].targetPath;
        } else {
          target = rawRedirect;
        }
      }

      // Hard redirect to ensure fresh HttpOnly cookie is recognized by Edge middleware
      window.location.href = target;
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setSubmitting(false);
    }
  };

  const activeMeta = roleMeta[selectedRole];
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-orange-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.1),transparent_70%)] pointer-events-none" />

      {/* Back to Customer Menu */}
      <div className="mb-4 sm:mb-0 sm:absolute sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Customer Storefront</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl mx-auto shadow-xl shadow-orange-500/20 mb-3">
            🌶️
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Staff & Kitchen Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise role-based authentication for Mumbai Pav Co.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Select Tabs */}
        <div className="mt-6 grid grid-cols-3 gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          {[
            { key: "ADMIN", label: "Owner HQ", icon: LayoutDashboard },
            { key: "KITCHEN_STAFF", label: "Kitchen KDS", icon: ChefHat },
            { key: "CASHIER", label: "Express POS", icon: Monitor },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleRoleSelect(tab.key as any)}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                  isSelected
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Login Box */}
        <div className="mt-4 bg-slate-900/90 border border-slate-800 py-6 px-6 shadow-2xl rounded-3xl space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeMeta.color} flex items-center justify-center text-white shadow`}>
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{activeMeta.title}</h3>
              <p className="text-[11px] text-slate-400">{activeMeta.desc}</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Authorized Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }));
                    setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
                  }}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                    }
                  }}
                  placeholder={activeMeta.placeholderEmail}
                  className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition-colors ${
                    touched.email && fieldErrors.email
                      ? "border-red-500 focus:border-red-500"
                      : touched.email && !fieldErrors.email
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, password: true }));
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: !password ? "Password is required." : null,
                    }));
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: !e.target.value ? "Password is required." : null,
                      }));
                    }
                  }}
                  placeholder="Enter your password"
                  className={`w-full bg-slate-950 border rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none transition-colors ${
                    touched.password && fieldErrors.password
                      ? "border-red-500 focus:border-red-500"
                      : touched.password && !fieldErrors.password
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{submitting ? "Verifying..." : "Authorize & Sign In"}</span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4">
          Looking to order hot vada pavs?{" "}
          <Link href="/" className="text-orange-400 hover:underline font-bold">
            Go to Customer Storefront
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StaffLoginContent />
    </Suspense>
  );
}
