// src/app/(site)/_components/home/MenuEmptyState.jsx
"use client";

export function MenuEmptyState({ query, onReset }) {
  return (
    <section className="w-[min(1120px,calc(100%-40px))] mx-auto my-12 p-12 text-center rounded-[18px] bg-neutral-100 border border-neutral-200/80">
      <h2 className="text-xl font-bold text-neutral-800">
        No items matched {query ? `“${query}”` : "the selected criteria"}
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Try checking for spelling errors or searching for a different dish.
      </p>
      {query && (
        <button
          onClick={onReset}
          type="button"
          className="mt-5 px-6 py-2.5 rounded-full bg-[#F4C61A] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#E0B210] transition-colors"
        >
          Clear search
        </button>
      )}
    </section>
  );
}