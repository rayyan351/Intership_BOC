// src/components/ui/Icons.js

export function Icon({ name, size = 20, strokeWidth = 2, className = "" }) {
  const paths = {
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.4 10.3a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 2-1.6L21 7H7" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    chevronDown: (
      <>
        <path d="m7 10 5 5 5-5" />
      </>
    ),
    chevronLeft: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    chevronRight: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    arrowUp: (
      <>
        <path d="m18 15-6-6-6 6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    minus: (
      <>
        <path d="M5 12h14" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    products: (
      <>
        <path d="m7.5 4.3 9 5.2v10.4l-9-5.2V4.3Z" />
        <path d="m16.5 9.5 4-2.3v10.4l-4 2.3M7.5 4.3l4-2.3 9 5.2-4 2.3" />
      </>
    ),
    categories: (
      <>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </>
    ),
    banners: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 15 5-5 4 4 3-3 6 6" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h12l2 4-2 14H6L4 7l2-4Z" />
        <path d="M4 7h16M9 11v6M15 11v6" />
      </>
    ),
    branches: (
      <>
        <path d="M4 21V8l8-5 8 5v13M9 21v-8h6v8M7 10h.01M17 10h.01" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
      </>
    ),
    document: (
      <>
        <path d="M7 3.75h7.25L19 8.5v11.75H7a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z" />
        <path d="M14 4v5h5M9 13h6M9 16.5h6" />
      </>
    ),
    externalLink: (
      <>
        <path d="M14 5h5v5M19 5l-8 8" />
        <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
        <path d="M10 21h4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.menu}
    </svg>
  );
}