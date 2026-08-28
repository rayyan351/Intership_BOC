// src/app/(site)/track-order/page.jsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTrackOrderQuery, useCancelCustomerOrderMutation } from '@/services/orderApi';
import { formatPrice } from '@/lib/currency';
import { getImageUrl } from '@/config/site';

const STAGES = [
  { key: 'PENDING', label: 'Order Received', icon: '📝', desc: 'Sent to kitchen display' },
  { key: 'PREPARING', label: 'Kitchen Cooking', icon: '🔥', desc: 'Patties sizzling on grill' },
  { key: 'READY', label: 'Packed & Ready', icon: '🛍️', desc: 'Packaged fresh with sauces' },
  { key: 'ON_THE_WAY', label: 'Out for Delivery', icon: '🛵', desc: 'Rider is on the way' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🍔', desc: 'Enjoy your hot meal!' },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get('id') || '';

  const [inputVal, setInputVal] = useState(initialId);
  const [activeQueryId, setActiveQueryId] = useState(initialId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Placed by mistake');
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Delivery Arrival ETA Countdown state
  const [etaTimeLeft, setEtaTimeLeft] = useState({ minutes: 0, seconds: 0, isLate: false });

  useEffect(() => {
    if (initialId) {
      setInputVal(initialId);
      setActiveQueryId(initialId);
    }
  }, [initialId]);

  const {
    data: order,
    isLoading,
    isError,
  } = useTrackOrderQuery(activeQueryId, {
    skip: !activeQueryId,
    pollingInterval: 6000,
  });

  const [cancelOrder, { isLoading: isCancelling }] = useCancelCustomerOrderMutation();

  // 1. 5-Minute Grace Cancellation Timer
  useEffect(() => {
    if (!order || order.orderStatus !== 'PENDING') {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const orderCreatedAt = new Date(order.createdAt).getTime();
      const diffSeconds = Math.max(0, Math.floor((orderCreatedAt + 5 * 60 * 1000 - Date.now()) / 1000));
      setRemainingSeconds(diffSeconds);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [order]);

  // 2. Live Dynamic ETA Delivery Arrival Countdown
  useEffect(() => {
    if (!order || order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
      return;
    }

    const durationMinutes = order.estimatedDeliveryMinutes || 35;
    const targetTimestamp = new Date(order.createdAt).getTime() + durationMinutes * 60 * 1000;

    const calculateEta = () => {
      const difference = targetTimestamp - Date.now();

      if (difference <= 0) {
        setEtaTimeLeft({ minutes: 0, seconds: 0, isLate: true });
      } else {
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setEtaTimeLeft({ minutes, seconds, isLate: false });
      }
    };

    calculateEta();
    const interval = setInterval(calculateEta, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleSearch = (e) => {
    e.preventDefault();
    const clean = inputVal.trim().toUpperCase();
    if (!clean) return;
    setActiveQueryId(clean);
    router.replace(`/track-order?id=${clean}`);
  };

  const handleExecuteCancellation = async () => {
    try {
      await cancelOrder({
        id: order.orderNumber,
        reason: cancelReason,
      }).unwrap();
      setShowCancelModal(false);
    } catch (err) {
      alert(err?.data?.message || 'Failed to cancel order.');
    }
  };

  const getStageIndex = (status) => {
    if (!status) return 0;
    if (status === 'CANCELLED') return -1;
    const idx = STAGES.findIndex((s) => s.key === status);
    return idx !== -1 ? idx : 0;
  };

  const currentStageIdx = getStageIndex(order?.orderStatus);
  const isCancelled = order?.orderStatus === 'CANCELLED';
  const isDelivered = order?.orderStatus === 'DELIVERED';
  const canCancel = order?.orderStatus === 'PENDING' && remainingSeconds > 0;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#fcfcfb] min-h-screen py-10 sm:py-16 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-[min(900px,calc(100%-32px))] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-neutral-900 text-[11px] font-black uppercase tracking-widest bg-[#F4C61A]/20 px-3.5 py-1.5 rounded-full border border-[#F4C61A]/40 inline-block mb-3">
            Live Kitchen Tracking
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-neutral-900 uppercase tracking-wide">
            Track Your Order
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm font-medium mt-1">
            Enter your order number to track preparation and delivery progress.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-8 max-w-xl mx-auto">
          <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-neutral-200/90 shadow-sm focus-within:border-[#F4C61A] focus-within:ring-2 focus-within:ring-[#F4C61A]/20 transition">
            <input
              type="text"
              placeholder="e.g. BOC-20260828-1653"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-mono uppercase bg-transparent text-neutral-900 outline-none placeholder:normal-case placeholder:font-sans placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="bg-[#F4C61A] hover:bg-[#e5b713] text-neutral-950 font-black px-6 py-3 rounded-xl shadow-xs transition active:scale-98 uppercase tracking-wider text-xs whitespace-nowrap cursor-pointer"
            >
              Track Order
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-[#F4C61A] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
              Fetching kitchen status...
            </p>
          </div>
        )}

        {isError && activeQueryId && (
          <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm max-w-lg mx-auto">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="text-base font-black text-rose-800 uppercase tracking-wide">
              Order Not Found
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-1 mb-4">
              We couldn’t find an order matching <strong className="font-mono text-neutral-800">{activeQueryId}</strong>.
            </p>
            <Link
              href="/"
              className="inline-block bg-neutral-900 hover:bg-black text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Back to Menu
            </Link>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* Live Delivery Arrival Countdown Card */}
            {!isCancelled && !isDelivered && (
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                    🛵
                  </div>
                  <div>
                    <span className="text-[10.5px] font-black uppercase tracking-widest text-amber-600 block">
                      Live Delivery Arrival ETA
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight m-0">
                      {etaTimeLeft.isLate ? 'Rider Arriving Any Second' : 'Estimated Time Remaining'}
                    </h3>
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/80 px-6 py-2.5 rounded-2xl text-center min-w-[140px]">
                  {etaTimeLeft.isLate ? (
                    <span className="text-xs font-black uppercase text-amber-700">At Your Door</span>
                  ) : (
                    <div className="font-mono text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                      {String(etaTimeLeft.minutes).padStart(2, '0')}:{String(etaTimeLeft.seconds).padStart(2, '0')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stepper / Status Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200/90 shadow-sm">
              <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-neutral-100 mb-8">
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Order Tracking ID
                  </span>
                  <h2 className="font-mono text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                    {order.orderNumber}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Fulfilling Kitchen Outlet
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-neutral-800">
                    {order.branch?.name || 'Main Outlet'} ({order.branch?.city || 'Karachi'})
                  </span>
                </div>
              </div>

              {isCancelled ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-rose-50/50 border border-rose-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 text-2xl flex items-center justify-center mx-auto">
                    ✕
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black uppercase tracking-wide text-rose-950">
                      Order Cancelled
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
                      {order.cancelledBy === 'CUSTOMER'
                        ? 'You cancelled this order during the 5-minute grace window.'
                        : 'This order was cancelled by the branch kitchen.'}
                    </p>
                  </div>

                  {order.cancellationReason && (
                    <div className="p-3.5 bg-white rounded-2xl border border-rose-200 max-w-md mx-auto text-left shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-0.5">
                        Cancellation Note
                      </span>
                      <p className="text-xs text-neutral-800 font-medium m-0">
                        {order.cancellationReason}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-[11px] text-neutral-500">
                    If you have any questions, call our customer helpline at{' '}
                    <strong className="text-neutral-900">111 432 532</strong>.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4">
                  {STAGES.map((stg, idx) => {
                    const isPassed = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div
                        key={stg.key}
                        className={`flex sm:flex-col items-center sm:text-center gap-3.5 p-3 rounded-2xl transition ${
                          isCurrent
                            ? 'bg-amber-50/80 border-2 border-[#F4C61A] shadow-xs'
                            : isPassed
                            ? 'bg-slate-50/80 border border-slate-200/80'
                            : 'opacity-40 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                            isCurrent
                              ? 'bg-[#F4C61A] text-black font-bold shadow-2xs'
                              : isPassed
                              ? 'bg-emerald-500 text-white font-bold'
                              : 'bg-neutral-200 text-neutral-500'
                          }`}
                        >
                          {isPassed && !isCurrent ? '✓' : stg.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                            {stg.label}
                          </h4>
                          <p className="text-[10.5px] text-neutral-500 font-medium sm:mt-0.5 leading-tight">
                            {stg.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5-Minute Grace Window Cancellation Banner */}
              {canCancel && (
                <div className="mt-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <span className="text-xs font-bold text-amber-950 block">
                        Need to change your mind?
                      </span>
                      <span className="text-[11px] text-amber-800">
                        You have <strong className="font-mono">{formatTimer(remainingSeconds)}</strong> left to cancel before cooking begins.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-2xs"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>

            {/* Receipt Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-sm">
                <h3 className="font-display text-lg font-black text-neutral-900 uppercase tracking-wide mb-4 pb-3 border-b border-neutral-100">
                  Meal Items
                </h3>
                <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1">
                  {order.items?.map((item, idx) => {
                    const itemImage = getImageUrl(item.image);
                    return (
                      <div key={idx} className="py-3 flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 overflow-hidden shrink-0">
                          <Image
                            src={itemImage}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-neutral-900 truncate">{item.name}</h5>
                          <span className="text-[11px] text-neutral-500 font-semibold">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-neutral-900 font-mono">
                          {formatPrice(item.itemTotal || item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-5 p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-black text-neutral-900 uppercase tracking-wide mb-4 pb-3 border-b border-neutral-100">
                    Delivery Details
                  </h3>
                  <div className="space-y-2.5 text-xs text-neutral-600 mb-6">
                    <div>
                      <span className="text-neutral-400 font-bold uppercase text-[10px] block">Customer:</span>
                      <strong className="text-neutral-900">{order.customer?.name}</strong> ({order.customer?.phone})
                    </div>
                    <div>
                      <span className="text-neutral-400 font-bold uppercase text-[10px] block">Address:</span>
                      <span className="text-neutral-800 font-medium">{order.customer?.address}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-bold uppercase text-[10px] block">Payment:</span>
                      <span className="font-bold text-neutral-900">
                        {order.paymentMethod === 'CARD'
                          ? order.paymentStatus === 'REFUNDED'
                            ? 'Visa / Mastercard (Refunded)'
                            : 'Visa / Mastercard (Paid)'
                          : order.paymentStatus === 'VOID'
                          ? 'Cash on Delivery (Void)'
                          : 'Cash on Delivery (COD)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>

                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount ({order.couponCode || 'Promo'}):</span>
                      <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-500">
                    <span>Delivery Fee:</span>
                    <span className="text-emerald-600 font-bold uppercase text-[10px]">
                      {order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}
                    </span>
                  </div>

                  {(order.taxAmount > 0 || (order.totalAmount - (order.subtotal + (order.deliveryFee || 0) - (order.discountAmount || 0))) > 0) && (
                    <div className="flex justify-between text-neutral-500">
                      <span>
                        Tax / SST {order.taxRate ? `(${order.taxRate}%)` : ''}:
                      </span>
                      <span>
                        {formatPrice(
                          order.taxAmount ??
                          (order.totalAmount - (order.subtotal + (order.deliveryFee || 0) - (order.discountAmount || 0)))
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-black text-neutral-900 pt-2.5 border-t border-neutral-200">
                    <span className="font-sans uppercase">Total:</span>
                    <span className="font-display text-xl">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-neutral-200">
              <h3 className="font-display text-xl font-black text-neutral-900 uppercase tracking-wide mb-2">
                Cancel Order?
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Are you sure you want to cancel order <strong className="font-mono text-neutral-800">{order?.orderNumber}</strong>?
              </p>

              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 mb-6 outline-none focus:border-[#F4C61A]"
              >
                <option value="Placed by mistake">Placed by mistake</option>
                <option value="Wrong delivery address entered">Wrong delivery address entered</option>
                <option value="Change of mind / Not hungry">Change of mind / Not hungry</option>
                <option value="Taking too long to confirm">Taking too long to confirm</option>
              </select>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleExecuteCancellation}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-60 cursor-pointer"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfcfb] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#F4C61A] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}