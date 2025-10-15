// Tipos del dominio de Usuarios

export type UserDTO = {
  id: number | string;
  email: string;
  username?: string;
  nombre_completo?: string;
  name?: string;
  telefono?: string;
  direccion?: string;
  role?: string;
  is_active?: boolean;
  active?: boolean;
  estado?: "ACTIVO" | "INACTIVO";
  last_login?: string | null;
  created_at?: string | null;
};

// Tipo normalizado que usaremos en el UI
export interface User {
  id: string | number;
  nombre: string;
  apellido?: string;
  username?: string;
  email?: string;
  telefono?: string;
  role?: "superadmin" | "administrador" | "gerente" | "contador" | "usuario";
  activo?: boolean;
  last_login?: string | null;

  // Metadatos de auditoría (opcional)
  created_at?: string;
  updated_at?: string;
}

export type ListUsersParams = {
  search?: string;
  activo?: boolean | "all";
  page?: number;
  page_size?: number;
};

export type Page<T> = {
  results: T[];
  count: number;
  page: number;
  page_size: number;
};

// Nuevo: tipo genérico para respuestas de backend (DRF u otros)
export type BackendPage<T> = {
  results?: T[];
  data?: T[];
  count?: number;
  total?: number;
  page?: number;
  current_page?: number;
  page_size?: number;
  per_page?: number;
};

// Adaptador: del payload del backend a nuestro tipo de UI
const mapRole = (r?: string): User["role"] | undefined => {
  if (!r) return undefined;
  const v = r.toLowerCase();
  if (v.includes("super")) return "superadmin";
  if (v.includes("admin")) return "administrador";
  if (v.includes("geren")) return "gerente";
  if (v.includes("cont")) return "contador";
  if (v.includes("user") || v.includes("usuario")) return "usuario";
  return undefined;
};

export const adaptUser = (d: UserDTO): User => ({
  id: d.id,
  email: d.email,
  username: d.username,
  nombre:
    (d.nombre_completo && d.nombre_completo.trim()) ||
    (d.name && d.name.trim()) ||
    (d.username && d.username.trim()) ||
    (d.email?.includes("@") ? d.email.split("@")[0]! : "usuario"),
  telefono: d.telefono,
  role: mapRole(d.role),
  activo: typeof d.is_active === "boolean"
    ? d.is_active
    : typeof d.active === "boolean"
    ? d.active
    : d.estado === "ACTIVO",
  last_login: d.last_login ?? null,
  created_at: d.created_at ?? undefined,
  updated_at: undefined,
});

export type UserHistoryEntry = {
  id: string;
  user_id: string | number;
  action: string;
  actor?: string;
  data?: Record<string, unknown>;
  created_at: string;
};
