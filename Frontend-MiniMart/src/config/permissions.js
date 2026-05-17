export const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
};

export const ROLE_DEFAULT_ROUTE = {
  [ROLE.ADMIN]: "/",
  [ROLE.MANAGER]: "/",
  [ROLE.CASHIER]: "/pos",
};

export const buildMenuSections = (role, { pendingOrders = 0, lowStockCount = 0 } = {}) => {
  switch (role) {
    case ROLE.CASHIER:
      return [
        {
          id: "operations",
          title: "Operations",
          defaultOpen: true,
          items: [
            {
              label: "POS",
              icon: "fa-solid fa-fw fa-cash-register",
              path: "/pos",
            },
          ],
        },
      ];
    case ROLE.MANAGER:
      return [
        {
          id: "operations",
          title: "Operations",
          defaultOpen: true,
          items: [
            { label: "Dashboard", icon: "fa-solid fa-fw fa-gauge", path: "/" },
            {
              label: "POS",
              icon: "fa-solid fa-fw fa-cash-register",
              path: "/pos",
            },
          ],
        },
        {
          id: "people",
          title: "People",
          items: [
            {
              label: "Employees",
              icon: "fa-solid fa-fw fa-user-group",
              path: "/people/employees",
            },
          ],
        },
        {
          id: "finance",
          title: "Finance",
          items: [
            {
              label: "Expenses",
              icon: "fa-solid fa-fw fa-file-invoice-dollar",
              path: "/finance/expenses",
            },
          ],
        },
        {
          id: "reports",
          title: "Reports",
          headerBadge: pendingOrders ? `${pendingOrders}` : null,
          items: [
            {
              label: "Sales Summary",
              icon: "fa-solid fa-fw fa-chart-line",
              path: "/reports/sales",
              badge: pendingOrders ? `${pendingOrders}` : null,
            },
            {
              label: "Activity Log",
              icon: "fa-solid fa-fw fa-clipboard-list",
              path: "/reports/activity",
            },
          ],
        },
      ];
    case ROLE.ADMIN:
    default:
      return [
        {
          id: "operations",
          title: "Operations",
          defaultOpen: true,
          items: [
            { label: "Dashboard", icon: "fa-solid fa-fw fa-gauge", path: "/" },
            {
              label: "POS",
              icon: "fa-solid fa-fw fa-cash-register",
              path: "/pos",
            },
          ],
        },
        {
          id: "inventory",
          title: "Inventory",
          headerBadge: lowStockCount ? `${lowStockCount}` : null,
          items: [
            {
              label: "Inventory Overview",
              icon: "fa-solid fa-fw fa-warehouse",
              path: "/inventory",
            },
            {
              label: "Stock Levels",
              icon: "fa-solid fa-fw fa-layer-group",
              path: "/inventory/stock-levels",
            },
            {
              label: "Product Catalog",
              icon: "fa-solid fa-fw fa-box-open",
              path: "/inventory/products",
            },
            {
              label: "Categories",
              icon: "fa-solid fa-fw fa-tags",
              path: "/inventory/categories",
            },
          ],
        },
        {
          id: "purchasing",
          title: "Purchasing",
          items: [
            {
              label: "Suppliers",
              icon: "fa-solid fa-fw fa-truck-field",
              path: "/purchasing/suppliers",
            },
            {
              label: "Purchase Orders",
              icon: "fa-solid fa-fw fa-file-invoice",
              path: "/purchasing/purchase-orders",
            },
          ],
        },
        {
          id: "people",
          title: "People",
          items: [
            {
              label: "Employees",
              icon: "fa-solid fa-fw fa-user-group",
              path: "/people/employees",
            },
            {
              label: "User & Roles",
              icon: "fa-solid fa-fw fa-id-badge",
              path: "/people/users",
            },
          ],
        },
        {
          id: "finance",
          title: "Finance",
          items: [
            {
              label: "Expenses",
              icon: "fa-solid fa-fw fa-file-invoice-dollar",
              path: "/finance/expenses",
            },
          ],
        },
        {
          id: "reports",
          title: "Reports",
          headerBadge: pendingOrders ? `${pendingOrders}` : null,
          items: [
            {
              label: "Sales Summary",
              icon: "fa-solid fa-fw fa-chart-line",
              path: "/reports/sales",
              badge: pendingOrders ? `${pendingOrders}` : null,
            },
            {
              label: "Activity Log",
              icon: "fa-solid fa-fw fa-clipboard-list",
              path: "/reports/activity",
            },
          ],
        },
        {
          id: "settings",
          title: "Settings",
          items: [
            {
              label: "Branch Details",
              icon: "fa-solid fa-fw fa-shop",
              path: "/settings/branch",
            },
            {
              label: "Receipt Branding",
              icon: "fa-solid fa-fw fa-receipt",
              path: "/settings/receipts",
            },
          ],
        },
      ];
  }
};
