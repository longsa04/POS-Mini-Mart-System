import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./layout/page/dashboard/Dashboard";
import Products from "./layout/page/inventory/Products";
import InventoryOverview from "./layout/page/inventory/InventoryOverview";
import StockLevels from "./layout/page/inventory/StockLevels";
import Categories from "./layout/page/inventory/Categories";
import Pos from "./layout/page/pos/Pos";
import Reports from "./layout/page/reports/Reports";
import ActivityLog from "./layout/page/admin/ActivityLog";
import Users from "./layout/page/admin/Users";
import Employees from "./layout/page/people/Employee";
import Customers from "./layout/page/customers/Customers";
import Suppliers from "./layout/page/purchasing/Suppliers";
import PurchaseOrders from "./layout/page/purchasing/PurchaseOrders";
import BranchSettings from "./layout/page/settings/BranchSettings";
import ReceiptBranding from "./layout/page/settings/ReceiptBranding";
import Expenses from "./layout/page/finance/Expenses";
import Login from "./layout/page/auth/Login";
import Unauthorized from "./layout/page/auth/Unauthorized";
import AppLayout from "./layout/AppLayout";
import RequireRole from "./components/auth/RequireRole";
import { useAuth } from "./context/AuthContext";
import { ROLE, ROLE_DEFAULT_ROUTE } from "./config/permissions";

const ProtectedLayout = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
};

const withRole = (Component, roles) => (
  <RequireRole allowedRoles={roles}>
    <Component />
  </RequireRole>
);

function App() {
  const { user } = useAuth();
  const redirectTarget = user ? ROLE_DEFAULT_ROUTE[user.role] ?? "/" : "/login";

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={redirectTarget} replace /> : <Login />}
      />
      <Route element={<ProtectedLayout />}>
        <Route
          path="/"
          element={withRole(Dashboard, [ROLE.ADMIN, ROLE.MANAGER])}
        />
        <Route path="/cash-register" element={<Navigate to="/pos" replace />} />
        <Route
          path="/pos"
          element={withRole(Pos, [ROLE.ADMIN, ROLE.MANAGER, ROLE.CASHIER])}
        />
        <Route
          path="/inventory"
          element={withRole(InventoryOverview, [ROLE.ADMIN])}
        />
        <Route
          path="/inventory/products"
          element={withRole(Products, [ROLE.ADMIN])}
        />
        <Route
          path="/inventory/stock-levels"
          element={withRole(StockLevels, [ROLE.ADMIN])}
        />
        <Route
          path="/inventory/categories"
          element={withRole(Categories, [ROLE.ADMIN])}
        />
        <Route
          path="/reports"
          element={withRole(Reports, [ROLE.ADMIN, ROLE.MANAGER])}
        />
        <Route
          path="/reports/sales"
          element={withRole(Reports, [ROLE.ADMIN, ROLE.MANAGER])}
        />
        <Route
          path="/reports/activity"
          element={withRole(ActivityLog, [ROLE.ADMIN, ROLE.MANAGER])}
        />
        <Route
          path="/people/employees"
          element={withRole(Employees, [ROLE.ADMIN, ROLE.MANAGER])}
        />
        <Route path="/people/users" element={withRole(Users, [ROLE.ADMIN])} />
        <Route
          path="/people/customers"
          element={withRole(Customers, [ROLE.ADMIN, ROLE.MANAGER])}
        />
        <Route
          path="/purchasing/suppliers"
          element={withRole(Suppliers, [ROLE.ADMIN])}
        />
        <Route
          path="/purchasing/purchase-orders"
          element={withRole(PurchaseOrders, [ROLE.ADMIN])}
        />
        <Route
          path="/finance/expenses"
          element={withRole(Expenses, [ROLE.ADMIN, ROLE.MANAGER])}
        />
        <Route
          path="/settings"
          element={withRole(BranchSettings, [ROLE.ADMIN])}
        />
        <Route
          path="/settings/branch"
          element={withRole(BranchSettings, [ROLE.ADMIN])}
        />
        <Route
          path="/settings/receipts"
          element={withRole(ReceiptBranding, [ROLE.ADMIN])}
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>
      <Route path="*" element={<Navigate to={redirectTarget} replace />} />
    </Routes>
  );
}

export default App;
