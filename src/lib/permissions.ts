export const PERMISSIONS = {
  DASHBOARD: "dashboard",
  CUSTOMERS: "customers",
  CATEGORIES: "categories",
  ITEMS: "items",
  SUPPLIERS: "suppliers",
  INCOMING_ORDERS: "incoming_orders",
  OUTGOING_ORDERS: "outgoing_orders",
  INVENTORY: "inventory",
  TREASURY: "treasury",
  USERS: "users",
  SETTINGS: "settings",
  REPORTS: "reports",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(
  userPermissions: any,
  permission: Permission
): boolean {
  if (!userPermissions || typeof userPermissions !== "object") return false;
  return userPermissions[permission] === true;
}

export const DEFAULT_PERMISSIONS = {
  ADMIN: {
    dashboard: true,
    customers: true,
    categories: true,
    items: true,
    suppliers: true,
    incoming_orders: true,
    outgoing_orders: true,
    inventory: true,
    treasury: true,
    users: true,
    settings: true,
    reports: true,
  },
  MANAGER: {
    dashboard: true,
    customers: true,
    categories: true,
    items: true,
    suppliers: true,
    incoming_orders: true,
    outgoing_orders: true,
    inventory: true,
    treasury: false,
    users: false,
    settings: false,
    reports: true,
  },
  USER: {
    dashboard: true,
    customers: true,
    categories: false,
    items: false,
    suppliers: false,
    incoming_orders: false,
    outgoing_orders: true,
    inventory: true,
    treasury: false,
    users: false,
    settings: false,
    reports: false,
  },
};
