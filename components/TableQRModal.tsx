"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { sound } from "@/lib/sound";
import { X, QrCode, Utensils, Check, ExternalLink } from "lucide-react";

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable?: string | null;
  onSelectTable: (table: string) => void;
}

const TABLES = Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`);

export default function TableQRModal({
  isOpen,
  onClose,
  currentTable,
  onSelectTable,
}: TableQRModalProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const handlePick = (tbl: string) => {
    sound.playClickTick();
    onSelectTable(tbl);
    onClose();
    router.push(`/?table=${encodeURIComponent(tbl)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Dine-In Table QR Scanner</h3>
              <p className="text-[11px] text-slate-400">Simulate scanning a counter/table sticker QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tables Grid */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select Dining Table / Counter Bar
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TABLES.map((tbl) => {
              const isSelected = currentTable === tbl;
              return (
                <button
                  key={tbl}
                  onClick={() => handlePick(tbl)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-orange-500 border-orange-500 text-white font-black shadow-lg shadow-orange-500/25"
                      : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 mb-1 opacity-70" />
                  <span className="text-xs font-bold">{tbl.replace("Table ", "T-")}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Current Station:</span>
          <span className="font-bold text-orange-400">{currentTable || "No table selected"}</span>
        </div>
      </div>
    </div>
  );
}
