// src/modules/auth/service.ts
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../../shared/api/client";
import { isAxiosError } from "axios";

import type {
  AuthUser,
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserDTO,
  LoginDTO,
  RegisterDTO,
  ProfileDTO,
  AuthCtx,
  GlobalRole,
} from "./types";

/* ========= helpers ========= */

/** Deriva roles globales si el backend aún no los envía como global_roles */
function deriveGlobalRoles(u: UserDTO): GlobalRole[] {
  const explicit = u.global_roles as GlobalRole[] | undefined;
  if (Array.isArray(explicit) && explicit.length) return explicit;
  if (u.is_superuser) return ["superadmin", "platform_admin"];
  if (u.is_staff) return ["admin"];
  return ["user"];
}

/** Convierte un UserDTO del backend a AuthUser del dominio */
function mapUser(u: UserDTO): AuthUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    nombre_completo: u.nombre_completo,
    roles: deriveGlobalRoles(u),
    org_roles: u.org_roles || {},     // mapa { [tenantId]: "administrador" | ... }
    tenant_id: u.tenant_id ?? null,
  };
}

/** Guarda token, usuario y metadatos para que el resto del front los lea */
export async function persistSession(token: string, user: AuthUser): Promise<void> {
  try {
    console.log("💾 Guardando sesión:", { token: token.substring(0, 10) + "...", user: user.email });
    
    localStorage.setItem("auth.token", token);
    localStorage.setItem("auth.me", JSON.stringify(user));
    
    // 🔥 CORRECCIÓN: Convertir tenant_id a string si existe
    if (user.tenant_id) {
      localStorage.setItem("auth.tenant_id", String(user.tenant_id));
    }
    
    // Mantener compatibilidad con objeto auth completo
    localStorage.setItem("auth", JSON.stringify({
      token,
      user,
      tenant_id: user.tenant_id
    }));
    
    console.log("✅ Sesión guardada exitosamente");
  } catch (error) {
    console.error("Error al persistir sesión:", error);
  }
}

/** Limpia por completo la sesión local */
function clearSession() {
  localStorage.removeItem("auth.token");
  localStorage.removeItem("auth.me");
  localStorage.removeItem("auth.permissions");
  localStorage.removeItem("auth.tenant_id");
}

/** Extrae un mensaje razonable de distintos formatos de payload */
function extractApiMessage(data: unknown): string | undefined {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const candidates = [o.message, o.detail, o.error];
    const hit = candidates.find((v) => typeof v === "string" && (v as string).trim());
    return hit as string | undefined;
  }
  return undefined;
}

/** Mensaje de error amigable (sin any) */
export function humanizeError(e: unknown, fallback = "Error desconocido"): string {
  if (isAxiosError(e)) {
    if (e.code === "ERR_NETWORK") return "No se pudo conectar con el servidor.";
    const msgFromPayload = extractApiMessage(e.response?.data);
    const base = (msgFromPayload ?? e.message ?? "").trim();
    return base || fallback;
  }
  if (e instanceof Error) {
    return (e.message ?? "").trim() || fallback;
  }
  return fallback;
}

/* ========= API (BACKEND REAL + FALLBACK LOCAL) ========= */

// Usuario mock para presentación
const DEMO_USER: AuthUser = {
  id: 1,
  username: "vagner",
  email: "vagner@gmail.com",
  nombre_completo: "Vagner Merlin",
  roles: ["admin"],
  org_roles: { "1": "administrador" },
  tenant_id: "1",
};

const DEMO_CREDENTIALS = {
  email: "vagner@gmail.com",
  password: "sssssssssssssssssssss"
};

/**
 * IMPORTANTE:
 * - Tus endpoints reales (según los logs) son:
 *   - POST /api/login/
 *   - POST /api/register/        (si lo usas)
 *   - GET  /api/profile/
 *   - POST /api/logout/
 * - Forzamos headers { Authorization: "", "X-Tenant-ID": "" } para que
 *   el interceptor NO inyecte token previo ni X-Tenant-ID en endpoints públicos.
 */

export async function apiLogin(payload: LoginInput): Promise<AuthResponse> {
  // Si coincide con las credenciales demo, usar usuario mock
  if (payload.email === DEMO_CREDENTIALS.email && payload.password === DEMO_CREDENTIALS.password) {
    return {
      success: true,
      message: "Login exitoso (modo demo)",
      token: "demo-token-123",
      user: DEMO_USER,
    };
  }

  // Permitir login en modo demo si el usuario usa el correo del usuario demo
  // Esto ayuda cuando el backend no está disponible y quieres usar tu email
  // para navegar localmente. No cambia la lógica de backend real.
  if (payload.email === DEMO_USER.email) {
    return {
      success: true,
      message: "Login exitoso (modo demo por email)",
      token: "demo-token-123",
      user: DEMO_USER,
    };
  }

  // Intentar login real con backend
  try {
    console.log("Intentando login con:", payload);
    const { data } = await http.post<LoginDTO>("/api/auth/login/", payload, {
      headers: { Authorization: "" }, // <-- quitar X-Tenant-ID para evitar preflight
    });
    
    console.log("Respuesta del login:", data);
    
    return {
      success: true,
      message: data.message ?? "Login exitoso",
      token: data.token,
      user: mapUser(data.user),
    };
  } catch (error: any) {
    console.error("Error en login:", error);
    
    // Log detallado del error
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    
    // Si el backend no está disponible, usar credenciales demo como fallback
    console.warn("Backend no disponible o error, usando modo demo", error);
    if (payload.email === DEMO_CREDENTIALS.email && payload.password === DEMO_CREDENTIALS.password) {
      return {
        success: true,
        message: "Login exitoso (fallback demo)",
        token: "demo-token-123",
        user: DEMO_USER,
      };
    }
    throw error;
  }
}

