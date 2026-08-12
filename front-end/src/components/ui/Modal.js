"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icons";
import styles from "./Modal.module.css";

export function Modal({ open, title, onClose, children, labelledBy = "modal-title" }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={styles.panel}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id={labelledBy}>{title}</h2>
          <button aria-label="Close dialog" className={styles.closeButton} onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  );
}
