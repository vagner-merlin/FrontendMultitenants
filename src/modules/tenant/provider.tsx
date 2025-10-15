import React from "react";
import { http, STORAGE_KEYS } from "../../shared/api/client";
import { TenantContext } from "./context-value";
import type { Tenant, TenantContextValue } from "./types";
import type { AxiosResponse } from "axios";

const ENDPOINTS = {
  LIST: "/api/tenants",
  REGISTER: "/api/tenants/register",
  SELECT: "/api/tenants/select",
  CHECK_SLUG: "/api/tenants/check-slug",
} as const;

function parseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch (e) {
    console.warn("parseJSON error:", e);
    return null;
  }
}
function getErrorStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}
function slugify(s?: string): string {
  return (s ?? "empresa").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const FALLBACK_TENANTS: Tenant[] = [
  {
    id: "org_demo_1",
    name: "Empresa Demo",
    domain: "demo.local",
    slug: "demo",
    plan: "Trial",
    status: "trial",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

function isResultsArray(v: unknown): v is { results: Tenant[] } {
  return (
    typeof v === "object" &&
    v !== null &&
    Object.prototype.hasOwnProperty.call(v, "results") &&
    Array.isArray((v as { results?: unknown }).results)
  );
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgs, setOrgs] = React.useState<Tenant[]>([]);
  const [current, setCurrent] = React.useState<Tenant | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const listTenants = React.useCallback(async (): Promise<Tenant[]> => {
    try {
      const res: AxiosResponse<Tenant[] | { results: Tenant[] }> = await http.get(ENDPOINTS.LIST);
      const data = res.data;
      if (Array.isArray(data)) {
        setOrgs(data);
        return data;
      }
      if (isResultsArray(data)) {
        setOrgs(data.results);
        return data.results;
      }
      setOrgs([]);
      return [];
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      console.warn("listTenants error:", status, (error as Error).message ?? error);
      if (status === 404) {
        try {
          localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(FALLBACK_TENANTS));
        } catch (e) {
          console.warn("No se pudo persistir fallback tenants:", e);
        }
        setOrgs(FALLBACK_TENANTS);
        return FALLBACK_TENANTS;
      }
      const cached = parseJSON<Tenant[]>(localStorage.getItem(STORAGE_KEYS.ORGS));
      if (cached) {
        setOrgs(cached);
        return cached;
      }
      throw error;
    }
  }, []);

  const registerTenant = React.useCallback(
    async (payload: Partial<Tenant> & { admin_email?: string; company_name?: string } = {}) => {
      try {
        const res: AxiosResponse<Tenant> = await http.post(ENDPOINTS.REGISTER, payload, {
          headers: { Authorization: "", "X-Tenant-ID": "" },
        });
        const tenant = res.data;
        try {
          const existing = parseJSON<Tenant[]>(localStorage.getItem(STORAGE_KEYS.ORGS)) ?? [];
          existing.push(tenant);
          localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(existing));
        } catch (e) {
          console.warn("Error guardando tenant en cache:", e);
        }
        if (tenant.id) {
          try {
            localStorage.setItem(STORAGE_KEYS.TENANT, tenant.id);
          } catch {
            //
          }
        }
        setOrgs((prev) => [...prev, tenant]);
        return { tenant, token: undefined as undefined | string };
      } catch (error: unknown) {
        const status = getErrorStatus(error);
        console.warn("registerTenant error:", status, (error as Error).message ?? error);
        if (status === 404) {
          const tenant: Tenant = {
            id: `org_${Date.now()}`,
            name: payload.name ?? payload.company_name ?? "Empresa Demo",
            domain: payload.domain ?? `${(payload.slug ?? slugify(payload.company_name)).toLowerCase()}`,
            slug: payload.slug ?? slugify(payload.name ?? payload.company_name),
            plan: "Trial",
            status: "trial",
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          };
          try {
            const existing = parseJSON<Tenant[]>(localStorage.getItem(STORAGE_KEYS.ORGS)) ?? [];
            existing.push(tenant);
            localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(existing));
            localStorage.setItem(STORAGE_KEYS.TENANT, tenant.id);
          } catch (e) {
            console.warn("Error al guardar tenant en localStorage:", e);
          }
          setOrgs((prev) => [...prev, tenant]);
          setCurrent(tenant);
          return { tenant, token: `mock_token_${Date.now()}` };
        }
        throw error;
      }
    },
    []
  );

  const loadAndSync = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const tenants = await listTenants();
      const authRaw = parseJSON<{ tenant_id?: string }>(localStorage.getItem(STORAGE_KEYS.AUTH));
      const activeId = authRaw?.tenant_id ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
      const active = tenants.find((t) => t.id === activeId);
      setCurrent(active);
    } finally {
      setIsLoading(false);
    }
  }, [listTenants]);

  const selectTenant = React.useCallback(async (tenantId?: string | undefined): Promise<void> => {
    if (!tenantId) {
      try {
        localStorage.removeItem(STORAGE_KEYS.TENANT);
      } catch {
        //
      }
      setCurrent(undefined);
      return;
    }
    try {
      await http.post(ENDPOINTS.SELECT, { tenant_id: tenantId });
      try {
        localStorage.setItem(STORAGE_KEYS.TENANT, tenantId);
        const raw = parseJSON<Record<string, unknown>>(localStorage.getItem(STORAGE_KEYS.AUTH)) ?? {};
        raw.tenant_id = tenantId;
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(raw));
      } catch (e) {
        console.warn("Error actualizando tenant en localStorage:", e);
      }
      await loadAndSync();
    } catch (error) {
      console.warn("selectTenant fallback:", (error as Error).message ?? error);
      try {
        localStorage.setItem(STORAGE_KEYS.TENANT, tenantId);
      } catch {
        //
      }
      await loadAndSync();
    }
  }, [loadAndSync]);

  React.useEffect(() => {
    void loadAndSync();
  }, [loadAndSync]);

  const value = React.useMemo<TenantContextValue>(
    () => ({
      orgs,
      current,
      createOrg: async (payload) => {
        const { tenant } = await registerTenant({ name: payload.name, company_name: payload.name });
        await selectTenant(tenant.id);
        return tenant;
      },
      listOrgs: listTenants,
      selectOrg: selectTenant,
      refresh: loadAndSync,
      isLoading,
    }),
    [orgs, current, isLoading, listTenants, registerTenant, selectTenant, loadAndSync]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export default TenantProvider;