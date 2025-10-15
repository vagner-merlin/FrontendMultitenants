// src/modules/landing/company_register.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listPlans } from "../billing/service";
import type { Plan } from "../billing/types";
import "../../styles/auth.css";

// Tipos basados en las tablas del diagrama
interface InstitutionData {
  razon_social: string;
  email_contacto: string;
  fecha_registro: string;
  nombre: string;
  logo_url?: string;
}

interface DomainData {
  id_organization: string;
  subdomain: string;
  is_primary: boolean;
}

interface AdminUserData {
  password: string;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
}

interface RegistrationForm extends InstitutionData, DomainData, AdminUserData {
  confirm_password: string;
  selected_plan: string;
}

const CompanyRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  // Cargar planes al montar el componente
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plansList = await listPlans();
        setPlans(plansList);
        if (plansList.length > 0) {
          const defaultPlan = plansList[0].id;
          setSelectedPlan(defaultPlan);
          setForm(prev => ({ ...prev, selected_plan: defaultPlan }));
        }
      } catch (error) {
        console.error("Error cargando planes:", error);
      }
    };
    loadPlans();
  }, []);

  const [form, setForm] = useState<RegistrationForm>({
    // Datos de la institución
    razon_social: "",
    email_contacto: "",
    fecha_registro: new Date().toISOString().split('T')[0],
    nombre: "",
    logo_url: "",
    
    // Datos del dominio
    id_organization: "",
    subdomain: "",
    is_primary: true,
    
    // Datos del usuario administrador
    password: "",
    confirm_password: "",
    is_superuser: false,
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    is_staff: true,
    is_active: true,
    date_joined: new Date().toISOString(),
    
    // Plan seleccionado
    selected_plan: "",
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setForm(prev => ({ ...prev, selected_plan: planId }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setForm(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Auto-completar campos relacionados
    if (name === "nombre") {
      const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setForm(prev => ({
        ...prev,
        subdomain: slug,
        razon_social: prev.razon_social || value
      }));
    }

    if (name === "email") {
      setForm(prev => ({
        ...prev,
        email_contacto: prev.email_contacto || value,
        username: prev.username || value.split('@')[0] || ''
      }));
    }
  };

  const validateForm = (): string | null => {
    // Validar datos de la institución
    if (!form.nombre.trim()) return "El nombre de la empresa es requerido";
    if (!form.razon_social.trim()) return "La razón social es requerida";
    if (!form.email_contacto.trim()) return "El email de contacto es requerido";
    
    // Validar subdomain
    if (!form.subdomain.trim()) return "El subdominio es requerido";
    if (!/^[a-z0-9-]+$/.test(form.subdomain)) return "El subdominio solo puede contener letras, números y guiones";
    
    // Validar datos del administrador
    if (!form.first_name.trim()) return "El nombre del administrador es requerido";
    if (!form.last_name.trim()) return "El apellido del administrador es requerido";
    if (!form.email.trim()) return "El email del administrador es requerido";
    if (!form.username.trim()) return "El nombre de usuario es requerido";
    if (!form.password.trim()) return "La contraseña es requerida";
    if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (form.password !== form.confirm_password) return "Las contraseñas no coinciden";
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const validationError = validateForm();
      if (validationError) {
        setMessage({ text: validationError, type: "error" });
        return;
      }

      // Aquí enviarías los datos al backend
      // Por ahora simulamos el registro
      console.log("Datos de registro:", {
        institution: {
          razon_social: form.razon_social,
          email_contacto: form.email_contacto,
          fecha_registro: form.fecha_registro,
          nombre: form.nombre,
          logo_url: form.logo_url,
        },
        domain: {
          subdomain: form.subdomain,
          is_primary: form.is_primary,
        },
        admin_user: {
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          is_staff: form.is_staff,
          is_active: form.is_active,
          is_superuser: form.is_superuser,
          date_joined: form.date_joined,
        },
        selected_plan: form.selected_plan
      });

      setMessage({ text: "Registro exitoso. Redirigiendo...", type: "success" });
      
      // Simular delay y redirigir
      setTimeout(() => {
        navigate("/login?message=Registro exitoso, puede iniciar sesión");
      }, 2000);

    } catch (error) {
      setMessage({ text: "Error al registrar. Intente nuevamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-container">
      <div className="auth-box-modern" style={{ gridTemplateColumns: "360px 1fr", display: "grid", gap: 20 }}>
        {/* Sidebar con planes */}
        <aside className="plans-side">
          <div className="plans-side__header">
            <h4>Selecciona un plan</h4>
            <p className="muted">Elige el plan que mejor se adapte a tu empresa.</p>
          </div>

          <div className="plans-side__list">
            {plans.map((p) => {
              const active = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectPlan(p.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSelectPlan(p.id); }}
                  className={[
                    "plan-side-card",
                    `plan-side-card--${p.id}`,
                    active ? "is-active" : "",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <div className="psc-head">
                    <div>
                      <strong className="psc-title">{p.name}</strong>
                      <div className="psc-sub">{p.priceUsd === 0 ? "Gratis · 14 días" : `$${p.priceUsd}/mes`}</div>
                    </div>
                    {p.id === "profesional" && <div className="psc-badge">Recomendado</div>}
                  </div>
                  <ul className="psc-list">
                    <li>Usuarios: {p.limits.maxUsers}</li>
                    <li>Solicitudes/mes: {p.limits.maxRequests.toLocaleString()}</li>
                    <li>{p.limits.maxStorageGB} GB almacenamiento</li>
                  </ul>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "auto", paddingTop: 12 }}>
            <Link to="/planes" className="ui-btn ui-btn--ghost">Ver todos los planes</Link>
          </div>
        </aside>

        {/* Formulario principal */}
        <div className="auth-right" style={{ width: "100%" }}>
          <form className="auth-form-modern" onSubmit={handleSubmit} noValidate>
            <h2>Registro de Empresa</h2>
            <p>Complete los datos de su empresa y usuario administrador</p>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            {/* Datos de la Institución */}
            <fieldset style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", marginBottom: "16px" }}>
              <legend style={{ fontWeight: "bold", color: "#1f2937" }}>📏 Datos de la Empresa</legend>
              
              <div className="input-group">
                <span className="input-icon">🏢</span>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre de la empresa *"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-icon">📄</span>
                <input
                  type="text"
                  name="razon_social"
                  placeholder="Razón social *"
                  value={form.razon_social}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  name="email_contacto"
                  placeholder="Email de contacto de la empresa *"
                  value={form.email_contacto}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-icon">🌐</span>
                <input
                  type="text"
                  name="subdomain"
                  placeholder="Subdominio (ej: miempresa) *"
                  value={form.subdomain}
                  onChange={handleChange}
                  required
                />
                <small style={{ fontSize: "12px", color: "#6b7280" }}>
                  Su dominio será: {form.subdomain || "subdominio"}.tuapp.com
                </small>
              </div>
            </fieldset>

            {/* Datos del Usuario Administrador */}
            <fieldset style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", marginBottom: "16px" }}>
              <legend style={{ fontWeight: "bold", color: "#1f2937" }}>👤 Usuario Administrador</legend>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="first_name"
                    placeholder="Nombre *"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Apellido *"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email del administrador *"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  name="username"
                  placeholder="Nombre de usuario *"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Contraseña *"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    name="confirm_password"
                    placeholder="Confirmar contraseña *"
                    value={form.confirm_password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </fieldset>

            <button type="submit" className="auth-button-modern" disabled={loading}>
              {loading ? "Registrando empresa..." : "Registrar Empresa"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <span style={{ color: "#6b7280" }}>¿Ya tienes una cuenta? </span>
              <button
                type="button"
                className="link-button"
                onClick={() => navigate("/login")}
              >
                Iniciar sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CompanyRegisterPage;