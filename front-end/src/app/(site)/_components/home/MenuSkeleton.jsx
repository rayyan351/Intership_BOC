// src/app/(site)/_components/home/MenuSkeleton.jsx
export function MenuSkeleton() {
  return (
    <div className="w-[calc(100%-24px)] md:w-[min(1120px,calc(100%-40px))] mx-auto pt-10 pb-8 animate-pulse">
      <div className="h-8 w-48 bg-neutral-200 rounded-lg mb-8" />
      <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-4 gap-[18px]">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col h-[340px] rounded-[18px] border border-neutral-200 bg-white p-4 space-y-4">
            <div className="aspect-[1.1/1] w-full rounded-xl bg-neutral-200" />
            <div className="h-4 w-3/4 bg-neutral-200 rounded" />
            <div className="h-3 w-full bg-neutral-100 rounded" />
            <div className="mt-auto flex justify-between items-center pt-2">
              <div className="h-5 w-16 bg-neutral-200 rounded" />
              <div className="h-9 w-24 bg-neutral-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}