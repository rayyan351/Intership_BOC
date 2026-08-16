// src/app/(site)/_components/home/DealCustomizerModal.jsx
"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cart/cartSlice";
import { Icon } from "@/components/ui/Icons";
import { formatPrice } from "@/lib/currency";

export function DealCustomizerModal({ deal, open, onClose }) {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  // Selected options state: { [groupTitle]: [ { name, extraPrice, ... } ] }
  const [selectedChoices, setSelectedChoices] = useState({});

  useEffect(() => {
    if (open && deal) {
      setQuantity(1);
      setInstructions("");

      // Auto-select initial options if single choice
      const initial = {};
      (deal.choiceGroups || []).forEach((group) => {
        if (group.selectCount === 1 && group.options?.length > 0) {
          initial[group.title] = [group.options[0]];
        } else {
          initial[group.title] = [];
        }
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

  // Calculate Extra Option Surcharges
  const extraOptionsPrice = Object.values(selectedChoices)
    .flat()
    .reduce((sum, opt) => sum + (Number(opt?.extraPrice) || 0), 0);

  const singleUnitDealPrice = (deal.dealPrice || 0) + extraOptionsPrice;
  const grandTotalPrice = singleUnitDealPrice * quantity;

  // Validation Check: ensure all required choice groups have reached required pickCount
  const isFormValid = (deal.choiceGroups || []).every((group) => {
    if (!group.required) return true;
    const currentPicks = selectedChoices[group.title] || [];
    return currentPicks.length === (group.selectCount || 1);
  });

  const handleSelectSingleOption = (groupTitle, option) => {
    setSelectedChoices((prev) => ({
      ...prev,
      [groupTitle]: [option],
    }));
  };

  const handleToggleMultiOption = (group, option) => {
    const current = selectedChoices[group.title] || [];
    const existsIndex = current.findIndex((o) => o.name === option.name);

    if (existsIndex > -1) {
      setSelectedChoices((prev) => ({
        ...prev,
        [group.title]: current.filter((_, i) => i !== existsIndex),
      }));
    } else {
      if (current.length < group.selectCount) {
        setSelectedChoices((prev) => ({
          ...prev,
          [group.title]: [...current, option],
        }));
      }
    }
  };

  const handleAddToCart = () => {
    if (!isFormValid) return;

    dispatch(
      addToCart({
        _id: deal._id || deal.id,
        name: deal.title,
        price: singleUnitDealPrice,
        image: deal.image,
        quantity,
        isDeal: true,
        selectedChoices,
        specialInstructions: instructions.trim(),
      })
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Column: Visual & Overview */}
        <div className="relative w-full md:w-[42%] min-h-[220px] sm:min-h-[280px] md:min-h-full bg-neutral-900 flex items-center justify-center p-6">
          <Image
            src={deal.image || "/placeholder.png"}
            alt={deal.title}
            fill
            sizes="(max-width: 768px) 100vw, 42vw"
            className="object-cover"
            priority
          />
          
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6 pt-16">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#F4C61A] text-black text-[10px] font-black uppercase tracking-wider mb-2">
              {deal.dealType || "Exclusive Deal"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
              {deal.title}
            </h2>
          </div>
        </div>

        {/* Right Column: Choices, Customizations & Bottom Actions */}
        <div className="flex flex-col justify-between w-full md:w-[58%] max-h-[70vh] md:max-h-[92vh]">
          
          {/* Scrollable Options Body */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
            
            {/* Header: Title, Price & Close */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-neutral-900">
                  {formatPrice(singleUnitDealPrice)}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                  {deal.description}
                </p>
              </div>

              <button
                onClick={onClose}
                type="button"
                aria-label="Close modal"
                className="grid place-items-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors shrink-0"
              >
                <Icon name="close" size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Fixed Items Inclusions */}
            {deal.fixedItems && deal.fixedItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Meal Includes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {deal.fixedItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-semibold text-neutral-800"
                    >
                      {item.quantity}x {item.product?.name || "Included Item"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Choice Groups */}
            {(deal.choiceGroups || []).map((group, gIdx) => {
              const currentPicks = selectedChoices[group.title] || [];
              const isSingle = group.selectCount === 1;

              return (
                <div key={gIdx} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-neutral-900">
                      {group.title}
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {isSingle
                        ? "Required (Pick 1)"
                        : `Pick ${group.selectCount} (${currentPicks.length}/${group.selectCount})`}
                    </span>
                  </div>

                  {/* Option Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.options.map((opt, optIdx) => {
                      const isSelected = currentPicks.some((o) => o.name === opt.name);

                      return (
                        <div
                          key={optIdx}
                          onClick={() =>
                            isSingle
                              ? handleSelectSingleOption(group.title, opt)
                              : handleToggleMultiOption(group, opt)
                          }
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#F4C61A] bg-amber-50/50 shadow-xs"
                              : "border-neutral-200 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Selection Radio / Checkbox Indicator */}
                            <div
                              className={`grid place-items-center w-5 h-5 rounded-${
                                isSingle ? "full" : "md"
                              } border transition-colors shrink-0 ${
                                isSelected
                                  ? "border-[#F4C61A] bg-[#F4C61A] text-black"
                                  : "border-neutral-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-black" />
                              )}
                            </div>

                            {/* Option Icon / Image (if available, e.g. for Kitty Box) */}
                            {opt.image && (
                              <div className="relative w-8 h-8 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                                <Image
                                  src={opt.image}
                                  alt={opt.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}

                            <span className="text-xs font-bold text-neutral-800 truncate">
                              {opt.name}
                            </span>
                          </div>

                          {/* Extra Price Tag */}
                          {opt.extraPrice > 0 && (
                            <span className="text-[11px] font-extrabold text-neutral-600 shrink-0 ml-1">
                              +{formatPrice(opt.extraPrice)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Special Instructions */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                Special Instructions
              </label>
              <div className="relative border border-neutral-200 rounded-xl p-2.5 focus-within:border-[#F4C61A] transition-all">
                <textarea
                  rows={2}
                  maxLength={500}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Extra spicy, sauce on the side"
                  className="w-full resize-none bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 outline-none"
                />
              </div>
            </div>

          </div>

          {/* Bottom Bar: Quantity & Add To Cart */}
          <div className="flex items-center gap-3 p-4 sm:p-5 bg-white border-t border-neutral-100">
            {/* Quantity Controls */}
            <div className="flex items-center border border-amber-200 rounded-xl p-1 bg-amber-50/40 shrink-0">
              <button
                type="button"
                onClick={() => quantity > 1 && setQuantity((prev) => prev - 1)}
                className="grid place-items-center w-8 h-8 rounded-lg text-neutral-700 bg-white hover:bg-neutral-100 transition-colors disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Icon name="minus" size={14} />
              </button>

              <span className="w-8 text-center text-xs font-black text-neutral-900">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="grid place-items-center w-8 h-8 rounded-lg bg-[#F4C61A] text-black hover:bg-[#E0B210] transition-colors"
              >
                <Icon name="plus" size={14} />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              disabled={!isFormValid}
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-between min-h-[46px] px-5 rounded-xl bg-[#F4C61A] text-black font-extrabold text-xs sm:text-sm hover:bg-[#E0B210] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{formatPrice(grandTotalPrice)}</span>
              <div className="flex items-center gap-1">
                <span>{isFormValid ? "Add to Cart" : "Select Required Options"}</span>
                <Icon name="chevronRight" size={15} strokeWidth={2.4} />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}