// src/modules/auth/company_signup.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTenantContext } from "../tenant/hooks";
import type { CompanySignupInput } from "../tenant/types";
import "../../styles/auth.css";
import "../../styles/landing.css";
// importar planes y tipos desde billing
import { listPlans } from "../billing/service";
import type { Plan } from "../billing/types";

const normalizeDomain = (d: string): string =>
  d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

const toSlug = (name: string): string =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const domainOf = (email: string): string | null => {
  const m = email.trim().toLowerCase().match(/@([^@]+)$/);
  return m ? normalizeDomain(m[1]) : null;
};

const strongEnough = (s: string): boolean => s.length >= 8;

const fillDomainFromEmail = (
  form: ExtendedCompanySignupInput,
  setForm: React.Dispatch<React.SetStateAction<ExtendedCompanySignupInput>>
) => {
  const d = domainOf(form.admin_email);
  if (d && !form.domain?.trim()) {
    setForm((s) => ({ ...s, domain: d }));
  }
};

/* Basado en las tablas del diagrama: institucion_SaaS + auth_user */
type ExtendedCompanySignupInput = CompanySignupInput & {
  // Campos de institucion_SaaS
  razon_social: string;
  email_contacto: string;
  fecha_registro: string;
  nombre: string;
  logo_url?: string;
  
  // Campos adicionales del dominio
  id_organization: string;
  subdomain: string;
  is_primary: boolean;
  
  // Campos de auth_user (administrador)
  password: string;
  last_login?: string;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
};

const CompanySignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectBack = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return p.get("redirect") || "/app";
  }, [location.search]);

  const { createOrg } = useTenantContext();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // estados que faltaban (msg, loading, show/hide password)
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ text: string; type: "" | "success" | "error" }>({ text: "", type: "" });
  const [showPass, setShowPass] = useState<boolean>(false);

  const [form, setForm] = useState<ExtendedCompanySignupInput>({
    // Campos base de CompanySignupInput
    company_name: "",
    domain: "",
    slug: "",
    admin_name: "",
    admin_email: "",
    phone: "",
    
    // Campos de institucion_SaaS
    razon_social: "",
    email_contacto: "",
    fecha_registro: new Date().toISOString().split('T')[0],
    nombre: "",
    logo_url: "",
    
    // Campos del dominio
    id_organization: "",
    subdomain: "",
    is_primary: true,
    
    // Campos de auth_user (administrador)
    password: "",
    last_login: "",
    is_superuser: false,
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    is_staff: true,
    is_active: true,
    date_joined: new Date().toISOString(),
  });

  useEffect(() => {
    void (async () => {
      try {
        const p = await listPlans();
        setPlans(p);
        if (p.length) {
          const first = p[0].id;
          setSelectedPlan((prev) => prev ?? first);
          setForm((s) => ({ ...s, plan: s.plan || first }));
        }
      } catch (err) {
        console.error("No se pudieron cargar los planes:", err);
      }
    })();
  }, []);

  // helper para setForm con plan inicial (evitar TS en línea)

  const handleSelectPlan = (id: string) => {
    setSelectedPlan(id);
    setForm((s) => ({ ...s, plan: id }));
  };

  const adminEmailDomain = domainOf(form.admin_email);
  const domainMismatch =
    !!form.domain &&
    !!adminEmailDomain &&
    normalizeDomain(form.domain) !== adminEmailDomain;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement & { name: keyof ExtendedCompanySignupInput };
    setForm((s) => {
      if (name === "company_name" && (!s.slug || s.slug === toSlug(s.company_name))) {
        return { ...s, company_name: value, slug: toSlug(value) };
      }
      if (name === "domain") return { ...s, domain: normalizeDomain(value) };
      return { ...s, [name]: value };
    });
  };

  const validate = (): string | null => {
    if (!form.company_name.trim()) return "Ingrese el nombre de la empresa.";
    if (!form.razon_social?.trim()) return "Ingrese la razón social.";
    if (!form.tax_id?.trim()) return "Ingrese el número fiscal / Tax ID.";
    if (!form.domain.trim()) return "Ingrese el dominio corporativo (ej: acme.com).";
    const adminDom = domainOf(form.admin_email);
    if (!adminDom) return "Ingrese un email de admin válido.";
    if (adminDom !== normalizeDomain(form.domain)) {
      return `El email del admin debe pertenecer al dominio ${form.domain}.`;
    }
    if (!strongEnough(form.password)) return "La contraseña debe tener al menos 8 caracteres.";
    if (!form.address?.trim()) return "Ingrese la dirección completa de la empresa.";
    if (!form.city?.trim()) return "Ingrese la ciudad.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    const err = validate();
    if (err) {
      setMsg({ text: err, type: "error" });
      return;
    }
    setLoading(true);
    try {
      const payload: CompanySignupInput = {
        company_name: form.company_name,
        domain: normalizeDomain(form.domain),
        slug: form.slug && form.slug.trim() ? form.slug.trim().toLowerCase() : toSlug(form.company_name),
        admin_name: form.admin_name,
        admin_email: form.admin_email,
        password: form.password,
        phone: form.phone,
        // añadir plan en el objeto extra si el backend lo acepta
        // @ts-expect-error: backend puede aceptar atributos extra; ajustar types si es necesario
        plan: selectedPlan,
      };
      const tenant = await createOrg({ name: payload.company_name });
      console.debug("Empresa creada:", tenant.id ?? tenant.name);
      setMsg({ text: "Empresa creada correctamente.", type: "success" });
      navigate(redirectBack, { replace: true });
    } catch (e) {
      console.error("Company signup error:", e);
      setMsg({ text: "No se pudo completar el registro. Intenta nuevamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-container">
      <div className="auth-box-modern" style={{ gridTemplateColumns: "360px 1fr", display: "grid", gap: 20 }}>
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
                    <li>Solicitudes/mes: {p.limits.maxRequests}</li>
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

        <div className="auth-right">
          <form className="auth-form-modern" onSubmit={onSubmit} noValidate>
            <h2>Crea tu espacio de trabajo</h2>
            <div style={{ marginBottom: 8, color: "var(--muted)" }}>
              Plan seleccionado: <strong style={{ color: "var(--accent)" }}>{selectedPlan ?? "—"}</strong>
            </div>

            {msg.text && <div className={`message ${msg.type}`}>{msg.text}</div>}

            <div className="register-grid">
              <div className="input-group">
                <input type="text" name="company_name" placeholder="Nombre comercial *" value={form.company_name} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="text" name="razon_social" placeholder="Razón social *" value={form.razon_social} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="text" name="tax_id" placeholder="Número fiscal / Tax ID *" value={form.tax_id} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="text" name="industry" placeholder="Industria" value={form.industry} onChange={handleChange} />
              </div>

              <div className="input-group">
                <input type="email" name="admin_email" placeholder="Email de contacto *" value={form.admin_email} onChange={handleChange} required />
                <button type="button" className="ghost-btn" onClick={() => fillDomainFromEmail(form, setForm)}>auto</button>
              </div>
              {domainMismatch && (
                <div className="message error" style={{ marginTop: 8 }}>
                  El email del admin no coincide con el dominio corporativo.
                </div>
              )}

              <div className="input-group">
                <input type="tel" name="phone" placeholder="Teléfono" value={form.phone ?? ""} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <input type="text" name="address" placeholder="Dirección completa *" value={form.address ?? ""} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="text" name="city" placeholder="Ciudad *" value={form.city ?? ""} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="text" name="slug" placeholder="Slug personalizado (opcional)" value={form.slug ?? ""} onChange={handleChange} />
              </div>

              <div className="input-group">
                <select name="timezone" value={form.timezone} onChange={handleChange}>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>

              <div className="input-group">
                <select name="currency" value={form.currency} onChange={handleChange}>
                  <option value="USD">USD</option>
                  <option value="PEN">PEN</option>
                </select>
              </div>

              <div className="input-group">
                <select name="language" value={form.language} onChange={handleChange}>
                  <option value="en">en</option>
                  <option value="es">es</option>
                </select>
              </div>

              <div className="input-group">
                <input type={showPass ? "text" : "password"} name="password" placeholder="Contraseña *" value={form.password} onChange={handleChange} required autoComplete="new-password" />
                <button type="button" className="ghost-btn" onClick={() => setShowPass((v: boolean) => !v)}>{showPass ? "Ocultar" : "Mostrar"}</button>
              </div>
            </div>

            <button type="submit" className="auth-button-modern" disabled={loading}>
              {loading ? "Registrando…" : "Crear empresa"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
              <p>Al crear la cuenta aceptas los <Link to="/terminos">Términos</Link>.</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CompanySignupPage;
