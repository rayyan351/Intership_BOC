"use client";

import Image from "next/image";
import { addToCart } from "@/redux/cart/cartSlice";
import { useDispatch } from "react-redux";
import { formatPrice } from "@/lib/currency";
import styles from "./ProductCard.module.css";

export function ProductCard({ product, compact = false }) {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(product));
  };
  return (
    <article className={`${styles.card} ${compact ? styles.compact : ""}`}>
      <div className={styles.imageWrap}>
        {product.discountLabel && <span className={styles.discount}>{product.discountLabel}</span>}
        <Image alt={product.name} fill sizes="(max-width: 640px) 85vw, (max-width: 1100px) 45vw, 300px" src={product.image} />
      </div>
      <div className={styles.content}>
        <div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>
        <div className={styles.priceRow}>
          <strong>{formatPrice(product.price)}</strong>
          {product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}
        </div>
        <button disabled={!product.available} onClick= {handleAddToCart} type="button">
          {product.available ? "Add to cart" : "Unavailable"}
        </button>
      </div>
    </article>
  );
}
