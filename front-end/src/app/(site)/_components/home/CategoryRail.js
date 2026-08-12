"use client";

import { useEffect, useRef, useState } from "react";
import { menuCategories } from "@/data/menuCategories";
import { Icon } from "@/components/ui/Icons";
import styles from "./CategoryRail.module.css";

export function CategoryRail() {
  const [activeId, setActiveId] = useState(menuCategories[0].id);
  const railRef = useRef(null);

  useEffect(() => {
    const sections = menuCategories
      .map((category) => document.getElementById(category.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-25% 0px -60%", threshold: [0.08, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollRail = (direction) => {
    railRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  };

  return (
    <div className={styles.stickyShell}>
      <div className={styles.wrapper}>
        <button aria-label="Scroll categories left" className={styles.railArrow} onClick={() => scrollRail(-1)} type="button">
          <Icon name="chevronLeft" size={18} />
        </button>
        <nav aria-label="Menu categories" className={styles.rail} ref={railRef}>
          {menuCategories.map((category) => (
            <a
              aria-current={activeId === category.id ? "true" : undefined}
              className={activeId === category.id ? styles.active : ""}
              href={`#${category.id}`}
              key={category.id}
              onClick={() => setActiveId(category.id)}
            >
              {category.label}
            </a>
          ))}
        </nav>
        <button aria-label="Scroll categories right" className={styles.railArrow} onClick={() => scrollRail(1)} type="button">
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </div>
  );
}
