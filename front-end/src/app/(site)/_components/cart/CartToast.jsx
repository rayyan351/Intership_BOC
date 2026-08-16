// src/app/(site)/_components/cart/CartToast.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export function CartToast() {
  const [toastMessage, setToastMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const cartItems = useSelector((state) => state.cart.items);
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);

  useEffect(() => {
    if (totalQuantity > 0) {
      const lastItem = cartItems[cartItems.length - 1];
      if (lastItem) {
        setToastMessage(`Added "${lastItem.name}" to cart!`);
        setVisible(true);

        const timer = setTimeout(() => {
          setVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [totalQuantity, cartItems]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full bg-neutral-900 text-white font-bold text-sm shadow-[0_10px_25px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <p className="m-0 leading-none">{toastMessage}</p>
    </div>
  );
}