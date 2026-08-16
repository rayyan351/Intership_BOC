// src/app/(site)/_components/home/ProductDetailModal.jsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cart/cartSlice";
import { Icon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/currency";

export function ProductDetailModal({ product, open, onClose }) {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setInstructions("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !product) return null;

  const totalPrice = (product.price || 0) * quantity;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        ...product,
        quantity,
        specialInstructions: instructions.trim(),
      })
    );
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        // User dismissed share dialog
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Side: Product Visual with Gradient Title */}
        <div className="relative w-full md:w-1/2 min-h-[260px] sm:min-h-[340px] md:min-h-[460px] bg-gradient-to-b from-neutral-100 to-neutral-200 flex items-center justify-center p-6 overflow-hidden">
          <Image
            src={product.image || "/placeholder.png"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6"
            priority
          />
          
          {/* Bottom Dark Gradient with Product Title */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Right Side: Details & Actions */}
        <div className="flex flex-col justify-between w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto">
          
          {/* Top Row: Price and Action Buttons */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl sm:text-3xl font-black text-neutral-900">
                {formatPrice(product.price)}
              </h3>
              
              {/* Share & Close Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  type="button"
                  aria-label="Share item"
                  className="grid place-items-center w-9 h-9 rounded-full bg-[#F4C61A] text-black shadow-sm hover:scale-105 transition-transform"
                >
                  <Icon name="externalLink" size={16} strokeWidth={2.2} />
                </button>
                <button
                  onClick={onClose}
                  type="button"
                  aria-label="Close modal"
                  className="grid place-items-center w-9 h-9 rounded-full bg-[#F4C61A] text-black shadow-sm hover:scale-105 transition-transform"
                >
                  <Icon name="close" size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="mt-4 text-xs sm:text-sm text-neutral-500 leading-relaxed">
              {product.description}
            </p>

            {/* Special Instructions Field */}
            <div className="mt-8">
              <label className="block text-sm font-bold text-neutral-800 mb-2">
                Special Instructions
              </label>
              <div className="relative border border-neutral-200 rounded-2xl p-3 focus-within:border-[#F4C61A] focus-within:ring-1 focus-within:ring-[#F4C61A] transition-all">
                <textarea
                  rows={3}
                  maxLength={500}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Please enter instructions about this item"
                  className="w-full resize-none bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
                />
                <span className="absolute bottom-2.5 right-3 text-[11px] font-medium text-neutral-400">
                  {instructions.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Quantity Selector & Add To Cart */}
          <div className="flex items-center gap-4 mt-8 pt-4 border-t border-neutral-100">
            {/* Quantity Controls Box */}
            <div className="flex items-center border border-amber-200 rounded-xl p-1 bg-amber-50/40">
              <button
                type="button"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="grid place-items-center w-9 h-9 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
              >
                {quantity === 1 ? (
                  <Icon name="trash" size={16} />
                ) : (
                  <Icon name="minus" size={16} />
                )}
              </button>

              <span className="w-9 text-center text-sm font-black text-neutral-900">
                {quantity}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="grid place-items-center w-9 h-9 rounded-lg bg-[#F4C61A] text-black hover:bg-[#E0B210] transition-colors"
              >
                <Icon name="plus" size={16} />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-between min-h-[48px] px-6 rounded-xl bg-[#F4C61A] text-black font-extrabold text-sm hover:bg-[#E0B210] shadow-sm transition-all"
            >
              <span>{formatPrice(totalPrice)}</span>
              <div className="flex items-center gap-1.5">
                <span>Add to Cart</span>
                <Icon name="chevronRight" size={16} strokeWidth={2.4} />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}