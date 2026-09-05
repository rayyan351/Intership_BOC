// src/app/(site)/_components/layout/SiteHeader.js
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { useSelector, useDispatch } from "react-redux";
import { setIsCartOpen } from "@/redux/cart/cartSlice";
import { useLocation } from "@/context/LocationContext";
import { openLocationModal } from "@/redux/location/locationSlice";
import { DISPLAY_PHONE, ORDER_PHONE } from "@/lib/site";
import { getImageUrl } from "@/config/site";

const drawerLinks = [
  { label: "Blogs", href: "#blogs", icon: "document" },
  { label: "Our Locations", href: "#locations", icon: "location" },
];

export function SiteHeader({
  storeLogo,
  storeName = "Burger O'Clock",
}) {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const dispatch = useDispatch();

  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  const reduxLocation = useSelector((state) => state.location?.selectedLocation);
  const { selectedBranch, setIsLocationOpen } = useLocation ? useLocation() : {};

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLocationName = mounted
    ? reduxLocation?.areaName ||
      reduxLocation?.name ||
      selectedBranch?.areaName ||
      selectedBranch?.name ||
      "Select Area"
    : "Select Area";

  const handleOpenLocationDialog = () => {
    if (typeof setIsLocationOpen === "function") {
      setIsLocationOpen(true);
    }
    dispatch(openLocationModal());
  };

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenuOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusableElements = drawerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, menuOpen]);

