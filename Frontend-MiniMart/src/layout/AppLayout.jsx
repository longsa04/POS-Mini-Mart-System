import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Menu from "./menu/Menu";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const SIDEBAR_PREFERENCE_KEY = "minimart-sidebar-collapsed";

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === "true";
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.username ?? "User";
  const displayRole = user?.role ?? "";
  const roleLabel = displayRole
    ? displayRole.charAt(0) + displayRole.slice(1).toLowerCase()
    : "";

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      SIDEBAR_PREFERENCE_KEY,
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="app">
      <div className="app-shell d-flex">
        <div
          id="app-sidebar"
          className={`app-menu${isMenuOpen ? " is-open" : ""}${
            isSidebarCollapsed ? " is-collapsed" : ""
          }`}
        >
          <Menu
            role={user?.role}
            onNavigate={closeMenu}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
        <div className="content d-block">
          <div
            className={`app-menu-overlay${isMenuOpen ? " is-open" : ""}`}
            onClick={closeMenu}
            aria-hidden="true"
          ></div>
          <div className="app-header px-3">
            <div className="app-header-inner">
              <div className="app-header-actions">
                <button
                  type="button"
                  className="menu-btn fs-5 pointer"
                  onClick={toggleMenu}
                  aria-expanded={isMenuOpen}
                  aria-controls="app-sidebar"
                  aria-label="Toggle menu"
                >
                  <i className="fa-solid fa-bars"></i>
                </button>
                <button
                  type="button"
                  className="sidebar-collapse-btn"
                  onClick={toggleSidebarCollapse}
                  aria-expanded={!isSidebarCollapsed}
                  aria-controls="app-sidebar"
                  aria-label={
                    isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                  title={
                    isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                >
                  <i
                    className={`fa-solid ${
                      isSidebarCollapsed ? "fa-angles-right" : "fa-angles-left"
                    }`}
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
              <div className="app-defualt-user d-flex align-items-center gap-3">
                <div className="d-block text-end">
                  <div className="fw-semibold">{displayName}</div>
                  <div className="text-secondary font-12 text-uppercase">
                    {roleLabel}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
          <div className="app-page p-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
