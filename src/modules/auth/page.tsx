// src/modules/auth/page.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./service";
import type { AuthResponse, AuthUser } from "./types";
import "../../styles/auth.css";

const derivePermissionsFromRoles = (user?: AuthUser): string[] => {
  const roles = user?.roles ?? [];
  if (roles.includes("superadmin")) return ["*"];
  if (roles.includes("admin")) return ["user.read", "user.toggle"];
  return ["user.read"];
};

const AuthPage: React.FC = () => {
  const { login } = useAuth(); // 👈 solo login; registro se hace en /registro-empresa
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirect = () => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/";
  };

  const strongEnough = (s: string) => s.length >= 8;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "" | "success" | "error" }>({ text: "", type: "" });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState<{ email: string; password: string }>({ email: "", password: "" });

  const normalizeEmail = (s: string) => s.trim().toLowerCase();

  const persistSession = (res: AuthResponse) => {
    if (res.token) {
      (remember ? localStorage : sessionStorage).setItem("auth.token", res.token);
    }
    if (res.user) {
      localStorage.setItem("auth.me", JSON.stringify(res.user));
      const perms = res.permissions ?? derivePermissionsFromRoles(res.user);
      localStorage.setItem("auth.permissions", JSON.stringify(perms));
    }
    if (res.tenant_id != null) {
      localStorage.setItem("auth.tenant_id", String(res.tenant_id));
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement & { name: "email" | "password" };
    setLoginData((s) => ({ ...s, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const email = normalizeEmail(loginData.email);
      if (!strongEnough(loginData.password)) {
        setMessage({ text: "La contraseña debe tener al menos 8 caracteres.", type: "error" });
        return;
      }
      const res = await login(email, loginData.password);
      setMessage({ text: res.message, type: res.success ? "success" : "error" });
      if (res.success) {
        persistSession(res);
        navigate(getRedirect(), { replace: true });
      }
    } catch {
      setMessage({ text: "No se pudo iniciar sesión. Intenta nuevamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // URL de "Crear empresa" preservando redirect
  const companyRegisterUrl = `/registro-empresa?from=auth&redirect=${encodeURIComponent(getRedirect())}`;

  return (
    <div className="auth-container">
      <div className="auth-box-modern">
        <div className="auth-left"><div className="auth-image" /></div>

        <div className="auth-right">
          <form className="auth-form-modern" onSubmit={handleLogin} noValidate>
            <h2>Iniciar Sesión</h2>
            <p>Ingrese sus credenciales</p>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                placeholder="Correo"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <span
                className="input-icon"
                role="button"
                aria-label="mostrar/ocultar"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? "🙈" : "🔒"}
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="******"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="auth-row">
              <label className="remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Recordarme en este dispositivo
              </label>
              <a className="forgot-password" href="/recuperar-contraseña">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className="auth-button-modern" disabled={loading}>
              {loading ? "Cargando..." : "Iniciar Sesión"}
            </button>

            {/* --- separador sutil --- */}
            <div
              aria-hidden
              style={{
                margin: "12px 0 10px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1, height: 1, background: "rgba(148,163,184,.25)" }} />
              <span>o</span>
              <span style={{ flex: 1, height: 1, background: "rgba(148,163,184,.25)" }} />
            </div>

            {/* CTA: mismo estilo que el botón de iniciar sesión */}
            <button
              type="button"
              className="auth-button-modern"
              onClick={() => navigate(companyRegisterUrl)}
            >
              Crear empresa y configurar dominio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
