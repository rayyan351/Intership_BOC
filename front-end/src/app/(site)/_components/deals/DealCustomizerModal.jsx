// src/app/(site)/_components/home/DealCustomizerModal.jsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cart/cartSlice";
import { Icon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/currency";
import { ModalActionButtons } from "@/components/ui/ModalActionsButton";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { ChoiceOptionCard } from "../home/ChoiceOptionCard";
import { isItemCurrentlyAvailable } from "@/utils/availability";
import { getImageUrl } from "@/config/site";

export function DealCustomizerModal({ deal, open, onClose }) {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [selectedChoices, setSelectedChoices] = useState({});

  const availability = isItemCurrentlyAvailable(deal);

  const getGroupKey = (group, index) =>
    group._id?.toString() || group.id?.toString() || `${group.title}_${index}`;

  useEffect(() => {
    if (open && deal) {
      setQuantity(1);
      setInstructions("");

      const initial = {};
      (deal.choiceGroups || []).forEach((group, idx) => {
        initial[getGroupKey(group, idx)] = [];
      });
      setSelectedChoices(initial);

      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, deal]);

  if (!open || !deal) return null;

  const dealTitle = deal.title || deal.name || "Special Deal";
  const dealPrice = deal.dealPrice || deal.price || 0;
  const originalPrice = deal.originalPrice || 0;
  const dealImg = getImageUrl(deal.image || deal.banner || deal.imageUrl || deal.dealImage || "");

  const extraOptionsPrice = Object.values(selectedChoices)
    .flat()
    .reduce((sum, opt) => sum + (Number(opt?.extraPrice) || 0), 0);

  const singleUnitDealPrice = dealPrice + extraOptionsPrice;
  const grandTotalPrice = singleUnitDealPrice * quantity;

  const isFormValid =
    availability.available &&
    (deal.choiceGroups || []).every((group, idx) => {
      if (!group.required) return true;
      const key = getGroupKey(group, idx);
      const currentPicks = selectedChoices[key] || [];
      return currentPicks.length === (group.selectCount || 1);
    });

  const handleSelectSingleOption = (groupKey, option) => {
    setSelectedChoices((prev) => ({
      ...prev,
      [groupKey]: [option],
    }));
  };

  const handleIncrementMultiOption = (groupKey, group, option) => {
    const current = selectedChoices[groupKey] || [];
    if (current.length < group.selectCount) {
      setSelectedChoices((prev) => ({
        ...prev,
        [groupKey]: [...current, option],
      }));
    }
  };

  const handleDecrementMultiOption = (groupKey, option) => {
    const current = selectedChoices[groupKey] || [];
    const indexToRemove = current.findIndex((o) => o.name === option.name);

    if (indexToRemove > -1) {
      setSelectedChoices((prev) => {
        const nextList = [...current];
        nextList.splice(indexToRemove, 1);
        return {
          ...prev,
          [groupKey]: nextList,
        };
      });
    }
  };

  const handleAddToCart = () => {
    if (!isFormValid) return;

    dispatch(
      addToCart({
        _id: deal._id || deal.id,
        name: dealTitle,
        price: singleUnitDealPrice,
        image: dealImg,
        quantity,
        isDeal: true,
        selectedChoices,
        specialInstructions: instructions.trim(),
      })
    );
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dealTitle,
          text: deal.description,
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
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-[980px] h-[90vh] md:h-[540px] overflow-hidden rounded-[26px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* LEFT COLUMN: Clean Full-Bleed Artwork */}
        <div className="relative w-full md:w-[48%] lg:w-[50%] min-h-[220px] md:min-h-full bg-neutral-900 flex flex-col justify-end overflow-hidden shrink-0">
          {dealImg ? (
            <Image
              src={dealImg}
              alt={dealTitle}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
              priority
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-bold text-neutral-500">
              No Image Available
            </div>
          )}

          {/* Bottom Title Bar Overlay */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
              {dealTitle}
            </h2>
          </div>
        </div>

        {/* RIGHT COLUMN: Options & Actions */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden bg-white min-w-0">
          
          {/* Header Bar */}
          <div className="p-6 sm:p-7 pb-4 border-b border-neutral-100/80">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                    {formatPrice(singleUnitDealPrice)}
                  </span>
                  {originalPrice > dealPrice && (
                    <del className="text-sm font-semibold text-neutral-400">
                      {formatPrice(originalPrice)}
                    </del>
                  )}
                </div>

                {deal.description && (
                  <p className="mt-2.5 text-sm font-medium text-neutral-600 leading-relaxed max-w-[400px]">
                    {deal.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <ModalActionButtons onClose={onClose} onShare={handleShare} />
            </div>

            {/* Time Window Restriction Notice */}
            {!availability.available && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                <Icon name="clock" size={16} className="shrink-0 text-amber-700" />
                <span>{availability.reason}</span>
              </div>
            )}
          </div>

          {/* Scrollable Choices Area */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
            
            {/* Fixed Inclusions */}
            {deal.fixedItems && deal.fixedItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                  Meal Includes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {deal.fixedItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 shadow-xs"
                    >
                      {item.quantity}x {item.product?.name || "Item"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Choice Groups */}
            {(deal.choiceGroups || []).map((group, gIdx) => {
              const groupKey = getGroupKey(group, gIdx);
              const currentPicks = selectedChoices[groupKey] || [];
              const isSingle = group.selectCount === 1;
              const maxReached = currentPicks.length >= (group.selectCount || 1);

              return (
                <div key={groupKey} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-neutral-900">
                      {group.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                        Required
                      </span>
                      {!isSingle && (
                        <span className="text-[11px] font-bold text-neutral-950 bg-[#F4C61A] px-2.5 py-0.5 rounded-full">
                          Select {group.selectCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {group.options.map((opt, optIdx) => {
                      const optionCount = currentPicks.filter((o) => o.name === opt.name).length;
                      const isSelected = optionCount > 0;

                      return (
                        <ChoiceOptionCard
                          key={optIdx}
                          option={opt}
                          isSingle={isSingle}
                          isSelected={isSelected}
                          count={optionCount}
                          maxReached={maxReached}
                          onSelect={() => handleSelectSingleOption(groupKey, opt)}
                          onIncrement={() => handleIncrementMultiOption(groupKey, group, opt)}
                          onDecrement={() => handleDecrementMultiOption(groupKey, opt)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Special Instructions */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-neutral-800 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={500}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Extra spicy, sauce on the side"
                className="w-full p-3.5 rounded-xl border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#F4C61A] outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Bottom Actions Bar */}
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
              disabled={!isFormValid}
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-[#F4C61A] text-neutral-950 font-black text-sm hover:bg-[#E0B210] active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(244,198,26,0.3)] cursor-pointer"
            >
              <span>{formatPrice(grandTotalPrice)}</span>
              <span className="opacity-40">|</span>
              <span>
                {!availability.available
                  ? "Currently Unavailable"
                  : isFormValid
                  ? "Add to Cart"
                  : "Choose Options"}
              </span>
              <Icon name="chevronRight" size={14} strokeWidth={3} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}