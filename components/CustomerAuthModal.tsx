"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, setSessionUser } from "@/lib/auth";
import { sound } from "@/lib/sound";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  validateDob,
  validateAddress,
  validatePincode,
  getPasswordStrength,
  normalizeIndianPhone,
} from "@/lib/validations";
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  LogOut,
  Gift,
  ShieldCheck,
  RotateCcw,
  Clock,
  Receipt,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  MapPin,
  Calendar,
  Save,
} from "lucide-react";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
  onReorder?: (items: any[]) => void;
}

type AuthMode = "SIGN_IN" | "REGISTER" | "FORGOT_PASSWORD" | "RESET_PASSWORD";

export default function CustomerAuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onReorder,
}: CustomerAuthModalProps) {
  const router = useRouter();

  // Mode & Tabs
  const [authMode, setAuthMode] = useState<AuthMode>("SIGN_IN");
  const [loggedInTab, setLoggedInTab] = useState<"rewards" | "orders" | "profile">("rewards");
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sign In & Registration Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot / Reset Password Fields
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetFeedbackMsg, setResetFeedbackMsg] = useState<string | null>(null);

  // Profile Edit Fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPincode, setEditPincode] = useState("560034");
  const [editProfileSaving, setEditProfileSaving] = useState(false);
  const [editProfileSuccess, setEditProfileSuccess] = useState<string | null>(null);

  // Real-Time Touched & Error States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);

  // General Status
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fetch updated user profile & recent orders on modal open
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setLoadingOrders(true);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          onUserChange(data.user);
          setSessionUser(data.user);
          setEditName(data.user.name || "");
          setEditPhone(data.user.phone || "");
          if (data.user.addresses && data.user.addresses.length > 0) {
            const def = data.user.addresses.find((a: any) => a.isDefault) || data.user.addresses[0];
            setEditAddress(def.addressLine || "");
            setEditPincode(def.pincode || "560034");
          }
          if (data.user.recentOrders) {
            setRecentOrders(data.user.recentOrders);
          }
        }
      })
      .catch((err) => console.error("Profile refresh error:", err))
      .finally(() => setLoadingOrders(false));
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Live Password Strength
  const regPasswordStrength = getPasswordStrength(password);
  const resetPasswordStrength = getPasswordStrength(newPassword);

  // Asynchronous Email Availability Checker
  const handleEmailBlur = async () => {
    markTouched("email");
    const formatErr = validateEmail(email);
    if (formatErr) {
      setErrors((prev) => ({ ...prev, email: formatErr }));
      return;
    }

    if (authMode === "REGISTER") {
      setCheckingEmail(true);
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (!data.available) {
          setErrors((prev) => ({ ...prev, email: "This email address is already registered." }));
        } else {
          setErrors((prev) => ({ ...prev, email: null }));
        }
      } catch {
        // Fallback to null on network glitch
        setErrors((prev) => ({ ...prev, email: null }));
      } finally {
        setCheckingEmail(false);
      }
    } else {
      setErrors((prev) => ({ ...prev, email: null }));
    }
  };

  const handleLogout = async () => {
    sound.playClickTick();
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
    onUserChange(null);
    onClose();
  };

  // =========================================================================
  // AUTH SUBMISSION (Sign In & Register)
  // =========================================================================
  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickTick();
    setFormError(null);
    setFormSuccess(null);

    // Validate all fields
    const currentErrors: Record<string, string | null> = {};

    if (authMode === "REGISTER") {
      currentErrors.name = validateName(name);
      currentErrors.email = validateEmail(email);
      currentErrors.phone = validatePhone(phone, false);
      currentErrors.password = validatePassword(password);
      currentErrors.confirmPassword = validateConfirmPassword(password, confirmPassword);
      if (dob) {
        currentErrors.dob = validateDob(dob, 13);
      }
    } else {
      currentErrors.email = validateEmail(email);
      if (!password) currentErrors.password = "Please enter your password.";
    }

    setErrors(currentErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      dob: true,
    });

    const hasErrors = Object.values(currentErrors).some((err) => err !== null);
    if (hasErrors) {
      setFormError("Please correct the highlighted fields before submitting.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = authMode === "REGISTER" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        authMode === "REGISTER"
          ? {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            confirmPassword,
            phone: phone ? normalizeIndianPhone(phone) : undefined,
            dateOfBirth: dob || undefined,
          }
          : {
            email: email.trim().toLowerCase(),
            password,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setSessionUser(data.user);
      onUserChange(data.user);
      sound.playOrderReadyChime();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to authenticate. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // FORGOT PASSWORD SUBMISSION
  // =========================================================================
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickTick();
    setFormError(null);
    setResetFeedbackMsg(null);

    const emailErr = validateEmail(resetEmail);
    if (emailErr) {
      setErrors((prev) => ({ ...prev, resetEmail: emailErr }));
      setTouched((prev) => ({ ...prev, resetEmail: true }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request password reset");

      setResetFeedbackMsg(
        data.demoCode
          ? `Verification code sent! (Dev Demo Code: ${data.demoCode})`
          : data.message || "Verification code sent to your email."
      );
      if (data.demoCode) {
        setResetCode(data.demoCode);
      }
      setAuthMode("RESET_PASSWORD");
    } catch (err: any) {
      setFormError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // RESET PASSWORD SUBMISSION
  // =========================================================================
  const handlePerformPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickTick();
    setFormError(null);
    setFormSuccess(null);

    const pwdErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(newPassword, confirmNewPassword);

    if (!resetCode || resetCode.trim().length < 4) {
      setFormError("Please enter the 6-digit verification code.");
      return;
    }
    if (pwdErr || confirmErr) {
      setFormError(pwdErr || confirmErr);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          resetCode: resetCode.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setFormSuccess(data.message || "Password reset successful! Please sign in.");
      setTimeout(() => {
        setAuthMode("SIGN_IN");
        setEmail(resetEmail);
        setPassword("");
        setFormSuccess(null);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // CUSTOMER PROFILE & ADDRESS UPDATE
  // =========================================================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickTick();
    setEditProfileSuccess(null);
    setFormError(null);

    const nameErr = validateName(editName);
    const phoneErr = validatePhone(editPhone, false);
    const addrErr = editAddress ? validateAddress(editAddress, false) : null;
    const pinErr = editPincode ? validatePincode(editPincode, false) : null;

    if (nameErr || phoneErr || addrErr || pinErr) {
      setFormError(nameErr || phoneErr || addrErr || pinErr || "Invalid profile data");
      return;
    }

    setEditProfileSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone ? normalizeIndianPhone(editPhone) : null,
          addressLine: editAddress.trim() || undefined,
          pincode: editPincode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      onUserChange(data.user);
      setSessionUser(data.user);
      setEditProfileSuccess("Profile and delivery address updated successfully!");
      sound.playOrderReadyChime();
      setTimeout(() => setEditProfileSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save profile changes.");
    } finally {
      setEditProfileSaving(false);
    }
  };

  const handleReorderClick = (order: any) => {
    sound.playOrderReadyChime();
    if (onReorder && order.items) {
      onReorder(order.items);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* =================================================================== */}
        {/* LOGGED IN USER INTERFACE */}
        {/* =================================================================== */}
        {currentUser ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* User Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-white text-lg flex-shrink-0 shadow-md shadow-orange-500/20">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-base leading-tight truncate">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                {currentUser.phone && (
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{currentUser.phone}</p>
                )}
              </div>
            </div>

            {/* Profile Tab Navigation */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  sound.playClickTick();
                  setLoggedInTab("rewards");
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1 transition-all ${loggedInTab === "rewards"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <Gift className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Rewards</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClickTick();
                  setLoggedInTab("orders");
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1 transition-all ${loggedInTab === "orders"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Orders ({recentOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClickTick();
                  setLoggedInTab("profile");
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1 transition-all ${loggedInTab === "profile"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Edit Info</span>
              </button>
            </div>

            {/* Tab 1: Rewards & Benefits */}
            {loggedInTab === "rewards" && (
              <div className="space-y-3.5 animate-fade-in">
                {/* Loyalty Points Card */}
                <div className="p-4 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border border-orange-500/35 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-300 flex items-center space-x-1.5">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>Pav Rewards Balance</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Active Member
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white mt-2 font-mono">
                    {currentUser.loyaltyPoints} <span className="text-sm font-bold text-amber-400">Points</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-orange-500/20 text-[11px] text-slate-300 space-y-1">
                    <p className="flex items-center space-x-1.5">
                      <span className="text-amber-400">⚡</span>
                      <span>50 Points = ₹25.00 discount on your order</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <span className="text-emerald-400">🪙</span>
                      <span>Earn 10 points with every order placed</span>
                    </p>
                  </div>
                </div>

                {/* Member Perks Box */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
                  <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Your Member Perks</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-white font-bold">1-Click Checkout</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Details auto-fill instantly</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-white font-bold">Secret Promos</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Special festival discounts</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 font-bold text-xs flex items-center justify-center space-x-2 transition-colors border border-slate-700 mt-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Account</span>
                </button>
              </div>
            )}

            {/* Tab 2: Past Orders */}
            {loggedInTab === "orders" && (
              <div className="space-y-3 animate-fade-in">
                {loadingOrders ? (
                  <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span>Fetching your delicious history...</span>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs space-y-2">
                    <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                    <p>No past orders recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-mono font-bold text-[10px]">
                              #{order.tokenNo}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                              {order.orderNumber}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === "COMPLETED" || order.status === "READY_FOR_PICKUP"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                              }`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {order.items && order.items.length > 0 ? (
                            <p className="truncate">
                              {order.items.map((i: any) => `${i.quantity}x ${i.itemTitle}`).join(", ")}
                            </p>
                          ) : (
                            <p className="text-slate-500">Mumbai Pav Co. Combo</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <span className="text-white font-bold text-xs">₹{order.totalAmount}</span>
                          <button
                            type="button"
                            onClick={() => handleReorderClick(order)}
                            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>1-Click Reorder</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Edit Profile & Address Form */}
            {loggedInTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-3 animate-fade-in text-xs">
                {editProfileSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{editProfileSuccess}</span>
                  </div>
                )}
                {formError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mobile Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="8469428342"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Default Delivery Address
                  </label>
                  <textarea
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Flat / Building, Street, Area"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PIN Code (Bengaluru)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="560034"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={editProfileSaving}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editProfileSaving ? "Saving Changes..." : "Save Profile Details"}</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* =================================================================== */
          /* GUEST / AUTHENTICATION INTERFACE */
          /* =================================================================== */
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="text-center">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-2">
                {authMode === "FORGOT_PASSWORD" || authMode === "RESET_PASSWORD" ? (
                  <KeyRound className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white">
                {authMode === "REGISTER" && "Create Customer Account"}
                {authMode === "SIGN_IN" && "Sign In to Mumbai Pav Co."}
                {authMode === "FORGOT_PASSWORD" && "Forgot Your Password?"}
                {authMode === "RESET_PASSWORD" && "Reset Your Password"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {authMode === "REGISTER" && "Get 50 bonus loyalty points upon sign-up!"}
                {authMode === "SIGN_IN" && "Access 1-click reorder & member rewards"}
                {authMode === "FORGOT_PASSWORD" && "Enter your email to receive a 6-digit verification code."}
                {authMode === "RESET_PASSWORD" && "Enter the verification code and your new password."}
              </p>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {resetFeedbackMsg && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex items-center space-x-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{resetFeedbackMsg}</span>
              </div>
            )}

            {/* MODE 1 & 2: SIGN IN / REGISTER FORM */}
            {(authMode === "SIGN_IN" || authMode === "REGISTER") && (
              <form onSubmit={handleSubmitAuth} className="space-y-3" noValidate>
                {authMode === "REGISTER" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onBlur={() => {
                          markTouched("name");
                          setErrors((prev) => ({ ...prev, name: validateName(name) }));
                        }}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (touched.name) {
                            setErrors((prev) => ({ ...prev, name: validateName(e.target.value) }));
                          }
                        }}
                        placeholder="e.g. Rahul Sharma"
                        aria-invalid={!!(touched.name && errors.name)}
                        className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-colors ${touched.name && errors.name
                          ? "border-red-500 focus:border-red-500"
                          : touched.name && !errors.name
                            ? "border-emerald-500/80 focus:border-emerald-500"
                            : "border-slate-700 focus:border-orange-500"
                          }`}
                      />
                    </div>
                    {touched.name && errors.name && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Email Address *
                    </label>
                    {checkingEmail && (
                      <span className="text-[10px] text-amber-400 animate-pulse">Checking availability...</span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onBlur={handleEmailBlur}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) {
                          setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                        }
                      }}
                      placeholder="name@example.com"
                      aria-invalid={!!(touched.email && errors.email)}
                      className={`w-full bg-slate-950 border rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-colors ${touched.email && errors.email
                        ? "border-red-500 focus:border-red-500"
                        : touched.email && !errors.email
                          ? "border-emerald-500/80 focus:border-emerald-500"
                          : "border-slate-700 focus:border-orange-500"
                        }`}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Mobile Number (Registration Mode) */}
                {authMode === "REGISTER" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Mobile Number <span className="text-slate-500 font-normal">(10 digits for delivery alerts)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-400 text-xs font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onBlur={() => {
                          markTouched("phone");
                          setErrors((prev) => ({ ...prev, phone: validatePhone(phone, false) }));
                        }}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setPhone(digits);
                          if (touched.phone) {
                            setErrors((prev) => ({ ...prev, phone: validatePhone(digits, false) }));
                          }
                        }}
                        placeholder="8469428342"
                        aria-invalid={!!(touched.phone && errors.phone)}
                        className={`w-full bg-slate-950 border rounded-xl pl-16 pr-3 py-2 text-xs text-white font-mono focus:outline-none transition-colors ${touched.phone && errors.phone
                          ? "border-red-500 focus:border-red-500"
                          : touched.phone && !errors.phone && phone.length === 10
                            ? "border-emerald-500/80 focus:border-emerald-500"
                            : "border-slate-700 focus:border-orange-500"
                          }`}
                      />
                    </div>
                    {touched.phone && errors.phone && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Password *
                    </label>
                    {authMode === "SIGN_IN" && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClickTick();
                          setResetEmail(email);
                          setAuthMode("FORGOT_PASSWORD");
                          setFormError(null);
                        }}
                        className="text-[11px] text-orange-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onBlur={() => {
                        markTouched("password");
                        if (authMode === "REGISTER") {
                          setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
                        }
                      }}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authMode === "REGISTER" && touched.password) {
                          setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                        }
                        if (authMode === "REGISTER" && touched.confirmPassword) {
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: validateConfirmPassword(e.target.value, confirmPassword),
                          }));
                        }
                      }}
                      placeholder={authMode === "REGISTER" ? "Min 8 chars, 1 upper, 1 special" : "Enter your password"}
                      aria-invalid={!!(touched.password && errors.password)}
                      className={`w-full bg-slate-950 border rounded-xl pl-9 pr-10 py-2 text-xs text-white focus:outline-none transition-colors ${touched.password && errors.password
                        ? "border-red-500 focus:border-red-500"
                        : touched.password && !errors.password && password.length >= 8
                          ? "border-emerald-500/80 focus:border-emerald-500"
                          : "border-slate-700 focus:border-orange-500"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator (Registration Mode - Guides user until Strong) */}
                  {authMode === "REGISTER" && password.length > 0 && regPasswordStrength.score < 4 && (
                    <div className="mt-2 space-y-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Password Strength:</span>
                        <span
                          className={`font-bold ${regPasswordStrength.score >= 3
                            ? "text-emerald-400"
                            : regPasswordStrength.score === 2
                              ? "text-amber-400"
                              : "text-red-400"
                            }`}
                        >
                          {regPasswordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${regPasswordStrength.colorClass}`}
                          style={{ width: `${(regPasswordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                        <div className={`flex items-center space-x-1 ${regPasswordStrength.hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                          <span>{regPasswordStrength.hasMinLength ? "✓" : "○"}</span>
                          <span>8+ Characters</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${regPasswordStrength.hasUppercase && regPasswordStrength.hasLowercase ? "text-emerald-400" : "text-slate-500"}`}>
                          <span>{regPasswordStrength.hasUppercase && regPasswordStrength.hasLowercase ? "✓" : "○"}</span>
                          <span>Upper & Lowercase</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${regPasswordStrength.hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                          <span>{regPasswordStrength.hasNumber ? "✓" : "○"}</span>
                          <span>At least 1 Number</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${regPasswordStrength.hasSpecial ? "text-emerald-400" : "text-slate-500"}`}>
                          <span>{regPasswordStrength.hasSpecial ? "✓" : "○"}</span>
                          <span>Special Character</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {touched.password && errors.password && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password (Registration Mode) */}
                {authMode === "REGISTER" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onBlur={() => {
                          markTouched("confirmPassword");
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: validateConfirmPassword(password, confirmPassword),
                          }));
                        }}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (touched.confirmPassword) {
                            setErrors((prev) => ({
                              ...prev,
                              confirmPassword: validateConfirmPassword(password, e.target.value),
                            }));
                          }
                        }}
                        placeholder="Re-enter password"
                        aria-invalid={!!(touched.confirmPassword && errors.confirmPassword)}
                        className={`w-full bg-slate-950 border rounded-xl pl-9 pr-10 py-2 text-xs text-white focus:outline-none transition-colors ${touched.confirmPassword && errors.confirmPassword
                          ? "border-red-500 focus:border-red-500"
                          : touched.confirmPassword && !errors.confirmPassword && confirmPassword.length >= 8
                            ? "border-emerald-500/80 focus:border-emerald-500"
                            : "border-slate-700 focus:border-orange-500"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Optional Date of Birth (Registration Mode) */}
                {authMode === "REGISTER" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Date of Birth <span className="text-slate-500 font-normal">(Optional, for Birthday Rewards)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={dob}
                        max={new Date().toISOString().split("T")[0]}
                        onBlur={() => {
                          markTouched("dob");
                          if (dob) setErrors((prev) => ({ ...prev, dob: validateDob(dob, 13) }));
                        }}
                        onChange={(e) => {
                          setDob(e.target.value);
                          if (touched.dob && e.target.value) {
                            setErrors((prev) => ({ ...prev, dob: validateDob(e.target.value, 13) }));
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    {touched.dob && errors.dob && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.dob}</span>
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 mt-1"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>
                    {loading
                      ? "Authenticating..."
                      : authMode === "REGISTER"
                        ? "Register & Claim 50 Pts"
                        : "Sign In with Email"}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {/* MODE 3: FORGOT PASSWORD FORM */}
            {authMode === "FORGOT_PASSWORD" && (
              <form onSubmit={handleRequestResetCode} className="space-y-3" noValidate>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={resetEmail}
                      onBlur={() => {
                        markTouched("resetEmail");
                        setErrors((prev) => ({ ...prev, resetEmail: validateEmail(resetEmail) }));
                      }}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (touched.resetEmail) {
                          setErrors((prev) => ({ ...prev, resetEmail: validateEmail(e.target.value) }));
                        }
                      }}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  {touched.resetEmail && errors.resetEmail && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.resetEmail}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClickTick();
                      setAuthMode("SIGN_IN");
                      setFormError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* MODE 4: RESET PASSWORD FORM */}
            {authMode === "RESET_PASSWORD" && (
              <form onSubmit={handlePerformPasswordReset} className="space-y-3" noValidate>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    6-Digit Verification Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest text-center focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 upper, 1 special"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {newPassword.length > 0 && resetPasswordStrength.score < 4 && (
                    <div className="mt-2 space-y-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Strength:</span>
                        <span className="font-bold text-emerald-400">{resetPasswordStrength.label}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${resetPasswordStrength.colorClass}`}
                          style={{ width: `${(resetPasswordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{loading ? "Resetting Password..." : "Update Password & Sign In"}</span>
                </button>
              </form>
            )}

            {/* Switch between Sign In and Register */}
            {(authMode === "SIGN_IN" || authMode === "REGISTER") && (
              <div className="text-center pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClickTick();
                    setAuthMode(authMode === "REGISTER" ? "SIGN_IN" : "REGISTER");
                    setFormError(null);
                    setErrors({});
                  }}
                  className="text-xs text-orange-400 hover:underline font-semibold"
                >
                  {authMode === "REGISTER"
                    ? "Already have an account? Sign In"
                    : "New customer? Create an account"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
