// src/modules/auth/page.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./service";
import "../../styles/auth.css";

const AuthPage: React.FC = () => {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirect = () => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/app";
  };

  const strongEnough = (s: string) => s.length >= 8;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "" | "success" | "error" }>({ text: "", type: "" });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState<{ email: string; password: string }>({ 
    email: "vagner@gmail.com", 
    password: "adminn2112" 
  });

  const normalizeEmail = (s: string) => s.trim().toLowerCase();

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
      // Para modo demo, permitir login sin validación estricta
      if (email !== "vagner@gmail.com" && !strongEnough(loginData.password)) {
        setMessage({ text: "La contraseña debe tener al menos 8 caracteres.", type: "error" });
        return;
      }
      const res = await login(email, loginData.password);
      setMessage({ text: res.message, type: res.success ? "success" : "error" });
      if (res.success) {
        // La función login del contexto ya se encarga de persistir la sesión
        // Pequeño delay para asegurar que el contexto se actualice
        setTimeout(() => {
          navigate(getRedirect(), { replace: true });
        }, 100);
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
          {/* Mostrar si ya está logueado */}
          {user && (
            <div style={{
              background: "#f0f9ff",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px",
              border: "1px solid #0ea5e9",
              textAlign: "center"
            }}>
              <p style={{ margin: "0 0 8px 0", color: "#0369a1", fontSize: "14px" }}>
                ✅ Ya estás logueado como: <strong>{user.nombre_completo || user.email}</strong>
              </p>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setMessage({ text: "Sesión cerrada", type: "success" });
                }}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}

          <form className="auth-form-modern" onSubmit={handleLogin} noValidate>
            <h2>Iniciar Sesión</h2>
            <p>Ingrese sus credenciales</p>
            
            {/* Indicador de modo demo */}
            <div style={{
              background: "#e3f2fd",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#1976d2",
              marginBottom: "16px",
              border: "1px solid #bbdefb"
            }}>
              🎯 <strong>Modo Demo:</strong> vagner@gmail.com / adminn2112
            </div>

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
