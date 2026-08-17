// src/app/(site)/_components/home/MenuSearchHeader.jsx
"use client";

import { Icon } from "@/components/ui/Icons";

export function MenuSearchHeader({ query, onChange, onClear }) {
  return (
    <section className="px-5 pt-11 pb-6" aria-label="Search the menu">
      <label className="relative flex items-center gap-3.5 w-[min(100%,500px)] min-h-[54px] mx-auto px-4 py-1 border-2 border-[#F4C61A] rounded-full bg-white shadow-xs focus-within:shadow-md transition-shadow">
        <Icon name="search" size={20} className="text-neutral-500 shrink-0" />
        <span className="sr-only">Search menu products</span>
        <input
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search burgers, combos and deals"
          type="search"
          value={query}
          className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm md:text-base text-neutral-900 placeholder:text-neutral-400"
        />
        {query && (
          <button
            aria-label="Clear query"
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-700 px-1"
          >
            ✕
          </button>
        )}
        <button
          aria-label="Submit menu search"
          type="button"
          className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-[#F4C61A] text-black hover:bg-[#E0B210] transition-colors"
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </label>
    </section>
  );
}