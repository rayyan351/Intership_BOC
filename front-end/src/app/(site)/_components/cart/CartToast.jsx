'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export function CartToast() {
  const [toastMessage, setToastMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const cartItems = useSelector((state) => state.cart.items);
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);

  // Trigger toast whenever total quantity increases
  useEffect(() => {
    if (totalQuantity > 0) {
      const lastItem = cartItems[cartItems.length - 1];
      if (lastItem) {
        setToastMessage(`Added "${lastItem.name}" to cart!`);
        setVisible(true);

        const timer = setTimeout(() => {
          setVisible(false);
        }, 3000); // Hide after 3 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [totalQuantity, cartItems]);

  if (!visible) return null;

  return (
    <div className="toastContainer">
      <p>{toastMessage}</p>
    </div>
  );
}