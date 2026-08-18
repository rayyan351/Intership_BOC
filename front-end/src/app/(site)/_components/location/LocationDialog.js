// src/app/(site)/_components/location/LocationDialog.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "@/context/LocationContext";
import { Icon } from "@/components/ui/Icons";
import { useGetBranchesQuery } from "@/services/branchApi";

export function LocationDialog() {
  const { isLocationOpen, setIsLocationOpen, selectedBranch, setSelectedBranch } = useLocation();

  const [activeCity, setActiveCity] = useState("Karachi");
  const [chosenBranchId, setChosenBranchId] = useState("");

  // Fetch active branches dynamically from database
  const { data: branches = [], isLoading } = useGetBranchesQuery({ all: "false" });

  // Filter available branches by currently selected city
  const cityBranches = useMemo(() => {
    return branches.filter((b) => b.city?.toLowerCase() === activeCity.toLowerCase());
  }, [branches, activeCity]);

  // Sync initial dialog state with currently selected branch
  useEffect(() => {
    if (selectedBranch?.city) {
      setActiveCity(selectedBranch.city);
    }
    if (selectedBranch?._id || selectedBranch?.id) {
      setChosenBranchId(selectedBranch._id || selectedBranch.id);
    }
  }, [selectedBranch, isLocationOpen]);

  // Auto-select first branch of a city if current selection does not belong to it
  useEffect(() => {
    if (cityBranches.length > 0) {
      const exists = cityBranches.some((b) => (b._id || b.id) === chosenBranchId);
      if (!exists) {
        setChosenBranchId(cityBranches[0]._id || cityBranches[0].id);
      }
    } else {
      setChosenBranchId("");
    }
  }, [activeCity, cityBranches, chosenBranchId]);

  if (!isLocationOpen) return null;

  const handleConfirm = () => {
    const selected = cityBranches.find((b) => (b._id || b.id) === chosenBranchId);
    if (selected) {
      setSelectedBranch(selected);
      localStorage.setItem("selectedBranch", JSON.stringify(selected));
    }
    setIsLocationOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsLocationOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[440px] bg-neutral-900 border border-neutral-800 text-white rounded-[24px] p-6 sm:p-7 shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#F4C61A] text-black grid place-items-center">
              <Icon name="location" size={17} strokeWidth={2.4} />
            </span>
            <h3 className="text-lg font-black tracking-tight text-white m-0 uppercase">
              Select Location
            </h3>
          </div>

          <button
            onClick={() => setIsLocationOpen(false)}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white grid place-items-center transition"
          >
            <Icon name="close" size={16} strokeWidth={2} />
          </button>
        </div>

        <p className="text-xs text-neutral-400 mt-4 mb-5">
          Choose your city and preferred delivery branch to view menus and exclusive deals near you.
        </p>

        {/* City Selector Icons / Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Karachi Button */}
          <button
            type="button"
            onClick={() => setActiveCity("Karachi")}
            className={`flex flex-col items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 transition-all ${
              activeCity === "Karachi"
                ? "border-[#F4C61A] bg-[#F4C61A]/10 text-[#F4C61A]"
                : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-xs font-black uppercase tracking-wider">Karachi</span>
          </button>

          {/* Lahore Button */}
          <button
            type="button"
            onClick={() => setActiveCity("Lahore")}
            className={`flex flex-col items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 transition-all ${
              activeCity === "Lahore"
                ? "border-[#F4C61A] bg-[#F4C61A]/10 text-[#F4C61A]"
                : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
              />
            </svg>
            <span className="text-xs font-black uppercase tracking-wider">Lahore</span>
          </button>
        </div>

        {/* Dynamic Outlet / Area Selector Dropdown */}
        <div className="space-y-1.5 mb-6">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
            Select Your Area / Outlet
          </label>
          
          {isLoading ? (
            <div className="py-3 px-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-500">
              Loading outlets...
            </div>
          ) : cityBranches.length === 0 ? (
            <div className="py-3 px-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-500">
              No active outlets currently found for {activeCity}.
            </div>
          ) : (
            <select
              value={chosenBranchId}
              onChange={(e) => setChosenBranchId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm font-semibold focus:outline-none focus:border-[#F4C61A] cursor-pointer"
            >
              {cityBranches.map((branch) => (
                <option key={branch._id || branch.id} value={branch._id || branch.id} className="bg-neutral-900 text-white">
                  {branch.name} {branch.deliveryFee ? `(Delivery: Rs. ${branch.deliveryFee})` : '(Free Delivery)'}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Submit Action */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!chosenBranchId || cityBranches.length === 0}
          className="w-full h-12 rounded-xl bg-[#F4C61A] hover:bg-[#e5b713] text-black font-extrabold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}