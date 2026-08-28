// src/config/site.js

export const siteConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const SITE_NAME = "Burger O'Clock";
export const ORDER_PHONE = "021111432532";
export const DISPLAY_PHONE = "021 111 432 532";
export const FEEDBACK_EMAIL = "feedback@burgeroclock.pk";

/**
 * Universal image URL resolver that fixes localhost/relative paths for production
 */
export const getImageUrl = (path) => {
  if (!path) return "/images/brand/BurgerO'clock logo.webp";
  
  // If it's already an external absolute URL (like Cloudinary or another host)
  if (path.startsWith("http://") || path.startsWith("https://")) {
    // If it's pointing to old local backend, replace with live Render URL
    if (path.includes("localhost:5000")) {
      return path.replace("http://localhost:5000", "https://burgeroclock.onrender.com");
    }
    return path;
  }

  // Derive root backend domain from NEXT_PUBLIC_API_URL (removes trailing '/api')
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const backendHost = apiUrl.replace(/\/api\/?$/, '');

  // Ensure proper leading slash for relative paths
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${backendHost}${cleanPath}`;
};