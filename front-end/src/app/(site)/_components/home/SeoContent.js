"use client";

import { useState } from "react";
import { seoContent } from "@/data/seoContent";
import { Icon } from "@/components/ui/Icons";
import styles from "./SeoContent.module.css";

export function SeoContent() {
  const [expanded, setExpanded] = useState(false);
  const visibleSections = expanded ? seoContent : seoContent.slice(0, 3);

  return (
    <section className={styles.section} aria-labelledby="seo-heading">
      <div className={styles.inner}>
        {visibleSections.map((section, index) => (
          <article key={section.heading}>
            <h2 id={index === 0 ? "seo-heading" : undefined}>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
        <button aria-expanded={expanded} onClick={() => setExpanded((current) => !current)} type="button">
          {expanded ? "Show less" : "Read more"}
          <Icon className={expanded ? styles.rotated : ""} name="chevronDown" size={17} />
        </button>
      </div>
    </section>
  );
}
