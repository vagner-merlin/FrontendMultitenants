// src/modules/tenant/TenantGuard.tsx
import React from "react";

/**
 * TenantGuard temporal para desarrollo:
 * - Permite acceso sin verificar tenant mientras desarrollas las vistas
 * - Cuando tengas el backend de tenants completo, restaura la lógica
 */
export default function TenantGuard({ children }: { children: React.ReactNode }) {
  // Modo dev: permitir acceso sin comprobaciones
  return <>{children}</>;
}
