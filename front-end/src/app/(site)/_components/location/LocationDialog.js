// src/app/(site)/_components/home/LocationDialog.js
"use client";

import { useMemo, useState } from "react";
import { branches } from "@/data/branches";
import { useLocation } from "@/context/LocationContext";
import { Modal } from "@/components/ui/Modal";

export function LocationDialog() {
  const { selectedBranch, selectBranch, isLocationOpen, setIsLocationOpen } = useLocation();
  const [city, setCity] = useState("Karachi");
  const visibleBranches = useMemo(() => branches.filter((branch) => branch.city === city), [city]);

  return (
    <Modal
      open={isLocationOpen}
      title="Choose your delivery branch"
      onClose={() => setIsLocationOpen(false)}
    >
      {/* City Toggle Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-full bg-neutral-100 mb-5">
        {["Karachi", "Lahore"].map((item) => {
          const isActive = city === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCity(item)}
              className={`min-h-[42px] rounded-full text-sm font-extrabold transition-all duration-200 ${
                isActive
                  ? "bg-[#F4C61A] text-black shadow-xs"
                  : "bg-transparent text-neutral-600 hover:text-black"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Branch Selection List */}
      <div className="grid gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
        {visibleBranches.map((branch) => {
          const isSelected = selectedBranch?.id === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => {
                selectBranch(branch.id);
                setIsLocationOpen(false);
              }}
              className={`grid gap-1 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-[#E0B210] bg-amber-50/40 ring-2 ring-[#F4C61A]/30"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
              }`}
            >
              <strong className="text-sm font-bold text-neutral-900 leading-snug">
                {branch.name}
              </strong>
              <span className="text-xs text-neutral-500 leading-relaxed">
                {branch.address}
              </span>
              <small className="text-[11px] font-bold text-neutral-700 mt-0.5">
                {branch.phone}
              </small>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}