const resolvedLogo = storeLogo
    ? getImageUrl(storeLogo)
    : "/images/brand/BurgerO'clock logo.webp";

  return (
    <>
      <header className="relative min-h-[102px] sm:min-h-[136px] -mb-[18px] sm:-mb-[36px] rounded-b-[28px] sm:rounded-b-[46px] bg-black text-white overflow-hidden">
        <div className="flex w-[calc(100%-24px)] md:w-[min(100%-32px,1120px)] lg:w-[min(1120px,calc(100%-48px))] min-h-[84px] sm:min-h-[100px] items-center justify-between gap-2 md:gap-7 mx-auto">
          {/* Brand Group */}
          <div className="flex items-center min-w-0 gap-[7px] sm:gap-3">
            <Link
              aria-label={`${storeName} home`}
              className="inline-flex shrink-0 no-underline"
              href="/"
            >
              <div className="relative w-[92px] min-[430px]:w-[100px] sm:w-[120px] h-[42px] sm:h-[52px]">
                <Image
                  alt={storeName}
                  fill
                  priority
                  src={resolvedLogo}
                  sizes="(max-width: 640px) 100px, 120px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            {/* Location Selector */}
            <button
              aria-label={`Change delivery location. Current location: ${activeLocationName}`}
              className="grid min-h-[38px] sm:min-h-[40px] max-w-[110px] min-[430px]:max-w-[132px] sm:max-w-none sm:min-w-[176px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[7px] px-[7px] sm:pl-2 sm:pr-3 py-[5px] text-left border border-[#F4C61A] rounded-full bg-transparent text-[#F4C61A] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#F4C61A] hover:text-black group cursor-pointer"
              onClick={handleOpenLocationDialog}
              type="button"
            >
              <span className="grid w-[22px] h-[22px] sm:w-6 sm:h-6 place-items-center rounded-full bg-current shrink-0">
                <span className="text-black group-hover:text-black flex items-center justify-center">
                  <Icon name="location" size={15} strokeWidth={2.2} />
                </span>
              </span>

              <span className="grid min-w-0 leading-[1.02]">
                <small className="hidden sm:block text-[0.65rem] font-extrabold tracking-[0.015em] normal-case text-inherit">
                  Delivery Area
                </small>
                <strong className="max-w-[58px] min-[430px]:max-w-[76px] sm:max-w-[115px] sm:mt-[3px] truncate text-[0.67rem] sm:text-[0.7rem] font-extrabold text-inherit">
                  {activeLocationName}
                </strong>
              </span>

              <span className="hidden sm:inline-flex shrink-0">
                <Icon name="chevronDown" size={14} />
              </span>
            </button>

            {/* Phone Button */}
            <a
              aria-label={`Call ${storeName} at ${DISPLAY_PHONE}`}
              className="hidden min-[680px]:inline-flex items-center gap-[7px] min-h-[40px] px-3 border border-[#F4C61A] rounded-full bg-transparent text-[#F4C61A] text-[0.7rem] font-extrabold whitespace-nowrap transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#F4C61A] hover:text-black no-underline"
              href={`tel:${ORDER_PHONE}`}
            >
              <Icon name="phone" size={16} strokeWidth={2.1} />
              <span className="hidden md:inline">{DISPLAY_PHONE}</span>
            </a>
          </div>

          {/* Action Group */}
          <div className="flex items-center shrink-0 gap-[2px] sm:gap-[7px]">
            {/* Cart Trigger */}
            <button
              aria-label={`Open cart with ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`}
              className="relative grid place-items-center w-[43px] h-[43px] sm:w-12 sm:h-12 shrink-0 p-0 rounded-full bg-transparent transition-transform duration-200 hover:-translate-y-[2px] cursor-pointer"
              onClick={() => dispatch(setIsCartOpen(true))}
              type="button"
            >
              <Image
                alt=""
                aria-hidden="true"
                className="w-[39px] h-[39px] sm:w-11 sm:h-11 object-contain"
                height={44}
                src="/images/brand/Cart-icon.webp"
                width={44}
              />
              <span className="absolute -top-[2px] sm:-top-[1px] -left-[2px] sm:-left-[1px] grid place-items-center min-w-[18px] h-[18px] px-1 border-2 border-black rounded-full bg-[#F4C61A] text-black text-[0.61rem] font-black leading-none">
                {mounted ? totalQuantity : 0}
              </span>
            </button>

            {/* Hamburger Button */}
            <button
              aria-controls="site-navigation-drawer"
              aria-expanded={menuOpen}
              aria-label="Open website menu"
              className="group grid place-content-center w-9 h-[42px] sm:w-10 sm:h-11 shrink-0 p-0 rounded-full bg-transparent gap-[5px] cursor-pointer"
              onClick={() => setMenuOpen(true)}
              ref={menuButtonRef}
              type="button"
            >
              <span className="block w-[22px] sm:w-6 h-[2px] rounded-full bg-[#F4C61A] transition-all duration-200" />
              <span className="block w-4 sm:w-[18px] h-[2px] rounded-full bg-[#F4C61A] justify-self-end transition-all duration-200 group-hover:w-[22px] sm:group-hover:w-6" />
              <span className="block w-[22px] sm:w-6 h-[2px] rounded-full bg-[#F4C61A] transition-all duration-200" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer Layer */}
      <div
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-[500] transition-[visibility,opacity] duration-300 ${
          menuOpen ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <button
          aria-label="Close website menu"
          className="absolute inset-0 w-full h-full p-0 bg-black/40 backdrop-blur-[7px] transition-opacity duration-200"
          onClick={() => closeMenu()}
          tabIndex={-1}
          type="button"
        />

        <aside
          aria-labelledby="site-navigation-title"
          aria-modal="true"
          className={`absolute top-1 right-0 flex flex-col w-[min(312px,calc(100%-56px))] h-[calc(100dvh-4px)] overflow-hidden bg-white text-[#101010] shadow-[-24px_0_70px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? "translate-x-0" : "translate-x-[102%]"
          }`}
          id="site-navigation-drawer"
          ref={drawerRef}
          role="dialog"
        >
          <div className="flex items-center justify-between min-h-[64px] px-3.5 py-2 border-b border-[#eeeeee]">
            <h2 id="site-navigation-title" className="m-0 text-[0.88rem] font-bold tracking-[-0.015em] text-[#101010]">
              {storeName}
            </h2>

            <button
              aria-label="Close website menu"
              className="grid place-items-center w-9 h-9 border border-[#eeeeee] rounded-full bg-white text-[#111111] shadow-[0_3px_12px_rgba(0,0,0,0.05)] transition-all duration-200 hover:rotate-6 hover:bg-[#f6f6f6]"
              onClick={() => closeMenu()}
              ref={closeButtonRef}
              tabIndex={menuOpen ? 0 : -1}
              type="button"
            >
              <Icon name="close" size={19} strokeWidth={1.7} />
            </button>
          </div>

          <nav aria-label="Website menu" className="grid gap-2 p-3">
            {drawerLinks.map((item) => (
              <a
                href={item.href}
                key={item.label}
                onClick={() => closeMenu()}
                tabIndex={menuOpen ? 0 : -1}
                className="grid grid-cols-[24px_minmax(0,1fr)_20px] items-center gap-2 min-h-[44px] px-[11px] rounded-[11px] bg-[#f8f8f8] text-[#171717] transition-all duration-200 hover:-translate-x-[2px] hover:bg-[#f1f1f1] hover:text-[#171717] no-underline"
              >
                <span className="grid place-items-center text-[#171717]">
                  <Icon name={item.icon} size={19} strokeWidth={1.8} />
                </span>

                <strong className="text-[0.82rem] font-medium">{item.label}</strong>

                <span className="grid place-items-center text-[#777777]">
                  <Icon name="externalLink" size={18} strokeWidth={1.8} />
                </span>
              </a>
            ))}
          </nav>

          <footer className="flex items-center justify-center gap-[7px] min-h-[52px] mt-auto pr-[52px] pl-4 pb-2 pt-2 text-[0.66rem] text-[#4e4e4e]">
            <span>Powered By</span>
            <strong className="text-[0.8rem] font-bold text-[#1d1d1d] underline underline-offset-[3px] decoration-[#cfcfcf]">
              indolj
            </strong>
          </footer>
        </aside>
      </div>
    </>
  );
}