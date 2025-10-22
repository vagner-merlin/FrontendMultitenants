// === Tipos del dominio (app) ===

// Credenciales
export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  name: string;
  telefono_ref: string;
  email_empresarial: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
};

/** Roles globales (no requieren tenant) */
export type GlobalRole = "superadmin" | "platform_admin" | "admin" | "user";

/** Roles dentro de una empresa (tenant) */
export type TenantRole =
  | "administrador"
  | "gerente"
  | "vendedor"
  | "contador"
  | "almacenista";

/** Mapa: tenantId -> rol dentro de ese tenant */
export type OrgRolesMap = Record<string, TenantRole>;

/**
 * Usuario autenticado en la app.
 * - roles: roles globales (plataforma). Un superadmin/platform_admin no necesita tenant.
 * - org_roles: roles por tenant (si fue creado/relacionado a empresas).
 * - tenant_id: tenant activo (si aplica). Un admin global puede operar sin él.
 * - permissions: opcional, por si tu backend expone permisos granulares (incluido "*" para root).
 */
export type AuthUser = {
  id: number | string;
  username?: string;
  email?: string;
  nombre_completo?: string;

  // Compat: mantenemos roles?: string[] pero documentamos GlobalRole[]
  roles?: (string | GlobalRole)[];
  org_roles?: OrgRolesMap;
  tenant_id?: string | number | null;

  permissions?: string[]; // p. ej. ["*"] para root
};

export type AuthResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;

  // opcionales del backend (si los manda)
  permissions?: string[];
  tenant_id?: string | number | null;
};


// === DTOs del backend (según tus views.py) ===

/**
 * UserDTO que viene del backend.
 * - Si tu backend aún no devuelve global_roles/org_roles, puedes derivarlos con
 *   is_superuser/is_staff en el mapper (superadmin/platform_admin/admin).
 */
export type UserDTO = {
  id: number | string;
  username?: string;
  email?: string;
  nombre_completo?: string;

  // meta de Django/tu backend
  is_superuser?: boolean;
  is_staff?: boolean;

  // opcional si ya lo expones
  global_roles?: GlobalRole[];
  org_roles?: OrgRolesMap;

  // tenant actual opcional
  tenant_id?: string | number | null;
};

export type LoginDTO = {
  message?: string;
  token: string;
  user: UserDTO;
};

export type RegisterDTO = {
  message?: string;
  token: string;
  user: UserDTO;
};

export type ProfileDTO = {
  message?: string;
  user: UserDTO;
  // si necesitas empresa/demographics/grupos, tipéalos aquí luego
};


// === Tipo del contexto de Auth (sin React) ===

export type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: RegisterInput) => Promise<AuthResponse>;
  registerCompanyAndUser: (payload: {
    razon_social: string;
    email_contacto: string;
    nombre_comercial: string;
    imagen_url_empresa: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    imagen_url_perfil: string;
  }) => Promise<AuthResponse & { empresa_id?: number }>;
  logout: () => Promise<void>;
};
