// src/config/site.js

export const siteConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const SITE_NAME = "Burger O'Clock";
export const ORDER_PHONE = "021111432532";
export const DISPLAY_PHONE = "021 111 432 532";
export const FEEDBACK_EMAIL = "feedback@burgeroclock.pk";

export const DEFAULT_IMAGE = "/images/brand/BurgerO'clock logo.webp";

/**
 * Resolves any stored image reference to a URL the browser can load.
 *
 * Everything backend-hosted is returned HOST-RELATIVE (`/uploads/...`) on
 * purpose. `next.config.mjs` rewrites `/uploads/*` to the backend, so the
 * browser only ever talks to its own origin. That means:
 *   - no CORS on images
 *   - no `remotePatterns` entry needed for whichever host the backend is on
 *   - the same DB row works in dev and production, with no data migration
 *
 * Historical rows in Mongo contain absolute `http://localhost:5000/uploads/...`
 * URLs, written by an older version of the backend. Those are normalized back
 * down to a relative path here rather than being rewritten host-for-host.
 * External URLs (Cloudinary, Unsplash) are passed through untouched.
 */
export const getImageUrl = (path) => {
  if (!path) return DEFAULT_IMAGE;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    // Any absolute URL that points at an /uploads path is backend-hosted,
    // whatever host it names. Strip the origin and let the rewrite handle it.
    const uploadsAt = path.indexOf("/uploads/");
    if (uploadsAt !== -1) return path.slice(uploadsAt);

    // Genuinely external (Cloudinary, Unsplash, etc.)
    return path;
  }

  return path.startsWith("/") ? path : `/${path}`;
};
