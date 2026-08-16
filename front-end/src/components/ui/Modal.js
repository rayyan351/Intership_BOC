// src/components/ui/Modal.js
"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icons";

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
    <div
      className="fixed inset-0 z-[1000] grid place-items-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className="w-[min(100%,560px)] max-h-[min(760px,calc(100vh-48px))] overflow-y-auto rounded-3xl border border-neutral-200 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.28)]"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-neutral-200 bg-white">
          <h2 id={labelledBy} className="m-0 text-xl font-extrabold text-neutral-900">
            {title}
          </h2>
          <button
            aria-label="Close dialog"
            className="grid place-items-center w-10 h-10 rounded-full border border-neutral-200 bg-transparent text-neutral-700 hover:bg-neutral-100 transition-colors"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={18} strokeWidth={2} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}