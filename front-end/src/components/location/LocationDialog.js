"use client";

import { useMemo, useState } from "react";
import { branches } from "@/data/branches";
import { useLocation } from "@/context/LocationContext";
import { Modal } from "@/components/ui/Modal";
import styles from "./LocationDialog.module.css";

export function LocationDialog() {
  const { selectedBranch, selectBranch, isLocationOpen, setIsLocationOpen } = useLocation();
  const [city, setCity] = useState("Karachi");
  const visibleBranches = useMemo(() => branches.filter((branch) => branch.city === city), [city]);

  return (
    <Modal open={isLocationOpen} title="Choose your delivery branch" onClose={() => setIsLocationOpen(false)}>
      <div className={styles.cityTabs}>
        {["Karachi", "Lahore"].map((item) => (
          <button className={city === item ? styles.active : ""} key={item} onClick={() => setCity(item)} type="button">{item}</button>
        ))}
      </div>
      <div className={styles.branchList}>
        {visibleBranches.map((branch) => (
          <button className={selectedBranch.id === branch.id ? styles.selected : ""} key={branch.id} onClick={() => selectBranch(branch.id)} type="button">
            <strong>{branch.name}</strong><span>{branch.address}</span><small>{branch.phone}</small>
          </button>
        ))}
      </div>
    </Modal>
  );
}