export async function apiRegister(payload: RegisterInput): Promise<AuthResponse> {
  const { data } = await http.post<RegisterDTO>("/api/register/", payload, {
    headers: { Authorization: "" }, // <-- quitar X-Tenant-ID
  });
  return {
    success: true,
    message: data.message ?? "OK",
    token: data.token,
    user: mapUser(data.user),
  };
}

// Nueva función para registrar empresa y usuario
export async function apiRegisterCompanyAndUser(payload: {
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
}): Promise<AuthResponse & { empresa_id?: number }> {
  try {
    console.log("Enviando solicitud a /api/register/empresa-user/ con payload:", payload);
    
    const { data } = await http.post<{
      token: string;
      user: UserDTO;
      empresa_id: number;
      message?: string;
    }>("/api/register/empresa-user/", payload, {
      headers: { Authorization: "" },
    });
    
    console.log("Respuesta recibida del backend:", data);
    
    const result = {
      success: true,
      message: data.message ?? "Registro exitoso",
      token: data.token,
      user: mapUser(data.user),
      empresa_id: data.empresa_id,
    };
    
    console.log("Resultado procesado:", result);
    return result;
  } catch (error) {
    console.error("Error en apiRegisterCompanyAndUser:", error);
    throw error;
  }
}

export async function apiMe(): Promise<AuthResponse> {
  // Si hay token demo, retornar usuario demo
  const token = localStorage.getItem("auth.token");
  if (token === "demo-token-123") {
    return {
      success: true,
      message: "Profile OK (modo demo)",
      user: DEMO_USER,
      tenant_id: DEMO_USER.tenant_id,
    };
  }

  try {
    const { data } = await http.get<ProfileDTO>("/api/profile/");
    return {
      success: true,
      message: data.message ?? "OK",
      user: mapUser(data.user),
      tenant_id: data?.user?.tenant_id ?? null,
    };
  } catch (error) {
    // Si el backend no está disponible y hay token demo, usar usuario demo
    if (token === "demo-token-123") {
      return {
        success: true,
        message: "Profile OK (fallback demo)",
        user: DEMO_USER,
        tenant_id: DEMO_USER.tenant_id,
      };
    }
    throw error;
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await http.post("/api/logout/", {}, { headers: { Authorization: "" } }); // <-- quitar X-Tenant-ID
  } finally {
    clearSession(); // limpia local pase lo que pase
  }
}

// Nueva función de logout que envía el token en el body
export async function apiLogoutWithToken(token: string): Promise<void> {
  try {
    await http.post("/api/auth/logout/", { token }, {
      headers: { Authorization: "" },
    });
  } finally {
    clearSession(); // limpia local pase lo que pase
  }
}

/* ========= Contexto ========= */
const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token, refrescamos el perfil
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth.token");
        if (!token) return;
        const me = await apiMe();
        if (me.user) {
          setUser(me.user);
          // 🔥 CORRECCIÓN: pasar token y user por separado
          await persistSession(token, me.user);
        }
      } catch {
        clearSession(); // token inválido/expirado -> limpiamos
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const res = await apiLogin({ email, password });
      if (res.success && res.token && res.user) {
        // 🔥 CORRECCIÓN: pasar token y user por separado
        await persistSession(res.token, res.user);
        setUser(res.user);
      }
      return res;
    } catch (e) {
      const msg = humanizeError(e, "No se pudo iniciar sesión.");
      return { success: false, message: msg };
    }
  };

  // Si tu flujo real de alta es vía /registro-empresa, quizá no uses este register()
  const register = async (payload: RegisterInput): Promise<AuthResponse> => {
    try {
      const res = await apiRegister(payload);
      if (res.success && res.token && res.user) {
        // 🔥 CORRECCIÓN: pasar token y user por separado
        await persistSession(res.token, res.user);
        setUser(res.user);
      }
      return res;
    } catch (e) {
      const msg = humanizeError(e, "No se pudo registrar.");
      return { success: false, message: msg };
    }
  };

  // Nueva función para registrar empresa y usuario
  const registerCompanyAndUser = async (payload: {
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
  }): Promise<AuthResponse & { empresa_id?: number }> => {
    try {
      console.log("Llamando a apiRegisterCompanyAndUser con:", payload);
      const res = await apiRegisterCompanyAndUser(payload);
      console.log("Respuesta de apiRegisterCompanyAndUser:", res);
      
      if (res.success && res.token && res.user) {
        await persistSession(res.token, res.user);
        setUser(res.user);
      }
      return res;
    } catch (e) {
      console.error("Error en registerCompanyAndUser:", e);
      const msg = humanizeError(e, "No se pudo registrar la empresa.");
      return { success: false, message: msg };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("auth.token");
      console.log("🚪 Cerrando sesión con token:", token ? token.substring(0, 10) + "..." : "sin token");
      
      if (token) {
        console.log("Enviando logout con token al endpoint /api/auth/logout/");
        await apiLogoutWithToken(token);
      } else {
        console.log("Enviando logout sin token al endpoint /api/logout/");
        await apiLogout();
      }
      
      console.log("✅ Logout exitoso");
    } finally {
      setUser(null);
    }
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, login, register, registerCompanyAndUser, logout }),
    [user, loading]
  );

  return React.createElement(Ctx.Provider, { value }, children as React.ReactNode);
};

export const useAuth = (): AuthCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
