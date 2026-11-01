"use client";

import React, { useState } from "react";
import { MenuItemData, ModifierItem } from "@/lib/types";
import { sound } from "@/lib/sound";
import { X, Flame, Plus, Minus, Check } from "lucide-react";

interface MenuCustomizerModalProps {
  item: MenuItemData | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItemData, quantity: number, spiceLevel: "MILD" | "MEDIUM" | "THECHA_HOT", selectedModifiers: ModifierItem[]) => void;
}

export default function MenuCustomizerModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: MenuCustomizerModalProps) {
  if (!isOpen || !item) return null;

  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState<"MILD" | "MEDIUM" | "THECHA_HOT">(item.spiceLevel || "MEDIUM");
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierItem[]>([]);

  const toggleModifier = (mod: ModifierItem) => {
    sound.playClickTick();
    const exists = selectedModifiers.some((m) => m.name === mod.name);
    if (exists) {
      setSelectedModifiers(selectedModifiers.filter((m) => m.name !== mod.name));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  const modifiersCost = selectedModifiers.reduce((acc, m) => acc + (m.extraPrice || 0), 0);
  const unitTotal = item.price + modifiersCost;
  const grandTotal = unitTotal * quantity;

  const handleConfirm = () => {
    sound.playClickTick();
    onAddToCart(item, quantity, spiceLevel, selectedModifiers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh]">
        {/* Header with Item Image & Title */}
        <div className="relative h-44 sm:h-52 bg-slate-800 overflow-hidden flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center space-x-2 mb-1">
              {item.isVeg && (
                <span className="w-4 h-4 rounded border border-emerald-500 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>
              )}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                ~{item.prepTimeMin} min fry time
              </span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">{item.title}</h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">{item.description}</p>
          </div>
        </div>

        {/* Customization Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. Spice Level Customization */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Choose Mumbai Spice Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "MILD", label: "Mild / Meetha", sub: "Mithi tamarind", icon: "🟢" },
                { id: "MEDIUM", label: "Mumbai Classic", sub: "Garlic & Green", icon: "🟠" },
                { id: "THECHA_HOT", label: "Thecha Hot 🔥", sub: "Kolhapur Mirchi", icon: "🌶️" },
              ].map((spice) => {
                const isSelected = spiceLevel === spice.id;
                return (
                  <button
                    key={spice.id}
                    type="button"
                    onClick={() => {
                      sound.playClickTick();
                      setSpiceLevel(spice.id as any);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-orange-500/15 border-orange-500 text-white"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="text-sm font-semibold flex items-center space-x-1">
                      <span>{spice.icon}</span>
                      <span className="truncate">{spice.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{spice.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Add-on Modifiers */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Street Add-ons & Extras
                </label>
                <span className="text-[11px] text-slate-500">Optional</span>
              </div>
              <div className="space-y-2">
                {item.modifiers.map((mod) => {
                  const isSelected = selectedModifiers.some((m) => m.name === mod.name);
                  return (
                    <div
                      key={mod.name}
                      onClick={() => toggleModifier(mod)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-orange-500/15 border-orange-500 text-white"
                          : "bg-slate-800/50 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            isSelected
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "border-slate-600 bg-slate-800"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm font-medium">{mod.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-orange-400">
                        +₹{mod.extraPrice}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Quantity Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quantity
              </span>
              <p className="text-[11px] text-slate-500">How many pavs fresh out the kadai?</p>
            </div>
            <div className="flex items-center space-x-3 bg-slate-800 border border-slate-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  sound.playClickTick();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 flex items-center justify-center text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm w-6 text-center text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => {
                  sound.playClickTick();
                  setQuantity((q) => q + 1);
                }}
                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white shadow"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Total & Add Button */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Total Price</div>
            <div className="text-xl font-black text-white">₹{grandTotal.toFixed(2)}</div>
          </div>
          <button
            onClick={handleConfirm}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
          >
            <span>Add to Kadai</span>
            <span>• ₹{grandTotal.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
