"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { useSelector, useDispatch } from "react-redux";
import { setIsCartOpen } from "@/redux/cart/cartSlice";
import { useLocation } from "@/context/LocationContext";
import { DISPLAY_PHONE, ORDER_PHONE } from "@/lib/site";
import styles from "./SiteHeader.module.css";

const drawerLinks = [
  { label: "Blogs", href: "#blogs", icon: "document" },
  { label: "Our Locations", href: "#locations", icon: "location" },
];

function DocumentIcon({ size = 19 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M7 3.75h7.25L19 8.5v11.75H7a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14 4v5h5M9 13h6M9 16.5h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ExternalLinkIcon({ size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M14 5h5v5M19 5l-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BellIcon({ size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 21h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const dispatch = useDispatch();

  // Pick calculated total quantity directly from state
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  
  const { selectedBranch, setIsLocationOpen } = useLocation();

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

      // Keep keyboard focus inside the open navigation drawer.
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusableElements = drawerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.brandGroup}>
            <Link
              aria-label="Burger O'Clock home"
              className={styles.logoLink}
              href="/"
            >
              <Image
                alt="Burger O'Clock"
                height={58}
                priority
                src="/images/brand/BurgerO'clock logo.webp"
                width={136}
              />
            </Link>

            <button
              aria-label={`Change delivery location. Current location: ${selectedBranch.name}`}
              className={styles.locationButton}
              onClick={() => setIsLocationOpen(true)}
              type="button"
            >
              <span className={styles.locationIcon}>
                <Icon name="location" size={15} strokeWidth={2.2} />
              </span>

              <span className={styles.locationCopy}>
                <small>Change location</small>
                <strong>{selectedBranch.name}</strong>
              </span>

              <Icon
                className={styles.locationChevron}
                name="chevronDown"
                size={14}
              />
            </button>

            <a
              aria-label={`Call Burger O'Clock at ${DISPLAY_PHONE}`}
              className={styles.phoneButton}
              href={`tel:${ORDER_PHONE}`}
            >
              <Icon name="phone" size={16} strokeWidth={2.1} />
              <span>{DISPLAY_PHONE}</span>
            </a>
          </div>

          <div className={styles.actionGroup}>
            <button
              aria-label={`Open cart with ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`}
              className={styles.cartButton}
              onClick={() => dispatch(setIsCartOpen(true))}
              type="button"
            >
              <Image
                alt=""
                aria-hidden="true"
                className={styles.cartImage}
                height={44}
                src="/images/brand/Cart-icon.webp"
                width={44}
              />
              <span className={styles.cartBadge}>{totalQuantity}</span>
            </button>

            <button
              aria-controls="site-navigation-drawer"
              aria-expanded={menuOpen}
              aria-label="Open website menu"
              className={styles.menuButton}
              onClick={() => setMenuOpen(true)}
              ref={menuButtonRef}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        aria-hidden={!menuOpen}
        className={`${styles.drawerLayer} ${menuOpen ? styles.drawerLayerOpen : ""}`}
      >
        <button
          aria-label="Close website menu"
          className={styles.drawerBackdrop}
          onClick={() => closeMenu()}
          tabIndex={-1}
          type="button"
        />

        <aside
          aria-labelledby="site-navigation-title"
          aria-modal="true"
          className={styles.drawer}
          id="site-navigation-drawer"
          ref={drawerRef}
          role="dialog"
        >
          <div className={styles.drawerHeader}>
            <h2 id="site-navigation-title">Burger O&apos;Clock</h2>

            <button
              aria-label="Close website menu"
              className={styles.closeButton}
              onClick={() => closeMenu()}
              ref={closeButtonRef}
              tabIndex={menuOpen ? 0 : -1}
              type="button"
            >
              <Icon name="close" size={19} strokeWidth={1.7} />
            </button>
          </div>

          <nav aria-label="Website menu" className={styles.drawerNavigation}>
            {drawerLinks.map((item) => (
              <a
                href={item.href}
                key={item.label}
                onClick={() => closeMenu()}
                tabIndex={menuOpen ? 0 : -1}
              >
                <span className={styles.drawerLinkIcon}>
                  {item.icon === "document" ? (
                    <DocumentIcon />
                  ) : (
                    <Icon name="location" size={19} strokeWidth={1.8} />
                  )}
                </span>

                <strong>{item.label}</strong>

                <span className={styles.externalIcon}>
                  <ExternalLinkIcon />
                </span>
              </a>
            ))}
          </nav>

          <button
            aria-label="Open notifications"
            className={styles.notificationButton}
            tabIndex={menuOpen ? 0 : -1}
            type="button"
          >
            <BellIcon />
          </button>

          <footer className={styles.drawerFooter}>
            <span>Powered By</span>
            <strong>indolj</strong>
          </footer>
        </aside>
      </div>
    </>
  );
}