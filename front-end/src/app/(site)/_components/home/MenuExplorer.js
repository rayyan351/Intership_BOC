"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { menuCategories } from "@/data/menuCategories";
import { menuProducts } from "@/data/menuProducts";
import { ProductCard } from "@/app/(site)/_components/home/ProductCard";
import styles from "./MenuExplorer.module.css";

export function MenuExplorer() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const grouped = useMemo(() => {
    return menuCategories.map((category) => {
      const categoryProducts = menuProducts.filter((product) => {
        if (Array.isArray(product.categories)) {
        return product.categories.includes(category.id);
      }
      if (category.id === "popular-items") return product.popular;
      return product.categoryId === category.id;
    });

      const visibleProducts = normalizedQuery
        ? categoryProducts.filter((product) =>
            `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery),
          )
        : categoryProducts;

      return { ...category, products: visibleProducts, totalProducts: categoryProducts.length };
    });
  }, [normalizedQuery]);

  const populatedCategories = grouped.filter((category) => category.products.length > 0);

  return (
    <main id="menu">
      <section className={styles.searchSection} aria-label="Search the menu">
        <label className={styles.searchBox}>
          <Icon name="search" size={20} />
          <span className="sr-only">Search menu products</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search burgers, combos and sides"
            type="search"
            value={query}
          />
          <button aria-label="Submit menu search" type="button">
            <Icon name="chevronRight" size={20} />
          </button>
        </label>
      </section>

      {populatedCategories.length === 0 && (
        <section className={styles.noResults}>
          <h2>No menu items matched “{query}”</h2>
          <button onClick={() => setQuery("")} type="button">Clear search</button>
        </section>
      )}

      {populatedCategories.map((category, categoryIndex) => (
        <section className={styles.menuSection} id={category.id} key={`${category.id}-${categoryIndex}`}>
          {category.hasBanner && (
            <div className={styles.categoryBanner}>
              <Image alt={`${category.label} category banner placeholder`} fill sizes="(max-width: 1440px) 100vw, 1280px" src={category.banner} />
            </div>
          )}

          <header className={styles.sectionHeader}>
            <div>
              {category.id === "popular-items" && <span className={styles.flame}>●</span>}
              <h2>{category.label}</h2>
              <p>{category.id === "popular-items" ? "Most ordered right now" : `${category.totalProducts} verified items currently loaded`}</p>
            </div>
            <a href="#menu">Back to menu ↑</a>
          </header>

          <div className={`${styles.grid} ${categoryIndex === 0 ? styles.popularGrid : ""}`}>
            {category.products.map((product) => (
              <ProductCard compact={categoryIndex === 0} key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}

      {!normalizedQuery && (
        <section className={styles.catalogNotice}>
          <p><strong>Catalog integration ready.</strong> Categories without verified screenshot data are retained in the category rail and admin panel, but remain hidden here until official products are imported.</p>
        </section>
      )}
    </main>
  );
}
