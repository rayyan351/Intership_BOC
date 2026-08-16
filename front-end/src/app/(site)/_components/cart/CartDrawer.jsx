// src/app/(site)/_components/cart/CartDrawer.jsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setIsCartOpen, 
  removeFromCart, 
  addToCart, 
  decreaseQuantity 
} from '@/redux/cart/cartSlice';
import { Icon } from '@/components/ui/Icons';
import { formatPrice } from '@/lib/currency';

export function CartDrawer() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items, isCartOpen, totalPrice } = useSelector((state) => state.cart);

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    dispatch(setIsCartOpen(false));
    router.push('/checkout');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-[2px] transition-opacity"
      onClick={() => dispatch(setIsCartOpen(false))}
    >
      <aside 
        className="flex flex-col w-full max-w-[420px] h-[100dvh] bg-white shadow-[-5px_0_25px_rgba(0,0,0,0.15)] animate-in slide-in-from-right duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 bg-white">
          <h2 className="m-0 text-[1.4rem] font-extrabold text-neutral-900">
            Your Order
          </h2>
          <button 
            type="button"
            onClick={() => dispatch(setIsCartOpen(false))} 
            className="grid place-items-center w-9 h-9 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
            aria-label="Close cart"
          >
            <Icon name="close" size={18} strokeWidth={2.2} />
          </button>
        </header>

        {/* Scrollable Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400 gap-2">
              <span className="text-3xl">🛒</span>
              <p className="font-medium text-sm">Your cart is empty.</p>
            </div>
          ) : (
            items.map((item) => {
              const itemKey = item.cartItemId || item._id || item.id;
              
              return (
                <div 
                  key={itemKey} 
                  className="flex items-start gap-3.5 pb-4 border-b border-neutral-100"
                >
                  {/* Thumbnail Image */}
                  <div className="relative w-16 h-16 min-w-16 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200 shrink-0">
                    <Image 
                      src={item.image || "/images/brand/BurgerO'clock logo.webp"} 
                      alt={item.name} 
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="m-0 text-sm font-bold text-neutral-900 leading-snug truncate">
                        {item.name}
                      </h4>
                      <span className="text-sm font-extrabold text-neutral-900 whitespace-nowrap">
                        {formatPrice((item.price || 0) * item.quantity)}
                      </span>
                    </div>

                    {/* Deal Choice / Bundle Inclusions */}
                    {item.selectedChoices && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {Object.entries(item.selectedChoices).map(([groupTitle, choices]) =>
                          (choices || []).map((choice, cIdx) => (
                            <span 
                              key={`${groupTitle}-${cIdx}`}
                              className="text-[10px] font-semibold text-neutral-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded"
                            >
                              {choice.name}
                            </span>
                          ))
                        )}
                      </div>
                    )}

                    {/* Special Instructions Note */}
                    {item.specialInstructions && (
                      <p className="text-[11px] text-neutral-500 italic line-clamp-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}

                    {/* Controls Row */}
                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Selector */}
                      <div className="inline-flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                        <button 
                          type="button" 
                          onClick={() => dispatch(decreaseQuantity(itemKey))}
                          className="grid place-items-center w-7 h-7 bg-transparent text-neutral-700 hover:bg-neutral-200 font-bold transition-colors"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-bold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => dispatch(addToCart({ ...item, quantity: 1 }))}
                          className="grid place-items-center w-7 h-7 bg-transparent text-neutral-700 hover:bg-neutral-200 font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button 
                        type="button" 
                        onClick={() => dispatch(removeFromCart(itemKey))} 
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline p-1 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <footer className="flex flex-col gap-4 p-6 pb-8 border-t border-neutral-200 bg-white">
            <div className="flex justify-between items-center text-neutral-900">
              <span className="text-sm font-bold text-neutral-600">Subtotal:</span>
              <strong className="text-xl font-black text-neutral-900">
                {formatPrice(totalPrice)}
              </strong>
            </div>

            <button 
              type="button" 
              onClick={handleProceedToCheckout}
              className="w-full min-h-[50px] rounded-xl bg-[#F4C61A] text-black font-black text-sm tracking-wide shadow-[0_4px_12px_rgba(244,198,26,0.3)] hover:bg-[#E0B210] active:scale-[0.99] transition-all"
            >
              PROCEED TO CHECKOUT
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}