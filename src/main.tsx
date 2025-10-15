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
import PlansPage from "./modules/billing/planes_page";
import SubscriptionPage from "./modules/billing/suscripcion_page";
import CheckoutMockPage from "./modules/billing/checkout_page";
import TenantGuard from "./modules/tenant/TenantGuard";
// nuevo import para la pantalla de solicitar
import SolicitarCredito from "./modules/creditos/solicitar";
import PagosPage from "./modules/pagos/page";
import ConfigurationPage from "./modules/configuracion/page";

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
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <section className="page">
        <p>Cargando tu sesión…</p>
      </section>
    );
  }
  return (
    <section className="page">
      <h1>¡Hola, {displayName(user)}! 👋</h1>
      <p>Bienvenido al sistema de gestión financiera.</p>
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
    element: (
      <PublicOnly>
        <AuthPage />
      </PublicOnly>
    ),
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
    element: <PlansPage />,
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
