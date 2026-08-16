// src/app/(site)/checkout/page.jsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '@/redux/cart/cartSlice';
import { usePlaceOrderMutation } from '@/services/orderApi';
import { useLocation } from '@/context/LocationContext';
import { formatPrice } from '@/lib/currency';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { selectedBranch } = useLocation();
  const { items, totalPrice } = useSelector((state) => state.cart);
  const [placeOrder, { isLoading: isPlacingOrder }] = usePlaceOrderMutation();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        customer: formData,
        branch: selectedBranch,
        items,
        totalPrice,
        paymentMethod: formData.paymentMethod,
      };

      const res = await placeOrder(payload).unwrap();

      if (res.success) {
        dispatch(clearCart());
        alert('Order placed successfully!');
        router.push('/');
      }
    } catch (err) {
      alert(err?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-black text-black mb-2 uppercase tracking-wide">
          Your Cart is Empty
        </h2>
        <p className="text-neutral-500 mb-6 font-medium text-sm">
          Add some delicious burgers before checking out!
        </p>
        <Link 
          href="/" 
          className="bg-[#F4C61A] hover:bg-[#E0B210] text-black font-black px-8 py-3.5 rounded-xl shadow-sm transition uppercase tracking-wider text-xs sm:text-sm"
        >
          RETURN TO MENU
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfb] min-h-screen py-8 sm:py-12">
      <div className="w-[min(1120px,calc(100%-32px))] mx-auto">
        <h1 className="font-display text-3xl sm:text-5xl font-black text-black mb-8 uppercase tracking-wide">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN: Form Inputs */}
          <div className="flex-1 w-full space-y-6">
            
            {/* 1. Delivery Details */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-6 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                1. Delivery Details
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0300 1234567"
                      className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    City
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition cursor-pointer"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    Complete Address *
                  </label>
                  <textarea
                    name="address"
                    rows="3"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House/Apartment #, Street, Block, Area..."
                    className="w-full p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    Order Notes (Optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="E.g. extra sauce, don't ring doorbell"
                    className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-5 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                2. Payment Method
              </h2>
              <div className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-[#F4C61A] bg-amber-50/40 cursor-pointer">
                <input
                  type="radio"
                  id="cod"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#F4C61A] accent-[#F4C61A] cursor-pointer"
                />
                <label htmlFor="cod" className="text-sm font-black text-black cursor-pointer uppercase tracking-wider">
                  Cash on Delivery (COD)
                </label>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0 sticky top-24">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-4 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                Order Summary
              </h2>

              {/* Item List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 mb-4 pr-1">
                {items.map((item) => {
                  const itemKey = item.cartItemId || item._id || item.id;
                  return (
                    <div key={itemKey} className="py-3 flex items-start gap-3">
                      <div className="relative w-12 h-12 min-w-[48px] rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200 shrink-0">
                        <Image
                          src={item.image || "/images/brand/BurgerO'clock logo.webp"}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-black truncate">{item.name}</h4>
                        <p className="text-[11px] font-semibold text-neutral-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-extrabold text-black whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span className="font-black text-emerald-600 uppercase text-[10px] tracking-wider">Free</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline text-sm font-black text-black">
                  <span className="uppercase tracking-wider">Total</span>
                  <span className="font-display text-2xl text-black">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                disabled={isPlacingOrder}
                type="submit"
                className="w-full mt-6 bg-[#F4C61A] hover:bg-[#E0B210] text-black font-black py-4 rounded-xl shadow-md transition transform active:scale-98 uppercase tracking-wider text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}