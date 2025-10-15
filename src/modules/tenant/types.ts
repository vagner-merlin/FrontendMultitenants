export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  slug?: string;
  plan?: string;
  status?: 'active' | 'trial' | 'suspended';
  trialEndsAt?: string;
  createdAt?: string;
}

export interface AuthShape {
  token?: string;
  tenant_id?: string;
  me?: {
    id: string;
    email?: string;
    username?: string;
    nombre_completo?: string;
    roles?: string[];
    [key: string]: unknown;
  };
  permissions?: string[];
}

export interface CompanySignupInput {
  company_name: string;
  domain: string;
  slug?: string;
  admin_name: string;
  admin_email: string;
  password: string;
  phone?: string;
}

export interface CompanySignupResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email?: string;
    username?: string;
    nombre_completo?: string;
    roles?: string[];
    [key: string]: unknown;
  };
  tenant_id?: string;
  planName?: string;
  status?: string;
  trialEndsAt?: string;
}

// ...existing types

export interface TenantContextValue {
  orgs: Tenant[];
  current?: Tenant;
  createOrg: (payload: { name: string }) => Promise<Tenant>;
  listOrgs: () => Promise<Tenant[]>;
  selectOrg: (id: string | undefined) => Promise<void>;
  refresh: () => Promise<void>;
  isLoading: boolean; // Añadimos esta propiedad
}