// src/app/(site)/checkout/page.jsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '@/redux/cart/cartSlice';

// ✅ CORRECT: Import from orderApi
import { useCreateOrderMutation, useCreatePaymentIntentMutation } from '@/services/orderApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useLocation } from '@/context/LocationContext';
import { formatPrice } from '@/lib/currency';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { selectedBranch } = useLocation();
  const { items, totalPrice } = useSelector((state) => state.cart);
  
  const { data: branches = [] } = useGetBranchesQuery();
  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();

  const [activeBranchId, setActiveBranchId] = useState(
    selectedBranch?._id || selectedBranch || ''
  );

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: 'Karachi',
    address: '',
    notes: '',
    paymentMethod: 'COD',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const deliveryFee = 0;
  const subtotal = Number(totalPrice) || 0;
  const finalTotal = subtotal + deliveryFee;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // ✅ Resolve target database branch ID cleanly
    let targetBranchId = activeBranchId;

    if (!targetBranchId && selectedBranch) {
      if (typeof selectedBranch === 'string' && selectedBranch.length === 24) {
        targetBranchId = selectedBranch;
      } else if (selectedBranch._id) {
        targetBranchId = selectedBranch._id;
      } else if (selectedBranch.name || selectedBranch.id) {
        const found = branches.find(
          (b) =>
            b.name?.toLowerCase() === (selectedBranch.name || '').toLowerCase() ||
            b.branchCode?.toLowerCase() === (selectedBranch.id || '').toLowerCase()
        );
        if (found) targetBranchId = found._id;
      }
    }

    if (!targetBranchId && branches.length > 0) {
      targetBranchId = branches[0]._id;
    }

    if (!targetBranchId) {
      setErrorMessage('Please select a Burger O’Clock branch outlet for order preparation.');
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      setErrorMessage('Please fill in all required delivery details.');
      return;
    }

    try {
      let stripePaymentIntentId = null;

      if (formData.paymentMethod === 'CARD') {
        const intentRes = await createPaymentIntent({
          amount: finalTotal,
          currency: 'PKR',
        }).unwrap();
        stripePaymentIntentId = intentRes.paymentIntentId || 'MOCK_STRIPE_TEST_ID';
      }

      const formattedItems = items.map((itm) => ({
        product: itm.productId || itm._id || itm.id,
        name: itm.name,
        price: Number(itm.price),
        quantity: Number(itm.quantity),
        customizations: itm.customizations || [],
        itemTotal: Number(itm.price) * Number(itm.quantity),
        image: itm.image || '',
      }));

      const payload = {
        customer: {
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: `${formData.address}, ${formData.city}`,
        },
        branch: targetBranchId, // ✅ Pure 24-character ObjectId string
        orderType: 'DELIVERY',
        items: formattedItems,
        subtotal,
        deliveryFee,
        totalAmount: finalTotal,
        paymentMethod: formData.paymentMethod,
        stripePaymentIntentId,
        orderNotes: formData.notes,
      };

      const res = await createOrder(payload).unwrap();

      dispatch(clearCart());
      setPlacedOrder(res.order || res);
    } catch (err) {
      if (err?.data?.shortages) {
        setErrorMessage(
          `Kitchen Out of Stock: ${err.data.shortages
            .map((s) => `${s.ingredient} (short by ${s.shortage} ${s.unit})`)
            .join(', ')}`
        );
      } else {
        setErrorMessage(err?.data?.message || 'Failed to place order. Please try again.');
      }
    }
  };

  if (items.length === 0 && !placedOrder) {
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

  if (placedOrder) {
    return (
      <div className="bg-[#fcfcfb] min-h-[75vh] flex items-center justify-center py-12 px-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-3xl shadow-sm max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-black uppercase tracking-wide mb-1">
            Order Confirmed!
          </h2>
          <p className="text-xs text-neutral-500 font-medium mb-6">
            Your order has been transmitted directly to the kitchen display.
          </p>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-left space-y-2 mb-6 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <span className="text-neutral-500 font-sans font-bold">Order ID:</span>
              <strong className="text-black text-sm">{placedOrder.orderNumber}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-sans">Payment Method:</span>
              <span className="font-bold text-neutral-900">
                {placedOrder.paymentMethod === 'CARD' ? 'Visa / Mastercard (Paid)' : 'Cash on Delivery (COD)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-sans">Total Bill:</span>
              <strong className="text-black font-display text-base">
                {formatPrice(placedOrder.totalAmount)}
              </strong>
            </div>
            <div className="flex justify-between items-start pt-1">
              <span className="text-neutral-500 font-sans shrink-0">Deliver To:</span>
              <span className="font-medium text-neutral-800 text-right truncate max-w-[200px]">
                {placedOrder.customer?.address}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#F4C61A] hover:bg-[#E0B210] text-black font-black py-4 rounded-xl shadow-sm transition uppercase tracking-wider text-xs sm:text-sm"
          >
            ORDER MORE BURGERS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfcfb] min-h-screen py-8 sm:py-12 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-[min(1120px,calc(100%-32px))] mx-auto">
        <h1 className="font-display text-3xl sm:text-5xl font-black text-black mb-8 uppercase tracking-wide">
          Checkout
        </h1>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full space-y-6">
            
            {/* 1. Branch Selection */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-6 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                1. Kitchen Outlet
              </h2>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Fulfilling Branch *
                </label>
                <select
                  value={activeBranchId}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition cursor-pointer"
                  required
                >
                  <option value="" disabled>Select nearest branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Delivery Details */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-6 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                2. Delivery Details
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition"
                    />
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
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    Complete Street Address *
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
                    placeholder="E.g. extra napkins, please call upon arrival"
                    className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] focus:ring-1 focus:ring-[#F4C61A] outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-5 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                3. Payment Method
              </h2>

              <div className="space-y-3">
                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                    formData.paymentMethod === 'COD'
                      ? 'border-[#F4C61A] bg-amber-50/40'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === 'COD'}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#F4C61A] accent-[#F4C61A] cursor-pointer"
                    />
                    <div>
                      <label htmlFor="cod" className="text-sm font-black text-black cursor-pointer uppercase tracking-wider block">
                        Cash on Delivery (COD)
                      </label>
                      <span className="text-[11px] text-neutral-500 font-medium">Pay cash to rider upon delivery</span>
                    </div>
                  </div>
                  <span className="text-lg">💵</span>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'CARD' })}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                    formData.paymentMethod === 'CARD'
                      ? 'border-[#F4C61A] bg-amber-50/40'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="card"
                      name="paymentMethod"
                      value="CARD"
                      checked={formData.paymentMethod === 'CARD'}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#F4C61A] accent-[#F4C61A] cursor-pointer"
                    />
                    <div>
                      <label htmlFor="card" className="text-sm font-black text-black cursor-pointer uppercase tracking-wider block">
                        Credit / Debit Card (Stripe Test)
                      </label>
                      <span className="text-[11px] text-neutral-500 font-medium">Instant sandbox mock authorization (Free)</span>
                    </div>
                  </div>
                  <span className="text-lg">💳</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0 sticky top-24">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-4 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                Order Summary
              </h2>

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

              <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span className="font-black text-emerald-600 uppercase text-[10px] tracking-wider">Free</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline text-sm font-black text-black">
                  <span className="uppercase tracking-wider">Total</span>
                  <span className="font-display text-2xl text-black">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                disabled={isPlacingOrder}
                type="submit"
                className="w-full mt-6 bg-[#F4C61A] hover:bg-[#E0B210] text-black font-black py-4 rounded-xl shadow-md transition transform active:scale-98 uppercase tracking-wider text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isPlacingOrder ? 'Processing Order...' : `Place Order • ${formatPrice(finalTotal)}`}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}