// Servicio de API para Usuarios (DRF friendly)

import { http } from "../../shared/api/client";
import {
  adaptUser,
  type ListUsersParams,
  type Page,
  type User,
  type UserDTO,
  type BackendPage,
} from "./types";

const normalizePage = <T,>(
  raw: BackendPage<T> | T[],
  page: number,
  page_size: number
): { items: T[]; count: number; page: number; page_size: number } => {
  if (Array.isArray(raw)) {
    return { items: raw, count: raw.length, page, page_size };
  }
  const items = raw.results ?? raw.data ?? [];
  const count = raw.count ?? raw.total ?? items.length;
  const pg = raw.page ?? raw.current_page ?? page;
  const ps = raw.page_size ?? raw.per_page ?? page_size;
  return { items, count, page: pg, page_size: ps };
};

export async function listUsers(
  params: ListUsersParams = {}
): Promise<Page<User>> {
  const { search, activo = "all", page = 1, page_size = 10 } = params;

  const query: Record<string, unknown> = { page, page_size };
  if (search && search.trim()) query.search = search.trim();
  if (activo !== "all") query.is_active = activo === true // fuerza Boolean;

  // 👇 Ojo al prefijo y al slash final típicos de DRF: "/api/users/"
  const res = await http.get<BackendPage<UserDTO> | UserDTO[]>("/api/users/", {
    params: query,
  });

  // Fijamos el genérico para evitar `unknown[]`
  const normalized = normalizePage<UserDTO>(res.data, page, page_size);

  return {
    results: normalized.items.map(adaptUser),
    count: normalized.count,
    page: normalized.page,
    page_size: normalized.page_size,
  };
}

export async function setUserActive(
  id: number | string,
  active: boolean
): Promise<void> {
  // Ajusta la ruta según tu backend. En DRF suele ser "/api/users/:id/"
  await http.patch(`/api/users/${id}/`, { is_active: active });

  // Si tu backend no soporta PATCH, alternativas:
  // await http.put(`/api/users/${id}/`, { is_active: active });
  // await http.post(`/api/users/${id}/toggle/`, { is_active: active });
}

export async function getUserHistory(userId: string | number): Promise<UserHistoryEntry[]> {
  try {
    // si tienes API real:
    // const res = await http.get(`/api/users/${userId}/history/`);
    // return res.data;
  } catch {
    void 0;
  }

  try {
    const raw = localStorage.getItem(`mock.user.history.${userId}`);
    if (raw) return JSON.parse(raw) as UserHistoryEntry[];
  } catch {
    void 0;
  }

  // mock básico
  const mock: UserHistoryEntry[] = [
    { id: `${userId}-h1`, user_id: userId, action: "CREADO", actor: "system", data: {}, created_at: new Date().toISOString() },
    { id: `${userId}-h2`, user_id: userId, action: "ROL_CAMBIADO a administrador", actor: "admin@demo", data: {}, created_at: new Date().toISOString() }
  ];
  return mock;
}

export async function updateUser(userId: string | number, payload: Partial<User>): Promise<User> {
  // ...si llamas API real, mantén esa rama...
  try {
    const raw = localStorage.getItem("mock.users");
    const users: User[] = raw ? (JSON.parse(raw) as User[]) : [];
    const idx = users.findIndex(u => String(u.id) === String(userId));
    const now = new Date().toISOString();

    let resultUser: User;
    if (idx !== -1) {
      resultUser = {
        ...users[idx],
        ...payload,
        updated_at: now
      };
      users[idx] = resultUser;
    } else {
      resultUser = {
        id: String(userId),
        nombre: payload.nombre ?? "",
        email: payload.email ?? "",
        telefono: payload.telefono ?? "",
        role: payload.role ?? ("usuario" as User["role"]),
        activo: payload.activo ?? true,
        created_at: now,
        updated_at: now
      } as User;
      users.push(resultUser);
    }

    // persistir usuarios
    localStorage.setItem("mock.users", JSON.stringify(users));

    // añadir entrada de historial (para verificar cambios)
    try {
      const historyKey = `mock.user.history.${userId}`;
      const rawHist = localStorage.getItem(historyKey);
      const hist: UserHistoryEntry[] = rawHist ? (JSON.parse(rawHist) as UserHistoryEntry[]) : [];
      const actor = (() => {
        try { return (JSON.parse(localStorage.getItem("auth.me") || "{}").email) ?? "system"; } catch { return "system"; }
      })();
      const entry: UserHistoryEntry = {
        id: `${userId}-${Date.now()}`,
        user_id: String(userId),
        action: "UPDATED",
        actor,
        data: payload as Record<string, unknown>,
        created_at: now
      };
      hist.unshift(entry);
      localStorage.setItem(historyKey, JSON.stringify(hist));
    } catch {
      // no bloquear la actualización si falla historial
    }

    console.log("[users.service] updateUser saved", { userId, payload, saved: resultUser });
    return resultUser;
  } catch (e) {
    // fallback tipado
    console.error("[users.service] updateUser failed", e);
    throw e;
  }
}

//# sourceMappingURL=service.js.map
export type UserHistoryEntry = {
   id: string;
   user_id: string | number;
   action: string;
   actor?: string;
   data?: Record<string, unknown>;
   created_at: string;
 };
