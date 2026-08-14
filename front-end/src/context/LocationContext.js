"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { branches } from "@/data/branches";

const LocationContext = createContext(null);
const STORAGE_KEY = "boc-location";

export function LocationProvider({ children }) {
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0].id);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && branches.some((branch) => branch.id === saved)) {
      setSelectedBranchId(saved);
    }
  }, []);

  const selectBranch = (branchId) => {
    setSelectedBranchId(branchId);
    window.localStorage.setItem(STORAGE_KEY, branchId);
    setIsLocationOpen(false);
  };

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) || branches[0];

  const value = useMemo(
    () => ({ selectedBranch, selectBranch, isLocationOpen, setIsLocationOpen }),
    [selectedBranch, isLocationOpen],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used inside LocationProvider");
  return context;
}
