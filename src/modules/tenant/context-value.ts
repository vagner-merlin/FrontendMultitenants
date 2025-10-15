import { createContext } from "react";
import type { TenantContextValue } from "./types";

// Crea el contexto con valor inicial undefined
export const TenantContext = createContext<TenantContextValue | undefined>(undefined);