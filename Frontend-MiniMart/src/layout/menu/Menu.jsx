import "./menu.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchOrders } from "../../api/orders";
import { fetchStockLevels } from "../../api/inventory";
import miniMartLogo from "../../assets/mini-mart-mark.svg";
import { ROLE, ROLE_DEFAULT_ROUTE, buildMenuSections } from "../../config/permissions";

const LOW_STOCK_THRESHOLD = 15;

const Menu = ({
  role = ROLE.ADMIN,
  onNavigate,
  isCollapsed = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    const shouldLoadOrders = role === ROLE.ADMIN || role === ROLE.MANAGER;
    const shouldLoadStock = role === ROLE.ADMIN;

    if (!shouldLoadOrders && !shouldLoadStock) {
      setPendingOrders(0);
      setLowStockCount(0);
      return () => controller.abort();
    }

    const loadIndicators = async () => {
      try {
        const [ordersData, stockData] = await Promise.all([
          shouldLoadOrders
            ? fetchOrders({ signal: controller.signal }).catch(() => [])
            : Promise.resolve([]),
          shouldLoadStock
            ? fetchStockLevels({ signal: controller.signal }).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        const pending = (ordersData ?? []).filter((order) => {
          const status = String(order?.paymentStatus ?? "").toUpperCase();
          return status !== "PAID";
        }).length;

        const lowStock = (stockData ?? []).filter((item) => {
          const qty = Number(item?.quantity ?? 0);
          return Number.isFinite(qty) && qty <= LOW_STOCK_THRESHOLD;
        }).length;

        setPendingOrders(pending);
        setLowStockCount(lowStock);
      } catch (error) {
        if (error.name !== "AbortError") {
          setPendingOrders(0);
          setLowStockCount(0);
        }
      }
    };

    loadIndicators();

    return () => controller.abort();
  }, [role]);

  const menuSections = useMemo(
    () => buildMenuSections(role ?? ROLE.ADMIN, { pendingOrders, lowStockCount }),
    [role, pendingOrders, lowStockCount]
  );

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      menuSections.forEach((section) => {
        if (typeof next[section.id] === "undefined") {
          next[section.id] = Boolean(section.defaultOpen);
        }
      });
      return next;
    });
  }, [menuSections]);

  useEffect(() => {
    const activeSection = menuSections.find((section) =>
      section.items.some((item) => {
        if (item.path === "/") {
          return location.pathname === "/";
        }
        return (
          location.pathname === item.path ||
          location.pathname.startsWith(item.path + "/")
        );
      })
    );

    if (activeSection) {
      setOpenSections((prev) => {
        const next = {};
        menuSections.forEach((section) => {
          next[section.id] = false;
        });
        next[activeSection.id] = true;
        return next;
      });
    }
  }, [location.pathname, menuSections]);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => {
      const isCurrentlyOpen = Boolean(prev[sectionId]);
      const next = {};
      menuSections.forEach((section) => {
        next[section.id] = false;
      });
      next[sectionId] = !isCurrentlyOpen;
      return next;
    });
  };

  const defaultPath = ROLE_DEFAULT_ROUTE[role] ?? "/";

  const handleClick = (path) => {
    navigate(path);
    if (onNavigate) {
      onNavigate();
    }
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <nav
      className={`menu-compact${isCollapsed ? " is-collapsed" : ""}`}
      aria-label="Mini Mart navigation"
    >
      <div className="menu-topbar">
        <button
          type="button"
          className="app-logo p-2"
          onClick={() => handleClick(defaultPath)}
          aria-label="Go to dashboard"
        >
          <span className="menu-brand-mark" aria-hidden="true">
            <img
              src={miniMartLogo}
              alt="MiniMart Hub logo"
              className="menu-brand-image"
            />
          </span>
          <span className="menu-brand-copy">
            <span className="menu-brand-text">MiniMart Hub</span>
            <span className="menu-brand-subtext">Retail POS</span>
          </span>
        </button>
      </div>

      <div className="menu-sections">
        {menuSections.map((section) => {
          const isOpen = Boolean(openSections[section.id]);
          const sectionId = `menu-section-${section.id}`;

          return (
            <div className="menu-section" key={section.id}>
              <button
                type="button"
                className={
                  "menu-section-toggle" +
                  (isOpen ? " open" : "") +
                  (isCollapsed ? " is-collapsed" : "")
                }
                onClick={() => toggleSection(section.id)}
                aria-expanded={isCollapsed ? true : isOpen}
                aria-controls={sectionId}
                aria-hidden={isCollapsed}
                tabIndex={isCollapsed ? -1 : 0}
              >
                <span className="menu-section-title-text">{section.title}</span>
                <span className="menu-toggle-meta">
                  {section.headerBadge && (
                    <span className="menu-badge">{section.headerBadge}</span>
                  )}
                  <i
                    className={`fa-solid ${
                      isOpen ? "fa-chevron-down" : "fa-chevron-right"
                    }`}
                    aria-hidden="true"
                  ></i>
                </span>
              </button>
              <div
                id={sectionId}
                className={`menu-sublist${
                  isOpen || isCollapsed ? " open" : " collapsed"
                }${isCollapsed ? " is-collapsed" : ""}`}
                role="menu"
              >
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    className={
                      "menu-item" + (isActive(item.path) ? " active" : "")
                    }
                    onClick={() => handleClick(item.path)}
                    aria-current={isActive(item.path) ? "page" : undefined}
                    aria-label={isCollapsed ? item.label : undefined}
                    title={item.label}
                  >
                    <span className="menu-icon">
                      <i className={item.icon}></i>
                    </span>
                    <span className="menu-label">{item.label}</span>
                    {item.badge && <span className="menu-badge">{item.badge}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Menu;

