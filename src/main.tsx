// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./modules/auth/service";
import DashboardLayout from "./modules/dashboard/dashboard";
import { RequireAuth, PublicOnly } from "./shared/api/guards";
import TenantProvider from "./modules/tenant/provider";

// Pages
import LandingPage from "./modules/landing/landing_page";
import AuthPage from "./modules/auth/page";
import UsersPage from "./modules/usuarios/page";
import CreditsPage from "./modules/creditos/page";
import CompanySignupPage from "./modules/landing/company";
import CompanyRegisterPage from "./modules/landing/company_register";
import PlanSelectionPage from "./modules/billing/plan_selection";
import PlanesStandalone from "./modules/billing/planes_standalone";
import SubscriptionPage from "./modules/billing/suscripcion_page";
import CheckoutMockPage from "./modules/billing/checkout_page";
import TenantGuard from "./modules/tenant/TenantGuard";
import SolicitarCredito from "./modules/creditos/solicitar";
import PagosPage from "./modules/pagos/page";
import ConfigurationPage from "./modules/configuracion/page";
import RegistroOnPremise from "./modules/billing/registro_onpremise";
import CrearUsuarioPage from "./modules/usuarios/crear_usuario";
import HistorialAuditoriaPage from "./modules/auditoria/historial";
import ReportesPage from "./modules/reportes/reportes";
import PersonalizacionPage from "./modules/personalizacion/personalizacion";
import BackupPage from "./modules/backup/backup";
import HistorialActividadesPage from "./modules/actividades/historial_simple";
import DashboardIngresos from "./modules/ingresos/dashboard";

// Helper
import type { AuthUser } from "./modules/auth/types";
const displayName = (u: AuthUser | null): string => {
  if (!u) return "usuario";
  if (u.nombre_completo?.trim()) return u.nombre_completo;
  if (u.username?.trim()) return u.username;
  if (u.email?.includes("@")) return u.email.split("@")[0]!;
  return "usuario";
};

// Home dentro de /app (protegido)
export function Inicio() {
  const { user, loading, logout } = useAuth();
  
  if (loading) {
    return (
      <section className="page">
        <p>Cargando tu sesión…</p>
      </section>
    );
  }
  
  const handleLogout = async () => {
    if (confirm("¿Estás seguro que quieres cerrar sesión?")) {
      await logout();
      window.location.href = "/login";
    }
  };
  
  return (
    <section className="page">
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "32px",
        padding: "20px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0"
      }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0" }}>¡Hola, {displayName(user)}! 👋</h1>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Bienvenido al sistema de gestión financiera.
          </p>
          {user?.email && (
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
              📧 {user.email}
            </p>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
      
      {/* Información de debug */}
      <div style={{
        padding: "16px",
        backgroundColor: "#f0f9ff",
        borderRadius: "8px",
        border: "1px solid #bfdbfe",
        marginBottom: "24px"
      }}>
        <h3 style={{ margin: "0 0 12px 0", color: "#1e40af" }}>🔧 Información de Sesión</h3>
        <div style={{ fontSize: "14px", color: "#1e40af" }}>
          <p style={{ margin: "4px 0" }}>
            <strong>Token guardado:</strong> {localStorage.getItem("auth.token") ? "✅ Sí" : "❌ No"}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Usuario ID:</strong> {user?.id || "N/A"}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Roles:</strong> {user?.roles?.join(", ") || "N/A"}
          </p>
        </div>
      </div>
      
      {/* Enlaces rápidos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 8px 0" }}>📊 Dashboard</h4>
          <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
            Accede al panel principal del sistema
          </p>
        </div>
        
        <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 8px 0" }}>👥 Usuarios</h4>
          <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
            Gestión de usuarios del sistema
          </p>
        </div>
        
        <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 8px 0" }}>⚙️ Configuración</h4>
          <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
            Ajustes del sistema y empresa
          </p>
        </div>
      </div>
    </section>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/registro-empresa",
    element: (
      <PublicOnly>
        <CompanySignupPage />
      </PublicOnly>
    ),
  },
  {
    path: "/planes",
    element: <PlanesStandalone />,
  },
  {
    path: "/registro-onpremise",
    element: <RegistroOnPremise />,
  },
  {
    path: "/registro",
    element: <CompanyRegisterPage />,
  },
  {
    path: "/planes-seleccion",
    element: <PlanSelectionPage />,
  },
  {
    path: "/checkout-mock",
    element: <CheckoutMockPage />,
  },
  {
    path: "/mi-suscripcion",
    element: (
      <RequireAuth>
        <SubscriptionPage />
      </RequireAuth>
    ),
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <TenantGuard>
          <DashboardLayout />
        </TenantGuard>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Inicio /> },
      { path: "usuarios", element: <UsersPage /> },
      { path: "crear-usuario", element: <CrearUsuarioPage /> },
      { path: "actividades", element: <HistorialActividadesPage /> },
      { path: "auditoria", element: <HistorialAuditoriaPage /> },
      { path: "reportes", element: <ReportesPage /> },
      { path: "personalizacion", element: <PersonalizacionPage /> },
      { path: "ingresos", element: <DashboardIngresos /> },
      { path: "backup", element: <BackupPage /> },
      {
        path: "creditos",
        element: <CreditsPage />,
        children: [
          { path: "solicitar", element: <SolicitarCredito /> },
        ]
      },
      { path: "pagos", element: <PagosPage /> },
      { path: "configuracion", element: <ConfigurationPage /> },
    ],
  },
  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);

const container = document.getElementById("root")!;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <TenantProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </TenantProvider>
  </React.StrictMode>
);

// Evita raíces duplicadas en HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}
