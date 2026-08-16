// src/app/(site)/_components/home/SeoContent.js
"use client";

import { useState } from "react";
import { seoContent } from "@/data/seoContent";
import { Icon } from "@/components/ui/Icons";

export function SeoContent() {
  const [expanded, setExpanded] = useState(false);
  const visibleSections = expanded ? seoContent : seoContent.slice(0, 3);

  return (
    <section className="px-5 py-14 md:py-16 bg-white" aria-labelledby="seo-heading">
      <div className="w-[min(1080px,100%)] mx-auto p-6 md:p-9 rounded-[18px] bg-[#f6f7f9]">
        {visibleSections.map((section, index) => (
          <article
            key={section.heading}
            className={index > 0 ? "mt-7" : ""}
          >
            <h2
              id={index === 0 ? "seo-heading" : undefined}
              className="m-0 mb-2.5 text-[clamp(1.25rem,2vw,1.7rem)] font-bold text-neutral-900 tracking-tight"
            >
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, pIdx) => (
              <p
                key={pIdx}
                className={`m-0 text-[#272b34] text-sm md:text-base leading-[1.65] ${
                  pIdx > 0 ? "mt-3" : ""
                }`}
              >
                {paragraph}
              </p>
            ))}
          </article>
        ))}

        <button
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          type="button"
          className="inline-flex items-center gap-1.5 mt-6 bg-transparent text-sm font-bold text-[#485267] hover:text-black transition-colors"
        >
          <span>{expanded ? "Show less" : "Read more"}</span>
          <span className={`inline-block transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            <Icon name="chevronDown" size={17} />
          </span>
        </button>
      </div>
    </section>
  );
}