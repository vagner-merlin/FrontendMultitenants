import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { MENU } from "./Menu";

export type SidebarProps = {
  brand?: string;
  /** si quieres que el sidebar colapse automáticamente al navegar */
  collapseOnNavigate?: boolean;
};

const STORAGE_KEY = "ui.sidebar.collapsed";

const Sidebar: React.FC<SidebarProps> = ({ brand = "Gestion Financiera", collapseOnNavigate = false }) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed(c => !c), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // tecla '=' para alternar (sin importar si está con shift)
      if (e.key === "=") {
        // evitar cuando se está escribiendo en inputs/textareas
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);

    // escuchar evento global para que Topbar pueda alternar el sidebar
    const evHandler = () => toggle();
    window.addEventListener("app:toggle-sidebar", evHandler as EventListener);

    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("app:toggle-sidebar", evHandler as EventListener);
    };
  }, [toggle]);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-hidden={collapsed}>
      <div className="sidebar__header">
        <div className="brand">{brand}</div>
        <button
          type="button"
          className="sidebar__toggle ui-btn ui-btn--ghost"
          onClick={toggle}
          aria-pressed={collapsed}
          title="Alternar menú (=)"
          aria-label={collapsed ? "Abrir menú" : "Cerrar menú"}
        >
          {/* Icono hamburguesa (3 rayas) */}
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect y="0" width="18" height="2" rx="1" fill="currentColor"></rect>
            <rect y="6" width="18" height="2" rx="1" fill="currentColor"></rect>
            <rect y="12" width="18" height="2" rx="1" fill="currentColor"></rect>
          </svg>
        </button>
      </div>

      <nav className="nav" aria-label="Navegación principal">
        {MENU.map((item) => {
          // Asegurar que las rutas del menú se resuelvan dentro de /app
          const to = item.path === "/" ? "/app" : item.path.startsWith("/app") ? item.path : `/app${item.path}`;
          return (
            <NavLink
              key={item.path}
              to={to}
              end={item.exact}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={() => {
                if (collapseOnNavigate) setCollapsed(true);
              }}
            >
              <span className="nav-link__icon">{item.icon ?? "•"}</span>
              <span className="nav-link__label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
