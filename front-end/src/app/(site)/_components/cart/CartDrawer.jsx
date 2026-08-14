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
      className="overlay"
      onClick={() => dispatch(setIsCartOpen(false))}
    >
      <aside 
        className="drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="header">
          <h2>Your Order</h2>
          <button 
            type="button"
            onClick={() => dispatch(setIsCartOpen(false))} 
            className="closeBtn"
            aria-label="Close cart"
          >
            ✕
          </button>
        </header>

        {/* Scrollable Item List */}
        <div className="itemList">
          {items.length === 0 ? (
            <div className="emptyState">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="itemRow">
                <div className="itemImageContainer">
                  <Image 
                    src={item.image || "/images/brand/BurgerO'clock logo.webp"} 
                    alt={item.name} 
                    fill
                    sizes="64px"
                    className="itemImage"
                  />
                </div>

                <div className="itemDetails">
                  <div className="itemHeader">
                    <h4 className="itemName">{item.name}</h4>
                    <span className="itemPrice">Rs {item.price}</span>
                  </div>

                  <div className="itemControls">
                    <div className="quantityGroup">
                      <button 
                        type="button" 
                        onClick={() => dispatch(decreaseQuantity(item.id))}
                        className="qtyBtn"
                      >
                        −
                      </button>
                      <span className="qtyValue">{item.quantity}</span>
                      <button 
                        type="button" 
                        onClick={() => dispatch(addToCart(item))}
                        className="qtyBtn"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => dispatch(removeFromCart(item.id))} 
                      className="removeBtn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fixed Bottom Footer */}
        {items.length > 0 && (
          <footer className="footer">
            <div className="totalRow">
              <span>Subtotal:</span>
              <strong>Rs {totalPrice}</strong>
            </div>
            <button 
              type="button" 
              onClick={handleProceedToCheckout}
              className="checkoutBtn"
            >
              PROCEED TO CHECKOUT
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}