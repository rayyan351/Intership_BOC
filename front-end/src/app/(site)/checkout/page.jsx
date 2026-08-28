// src/app/(site)/checkout/page.jsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '@/redux/cart/cartSlice';
import { useLocation } from '@/context/LocationContext';

import { useCreateOrderMutation, useCreatePaymentIntentMutation } from '@/services/orderApi';
import { useGetDeliveryAreasQuery, useGetSystemSettingsQuery } from '@/services/deliveryAreaApi';
import { formatPrice } from '@/lib/currency';
import { getImageUrl } from '@/config/site';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state) => state.cart);
  const reduxLocation = useSelector((state) => state.location?.selectedLocation);
  const { selectedBranch } = useLocation ? useLocation() : {};

  const activeSavedLocation = reduxLocation || selectedBranch;

  const { data: deliveryAreas = [] } = useGetDeliveryAreasQuery({ activeOnly: 'true' });
  const { data: settings } = useGetSystemSettingsQuery();

  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();
  const [createPaymentIntent, { isLoading: isInitiatingPayment }] = useCreatePaymentIntentMutation();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: activeSavedLocation?.city || 'Karachi',
    selectedAreaId: activeSavedLocation?.areaId || activeSavedLocation?._id || '',
    address: '',
    notes: '',
    paymentMethod: 'COD',
    transactionRef: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const activePopupRef = useRef(null);
  const currentTrackerRef = useRef(null);
  const isOrderSubmittedRef = useRef(false);

  // Sync auto-fill whenever saved location or delivery areas load
  useEffect(() => {
    if (activeSavedLocation) {
      setFormData((prev) => ({
        ...prev,
        city: activeSavedLocation.city || prev.city,
        selectedAreaId: activeSavedLocation.areaId || activeSavedLocation._id || prev.selectedAreaId,
      }));
    }
  }, [activeSavedLocation]);

  const cityAreas = useMemo(() => {
    return deliveryAreas.filter((a) => a.city?.toLowerCase() === formData.city?.toLowerCase());
  }, [deliveryAreas, formData.city]);

  const selectedAreaObj = useMemo(() => {
    return deliveryAreas.find((a) => a._id === formData.selectedAreaId);
  }, [deliveryAreas, formData.selectedAreaId]);

  const assignedKitchenBranch = selectedAreaObj?.assignedBranch;
  const deliveryFee = selectedAreaObj?.deliveryFee || 0;
  const subtotal = Number(totalPrice) || 0;

  const taxConfig = settings?.taxSettings || { codTaxPercentage: 15, cardTaxPercentage: 13, isTaxEnabled: true };
  const isCard = formData.paymentMethod === 'CARD';
  const activeTaxRate = taxConfig.isTaxEnabled
    ? isCard
      ? taxConfig.cardTaxPercentage
      : taxConfig.codTaxPercentage
    : 0;

  const taxAmount = Number(((subtotal * activeTaxRate) / 100).toFixed(2));
  const finalTotal = subtotal + deliveryFee + taxAmount;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const executeOrderPlacement = async (transactionReference = null) => {
    if (isOrderSubmittedRef.current) return;
    isOrderSubmittedRef.current = true;

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
        address: `${formData.address}, ${selectedAreaObj?.name || ''}, ${formData.city}`,
        latitude: selectedAreaObj?.latitude || activeSavedLocation?.userCoords?.latitude || null,
        longitude: selectedAreaObj?.longitude || activeSavedLocation?.userCoords?.longitude || null,
        city: formData.city,
      },
      branch: assignedKitchenBranch?._id || assignedKitchenBranch,
      orderType: 'DELIVERY',
      items: formattedItems,
      subtotal,
      tax: taxAmount,
      deliveryFee,
      totalAmount: finalTotal,
      paymentMethod: formData.paymentMethod,
      transactionReference,
      orderNotes: formData.notes,
    };

    try {
      const res = await createOrder(payload).unwrap();
      dispatch(clearCart());
      setPlacedOrder(res.order || res);
    } catch (err) {
      isOrderSubmittedRef.current = false;
      if (err?.data?.shortages) {
        setErrorMessage(
          `Kitchen Out of Stock: ${err.data.shortages
            .map((s) => `${s.ingredient} (short by ${s.shortage} ${s.unit})`)
            .join(', ')}`
        );
      } else {
        setErrorMessage(err?.data?.message || 'Failed to finalize order in database.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    const handleSafepayMessage = async (event) => {
      if (!event.origin.includes('getsafepay.com')) return;

      let eventData = event.data;
      if (typeof eventData === 'string') {
        try {
          eventData = JSON.parse(eventData);
        } catch {}
      }

      const msgType = eventData?.MessageType || eventData?.type || eventData?.event;
      const isSuccess =
        msgType === 'profile.completed' ||
        msgType === 'payment.completed' ||
        msgType === 'transaction.success' ||
        eventData?.Status === true ||
        eventData?.status === 'success';

      if (isSuccess && currentTrackerRef.current && !isOrderSubmittedRef.current) {
        if (activePopupRef.current && !activePopupRef.current.closed) {
          activePopupRef.current.close();
        }
        await executeOrderPlacement(currentTrackerRef.current);
      }
    };

    window.addEventListener('message', handleSafepayMessage);
    return () => window.removeEventListener('message', handleSafepayMessage);
  }, [items, finalTotal, formData, selectedAreaObj, assignedKitchenBranch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedAreaObj) {
      setErrorMessage('Please select your delivery area to determine the nearest kitchen outlet.');
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      setErrorMessage('Please fill in your full name, phone number, and complete street address.');
      return;
    }

    if (formData.paymentMethod === 'BANK_TRANSFER' && !formData.transactionRef.trim()) {
      setErrorMessage('Please provide your 6-digit Raast/Bank transaction reference number.');
      return;
    }

    try {
      if (formData.paymentMethod === 'CARD') {
        setIsProcessingPayment(true);

        const intentRes = await createPaymentIntent({
          amount: finalTotal,
          currency: 'PKR',
          paymentMethod: 'CARD',
        }).unwrap();

        const tracker = intentRes.token || intentRes.paymentIntentId;

        if (!tracker) {
          setErrorMessage('Could not generate payment authorization tracker.');
          setIsProcessingPayment(false);
          return;
        }

        currentTrackerRef.current = tracker;
        isOrderSubmittedRef.current = false;

        const width = 460;
        const height = 680;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const safepayUrl = `https://sandbox.api.getsafepay.com/checkout/pay?beacon=${tracker}&env=sandbox`;
        const popup = window.open(
          safepayUrl,
          'Safepay Checkout',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=no`
        );

        activePopupRef.current = popup;

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          setErrorMessage('Popup blocked! Please allow popups for this site to complete card payment.');
          setIsProcessingPayment(false);
          return;
        }

        const checkCloseInterval = setInterval(async () => {
          if (!popup || popup.closed) {
            clearInterval(checkCloseInterval);
            if (!isOrderSubmittedRef.current && currentTrackerRef.current) {
              await executeOrderPlacement(currentTrackerRef.current);
            }
          }
        }, 800);
      } else {
        await executeOrderPlacement(formData.transactionRef || null);
      }
    } catch (err) {
      setIsProcessingPayment(false);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans',sans-serif]">
        <h2 className="font-display text-3xl sm:text-4xl font-black text-black mb-2 uppercase tracking-wide">
          Your Cart is Empty
        </h2>
        <p className="text-neutral-500 mb-6 font-medium text-sm">
          Add items to your cart before checking out.
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
            Your order has been routed to the kitchen display.
          </p>

          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-left space-y-2 mb-6 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <span className="text-neutral-500 font-sans font-bold">Order ID:</span>
              <strong className="text-black text-sm">{placedOrder.orderNumber}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-sans">Payment Method:</span>
              <span className="font-bold text-neutral-900">
                {placedOrder.paymentMethod === 'CARD'
                  ? 'Safepay Online Card (Paid)'
                  : placedOrder.paymentMethod === 'BANK_TRANSFER'
                  ? 'Raast / Bank Transfer'
                  : 'Cash on Delivery (COD)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500 font-sans">Total Bill (Inc. Tax):</span>
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

          <div className="space-y-2.5">
            <button
              onClick={() => router.push(`/track-order?id=${placedOrder.orderNumber}`)}
              className="w-full bg-[#F4C61A] hover:bg-[#E0B210] text-black font-black py-4 rounded-xl shadow-sm transition uppercase tracking-wider text-xs sm:text-sm cursor-pointer"
            >
              TRACK MY ORDER LIVE
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3 rounded-xl transition uppercase tracking-wider text-xs cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
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
            {/* 1. Delivery Location */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-6 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                1. Delivery Location
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                      City *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ ...formData, city: e.target.value, selectedAreaId: '' });
                      }}
                      className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] outline-none transition cursor-pointer"
                    >
                      <option value="Karachi">Karachi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                      Select Your Area / Sector *
                    </label>
                    <select
                      name="selectedAreaId"
                      value={formData.selectedAreaId}
                      onChange={handleChange}
                      className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] outline-none transition cursor-pointer font-semibold"
                      required
                    >
                      <option value="" disabled>
                        Choose your neighborhood
                      </option>
                      {cityAreas.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} {a.deliveryFee > 0 ? `(+Rs. ${a.deliveryFee} delivery)` : '(Free Delivery)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAreaObj && (
                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-950 block">
                        ⚡ Kitchen Dispatch Routing
                      </span>
                      <span className="text-amber-800 text-[11px]">
                        Fulfilling Outlet: <strong>{assignedKitchenBranch?.name || 'Nearest Outlet'}</strong>
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    Complete Street Address (House/Flat #, Street, Building) *
                  </label>
                  <textarea
                    name="address"
                    rows="2"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. Apartment # 4B, Street 12, Block 4"
                    className="w-full p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] outline-none transition resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 2. Customer Contact */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-6 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                2. Contact Information
              </h2>

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
                    className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                    Phone Number (Rider Contact) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0300 1234567"
                    className="w-full min-h-[46px] px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:bg-white focus:border-[#F4C61A] outline-none transition"
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
                      <span className="text-[11px] text-neutral-500 font-medium">
                        Govt SST: {taxConfig.codTaxPercentage}%
                      </span>
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
                      <div className="flex items-center gap-2">
                        <label htmlFor="card" className="text-sm font-black text-black cursor-pointer uppercase tracking-wider block">
                          Debit / Credit Card (Safepay)
                        </label>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Save {taxConfig.codTaxPercentage - taxConfig.cardTaxPercentage}% Tax
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-medium">
                        PayPak, 1LINK, Visa, Mastercard • Reduced Govt SST: {taxConfig.cardTaxPercentage}%
                      </span>
                    </div>
                  </div>
                  <span className="text-lg">💳</span>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'BANK_TRANSFER' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    formData.paymentMethod === 'BANK_TRANSFER'
                      ? 'border-[#F4C61A] bg-amber-50/40'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="bank_transfer"
                        name="paymentMethod"
                        value="BANK_TRANSFER"
                        checked={formData.paymentMethod === 'BANK_TRANSFER'}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#F4C61A] accent-[#F4C61A] cursor-pointer"
                      />
                      <div>
                        <label htmlFor="bank_transfer" className="text-sm font-black text-black cursor-pointer uppercase tracking-wider block">
                          Raast / Direct Bank Transfer
                        </label>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          1LINK & Raast instant transfer
                        </span>
                      </div>
                    </div>
                    <span className="text-lg">🏦</span>
                  </div>

                  {formData.paymentMethod === 'BANK_TRANSFER' && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs space-y-2">
                      <div className="bg-white p-3 rounded-xl border border-neutral-200 font-mono text-[11px] space-y-1">
                        <div><strong className="text-neutral-500">Bank:</strong> Meezan Bank Ltd</div>
                        <div><strong className="text-neutral-500">Account Title:</strong> Burger O&apos;Clock Pvt Ltd</div>
                        <div><strong className="text-neutral-500">Raast ID:</strong> 03001234567</div>
                      </div>
                      <input
                        type="text"
                        name="transactionRef"
                        placeholder="Enter 6-digit Transaction Reference / TID *"
                        value={formData.transactionRef}
                        onChange={handleChange}
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-900 focus:border-[#F4C61A] outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[380px] shrink-0 sticky top-24">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-black text-black mb-4 pb-3 border-b border-neutral-100 uppercase tracking-wide">
                Order Summary
              </h2>

              <div className="max-h-56 overflow-y-auto divide-y divide-neutral-100 mb-4 pr-1">
                {items.map((item) => {
                  const itemKey = item.cartItemId || item._id || item.id;
                  const itemImage = getImageUrl(item.image);
                  return (
                    <div key={itemKey} className="py-2.5 flex items-start gap-3">
                      <div className="relative w-10 h-10 min-w-[40px] rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200 shrink-0">
                        <Image
                          src={itemImage}
                          alt={item.name}
                          fill
                          sizes="40px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-black truncate">{item.name}</h4>
                        <p className="text-[10px] font-semibold text-neutral-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-extrabold text-black whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-neutral-100 pt-4 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-neutral-900">
                    {deliveryFee === 0 ? (
                      <span className="font-black text-emerald-600 uppercase text-[10px]">Free</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>

                {taxConfig.isTaxEnabled && (
                  <div className="flex justify-between text-neutral-600">
                    <span>
                      {taxConfig.taxLabel || 'Sindh Sales Tax'} ({activeTaxRate}%)
                    </span>
                    <span className="font-bold text-neutral-900">{formatPrice(taxAmount)}</span>
                  </div>
                )}

                <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline text-sm font-black text-black">
                  <span className="uppercase tracking-wider">Total</span>
                  <span className="font-display text-2xl text-black">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                disabled={isPlacingOrder || isInitiatingPayment || isProcessingPayment || !formData.selectedAreaId}
                type="submit"
                className="w-full mt-6 bg-[#F4C61A] hover:bg-[#E0B210] text-black font-black py-4 rounded-xl shadow-md transition transform active:scale-98 uppercase tracking-wider text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPlacingOrder || isInitiatingPayment || isProcessingPayment
                  ? 'Processing Payment...'
                  : `Place Order • ${formatPrice(finalTotal)}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}