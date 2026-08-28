// src/app/(site)/_components/home/ProductDetailModal.jsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cart/cartSlice";
import { Icon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/currency";
import { ModalActionButtons } from "@/components/ui/ModalActionsButton";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { getImageUrl } from "@/config/site";

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
  const productImg = getImageUrl(product.image || "");

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        _id: product._id || product.id,
        name: product.name,
        price: product.price,
        image: productImg,
        quantity,
        isDeal: false,
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
        // Dismissed
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-[980px] h-auto md:h-[500px] max-h-[90vh] overflow-hidden rounded-[26px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Column: Visual Artwork */}
        <div className="relative w-full md:w-[50%] lg:w-[52%] min-h-[260px] md:min-h-full bg-neutral-900 flex flex-col justify-end overflow-hidden shrink-0">
          {productImg ? (
            <Image
              src={productImg}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 52vw"
              className="object-cover object-center"
              priority
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-bold text-neutral-500">
              No Image Available
            </div>
          )}

          {/* Bottom Title Bar */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Right Column: Details & Order Controls */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden bg-white min-w-0">
          
          {/* Header Bar: Price, Description & Action Buttons */}
          <div className="p-6 sm:p-7 pb-5 border-b border-neutral-100/80">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                  {formatPrice(product.price)}
                </span>
                
                {product.description && (
                  <p className="mt-3 text-sm font-medium text-neutral-600 leading-relaxed max-w-[400px]">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Reusable Yellow Modal Buttons */}
              <ModalActionButtons onClose={onClose} onShare={handleShare} />
            </div>
          </div>

          {/* Middle Body: Special Instructions */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Extra sauce, no onions, well done"
                className="w-full p-3.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#F4C61A] outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Bottom Bar: Quantity & Add to Cart */}
          <div className="flex items-center gap-3.5 p-5 sm:p-6 bg-white border-t border-neutral-100">
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity((prev) => prev + 1)}
              onDecrease={() => {
                if (quantity > 1) {
                  setQuantity((prev) => prev - 1);
                } else {
                  onClose();
                }
              }}
              showTrashOnMin={true}
            />

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-[#F4C61A] text-neutral-950 font-black text-sm hover:bg-[#E0B210] active:scale-[0.99] transition-all duration-150 shadow-[0_2px_10px_rgba(244,198,26,0.3)] cursor-pointer"
            >
              <span>{formatPrice(totalPrice)}</span>
              <span className="opacity-40">|</span>
              <span>Add to Cart</span>
              <Icon name="chevronRight" size={14} strokeWidth={3} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}