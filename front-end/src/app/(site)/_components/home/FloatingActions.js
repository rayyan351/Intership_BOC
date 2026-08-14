"use client";

import { Icon } from "@/components/ui/Icons";
import styles from "./FloatingActions.module.css";

export function FloatingActions() {
  return (
    <>
      <button aria-label="Search menu" className={`${styles.action} ${styles.search}`} onClick={() => document.querySelector('input[type="search"]')?.focus()} type="button"><Icon name="search" /></button>
      <button aria-label="Back to top" className={`${styles.action} ${styles.top}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} type="button"><Icon name="arrowUp" /></button>
    </>
  );
}
