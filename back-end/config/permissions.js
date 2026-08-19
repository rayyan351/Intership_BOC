// back-end/config/permissions.js

const SYSTEM_MODULES = [
  {
    key: 'dashboard',
    title: 'Dashboard & Metrics',
    description: 'Overview, branch sales analytics, and order reports',
    icon: 'DashboardOutlined',
    resources: [
      {
        resource: 'Main Overview',
        description: 'Revenue totals, live orders summary, and sales charts',
        actions: [
          { key: 'dashboard:view', label: 'View Analytics', type: 'view' },
        ],
      },
    ],
  },
  {
    key: 'orders',
    title: 'Order Management',
    description: 'Live order pipeline, POS creation, kitchen tracking, and cancellations',
    icon: 'ShoppingOutlined',
    resources: [
      {
        resource: 'Live Orders & POS',
        description: 'Manage dine-in, takeaway, and delivery orders',
        actions: [
          { key: 'orders:view', label: 'View Queue', type: 'view' },
          { key: 'orders:create', label: 'Create Order (POS)', type: 'create' },
          { key: 'orders:update_status', label: 'Update Status', type: 'edit' },
          { key: 'orders:cancel', label: 'Cancel / Refund', type: 'delete' },
        ],
      },
    ],
  },
  {
    key: 'products',
    title: 'Products & Catalog Menu',
    description: 'Categories, combos, display rows, product pricing, and stock switches',
    icon: 'AppstoreOutlined',
    resources: [
      {
        resource: 'Categories',
        description: 'Main product categories',
        actions: [
          { key: 'categories:view', label: 'View', type: 'view' },
          { key: 'categories:create', label: 'Add', type: 'create' },
          { key: 'categories:edit', label: 'Edit', type: 'edit' },
          { key: 'categories:delete', label: 'Delete', type: 'delete' },
          { key: 'categories:toggle_status', label: 'Toggle Active', type: 'special' },
        ],
      },
      {
        resource: 'Deal Categories',
        description: 'Categories reserved for promotional deals and bundles',
        actions: [
          { key: 'dealcategories:view', label: 'View', type: 'view' },
          { key: 'dealcategories:create', label: 'Add', type: 'create' },
          { key: 'dealcategories:edit', label: 'Edit', type: 'edit' },
          { key: 'dealcategories:delete', label: 'Delete', type: 'delete' },
          { key: 'dealcategories:toggle_status', label: 'Toggle Active', type: 'special' },
        ],
      },
      {
        resource: 'Display Sections',
        description: 'Homepage featured rows and meal collections',
        actions: [
          { key: 'sections:view', label: 'View', type: 'view' },
          { key: 'sections:create', label: 'Add', type: 'create' },
          { key: 'sections:edit', label: 'Edit', type: 'edit' },
          { key: 'sections:delete', label: 'Delete', type: 'delete' },
        ],
      },
      {
        resource: 'All Products',
        description: 'Menu food items, price modifications, and variants',
        actions: [
          { key: 'products:view', label: 'View Items', type: 'view' },
          { key: 'products:create', label: 'Add Item', type: 'create' },
          { key: 'products:edit', label: 'Edit Item', type: 'edit' },
          { key: 'products:delete', label: 'Delete Item', type: 'delete' },
          { key: 'products:toggle_stock', label: 'Toggle In/Out of Stock', type: 'special' },
        ],
      },
      {
        resource: 'Deals & Bundles',
        description: 'Combo meals, dynamic deals, and family packages',
        actions: [
          { key: 'deals:view', label: 'View Deals', type: 'view' },
          { key: 'deals:create', label: 'Add Deal', type: 'create' },
          { key: 'deals:edit', label: 'Edit Deal', type: 'edit' },
          { key: 'deals:delete', label: 'Delete Deal', type: 'delete' },
          { key: 'deals:toggle_status', label: 'Toggle Active', type: 'special' },
        ],
      },
    ],
  },
  {
    key: 'banners',
    title: 'Hero Banners',
    description: 'Promotional slider banners across web and mobile storefronts',
    icon: 'PictureOutlined',
    resources: [
      {
        resource: 'Homepage Sliders',
        description: 'Top promotional sliders',
        actions: [
          { key: 'banners:view', label: 'View', type: 'view' },
          { key: 'banners:create', label: 'Upload', type: 'create' },
          { key: 'banners:edit', label: 'Edit / Reorder', type: 'edit' },
          { key: 'banners:delete', label: 'Delete', type: 'delete' },
        ],
      },
    ],
  },
  {
    key: 'branch_operations',
    title: 'Branch Operations',
    description: 'Outlets, GPS locations, employee credentials, and role matrices',
    icon: 'BankOutlined',
    resources: [
      {
        resource: 'Store Outlets',
        description: 'Branch locations, GPS pins, and delivery radii',
        actions: [
          { key: 'locations:view', label: 'View Outlets', type: 'view' },
          { key: 'locations:create', label: 'Add Outlet', type: 'create' },
          { key: 'locations:edit', label: 'Edit Outlet', type: 'edit' },
          { key: 'locations:delete', label: 'Delete Outlet', type: 'delete' },
        ],
      },
      {
        resource: 'Staff Accounts',
        description: 'Branch employees and access credentials',
        actions: [
          { key: 'staff:view', label: 'View Staff', type: 'view' },
          { key: 'staff:create', label: 'Add Staff', type: 'create' },
          { key: 'staff:edit', label: 'Edit Staff', type: 'edit' },
          { key: 'staff:delete', label: 'Delete Staff', type: 'delete' },
          { key: 'staff:toggle_active', label: 'Suspend / Activate', type: 'special' },
        ],
      },
      {
        resource: 'Roles & Matrix',
        description: 'System roles and permission assignments',
        actions: [
          { key: 'roles:view', label: 'View Roles', type: 'view' },
          { key: 'roles:create', label: 'Add Role', type: 'create' },
          { key: 'roles:edit', label: 'Edit / Toggle Matrix', type: 'edit' },
          { key: 'roles:delete', label: 'Delete Role', type: 'delete' },
        ],
      },
    ],
  },
  {
    key: 'settings',
    title: 'Brand & SEO Settings',
    description: 'Logos, SEO tab title, favicon, and franchise identity',
    icon: 'SettingOutlined',
    resources: [
      {
        resource: 'Brand Identity',
        description: 'Store metadata and logos',
        actions: [
          { key: 'settings:view', label: 'View Settings', type: 'view' },
          { key: 'settings:edit', label: 'Save Changes', type: 'edit' },
        ],
      },
    ],
  },
];

module.exports = { SYSTEM_MODULES };