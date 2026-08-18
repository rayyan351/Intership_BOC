// back-end/config/permissions.js
const PERMISSIONS = Object.freeze({
  // Orders
  ORDERS_READ: "orders:read",
  ORDERS_CREATE: "orders:create",
  ORDERS_UPDATE_STATUS: "orders:update_status",
  ORDERS_CANCEL: "orders:cancel",

  // POS / Cashier
  POS_ACCESS: "pos:access",

  // Inventory / Availability
  INVENTORY_TOGGLE_AVAILABILITY: "inventory:toggle_availability",

  // Reports
  REPORTS_BRANCH_VIEW: "reports:branch_view",
  REPORTS_ALL_VIEW: "reports:all_view",

  // Catalog (Super Admin default)
  CATALOG_MANAGE: "catalog:manage",

  // System & Staff
  STAFF_MANAGE: "staff:manage",
  BRANCH_MANAGE: "branch:manage",
  SETTINGS_MANAGE: "settings:manage",
});

const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  BRANCH_MANAGER: "branch_manager",
  BRANCH_STAFF: "branch_staff",
  KITCHEN_STAFF: "kitchen_staff",
});

// Default permission bundles for quick assignment
const ROLE_DEFAULT_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.BRANCH_MANAGER]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.INVENTORY_TOGGLE_AVAILABILITY,
    PERMISSIONS.REPORTS_BRANCH_VIEW,
  ],
  [ROLES.BRANCH_STAFF]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
    PERMISSIONS.POS_ACCESS,
  ],
  [ROLES.KITCHEN_STAFF]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
  ],
};

module.exports = {
  PERMISSIONS,
  ROLES,
  ROLE_DEFAULT_PERMISSIONS,
};