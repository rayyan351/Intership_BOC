'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state) => state.cart);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: 'Karachi',
    address: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Order placed successfully!');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-display text-4xl font-extrabold text-black mb-2 uppercase tracking-wide">
          Your Cart is Empty
        </h2>
        <p className="text-gray-600 mb-6 font-medium">
          Add some delicious burgers before checking out!
        </p>
        <Link 
          href="/" 
          className="bg-[var(--color-yellow)] hover:bg-[var(--color-yellow-dark)] text-black font-extrabold px-8 py-3.5 rounded-xl shadow-md transition uppercase tracking-wider text-sm"
        >
          RETURN TO MENU
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfb] min-h-screen">
      <div className="checkout-container">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-black mb-6 uppercase tracking-wide">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="checkout-flex-form">
          
          {/* LEFT COLUMN: Form Inputs */}
          <div className="checkout-left-col">
            
            {/* 1. Delivery Details */}
            <div className="checkout-card">
              <h2 className="font-display text-2xl font-bold text-black mb-5 pb-3 border-b border-gray-100 uppercase tracking-wide">
                1. Delivery Details
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="checkout-label">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="checkout-input"
                    />
                  </div>

                  <div>
                    <label className="checkout-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0300 1234567"
                      className="checkout-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="checkout-label">City</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="checkout-input cursor-pointer"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>

                <div>
                  <label className="checkout-label">Complete Address *</label>
                  <textarea
                    name="address"
                    rows="3"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House/Apartment #, Street, Block, Area..."
                    className="checkout-input resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="checkout-label">Order Notes (Optional)</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="E.g. extra sauce, don't ring doorbell"
                    className="checkout-input"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="checkout-card">
              <h2 className="font-display text-2xl font-bold text-black mb-4 pb-3 border-b border-gray-100 uppercase tracking-wide">
                2. Payment Method
              </h2>
              <div className="flex items-center gap-3.5 p-4 rounded-xl border-2 border-[var(--color-yellow)] bg-amber-50/40">
                <input
                  type="radio"
                  id="cod"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleChange}
                  className="w-5 h-5 text-yellow-500 focus:ring-[var(--color-yellow)] cursor-pointer"
                />
                <label htmlFor="cod" className="text-sm font-bold text-black cursor-pointer uppercase tracking-wider">
                  Cash on Delivery (COD)
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary Sidebar */}
          <div className="checkout-right-col">
            <div className="checkout-card">
              <h2 className="font-display text-2xl font-bold text-black mb-4 pb-3 border-b border-gray-100 uppercase tracking-wide">
                Order Summary
              </h2>

              {/* Item List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 mb-4 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    <div className="relative w-12 h-12 min-w-[48px] rounded-xl overflow-hidden bg-[var(--color-soft)] border border-gray-200">
                      <Image
                        src={item.image || "/images/brand/BurgerO'clock logo.webp"}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-black line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] font-semibold text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-extrabold text-black whitespace-nowrap">
                      Rs {item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">Rs {totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-extrabold text-emerald-600 uppercase text-[10px] tracking-wider">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-black text-black">
                  <span className="uppercase tracking-wider">Total</span>
                  <span className="font-display text-2xl text-black">Rs {totalPrice}</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                className="w-full mt-6 bg-[var(--color-yellow)] hover:bg-[var(--color-yellow-dark)] text-black font-extrabold py-4 rounded-xl shadow-md transition transform active:scale-95 uppercase tracking-wider text-sm"
              >
                Place Order
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}