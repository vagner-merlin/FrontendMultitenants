import { useContext } from "react";
import { TenantContext } from "./context-value";
import type { TenantContextValue } from "./types";

/**
 * Hook para acceder al contexto de tenant
 * @throws Error si se usa fuera del TenantProvider
 */
export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext debe usarse dentro de TenantProvider");
  }
  return context;
}