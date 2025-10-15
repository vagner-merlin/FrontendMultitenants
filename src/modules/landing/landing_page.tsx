// src/modules/marketing/LandingPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/landing.css";

const samplePlans = [
  {
    id: "basico",
    name: "Básico",
    price: 0,
    bullets: ["1 espacio de trabajo", "Hasta 3 usuarios", "Reportes mensuales"],
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 50,
    bullets: ["Multi-tenant", "Analítica avanzada", "Soporte prioritario"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contactar",
    bullets: ["SSO y SLA", "Onboarding dedicado", "Integraciones a medida"],
  },
];

const LandingPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [companies, setCompanies] = useState(0);

  // animar contador simulado
  useEffect(() => {
    const target = 128; // número simulado de empresas
    let v = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const t = setInterval(() => {
      v += step;
      if (v >= target) {
        v = target;
        clearInterval(t);
      }
      setCompanies(v);
    }, 20);
    return () => clearInterval(t);
  }, []);

  return (
    <main>
      <header className="topbar">
        <div className="logo">iris — gestión financiera</div>
        <div className="actions">
          <Link to="/planes" className="ui-btn ui-btn--ghost">Planes</Link>
          <Link to="/login" className="ui-btn">Iniciar sesión</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <h1 className="ui-title">Crea tu espacio empresarial en iris</h1>
          <p className="ui-subtitle">
            Registra tu compañía, elige un plan y obtén acceso inmediato a la consola web y las aplicaciones móviles.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link className="ui-btn" to="/registro-empresa">Crear empresa gratis</Link>
            <Link className="ui-btn ui-btn--ghost" to="/planes">Ver planes</Link>
          </div>

          <div className="companies" aria-hidden>
            <div className="count">{companies.toLocaleString()}+</div>
            <div>Empresas confían en iris</div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section>
        <div className="capabilities" aria-label="capacidades clave">
          <div className="capability">
            <span className="icon">📊</span>
            <h4>Visión financiera</h4>
            <p>Informes y paneles que muestran la salud de tu negocio en tiempo real.</p>
          </div>
          <div className="capability">
            <span className="icon">⚡</span>
            <h4>Procesos automáticos</h4>
            <p>Automatiza cobros, conciliaciones y flujos repetitivos para ahorrar tiempo.</p>
          </div>
          <div className="capability">
            <span className="icon">🔒</span>
            <h4>Seguridad y control</h4>
            <p>Control de accesos, roles y auditoría para cumplir normativas.</p>
          </div>
        </div>
      </section>

      {/* Plans with celeste background */}
      <section className="plans-section" aria-labelledby="planes-title">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <h2 id="planes-title" style={{ color: "#e6f7ff" }}>Planes y características</h2>
          <div className="plans-grid" role="list">
            {samplePlans.map((plan, i) => (
              <article
                key={plan.id}
                className={[
                  "plan-card",
                  plan.id === "profesional" ? "plan-card" : "",
                ].join(" ")}
                role="listitem"
                aria-expanded={openIdx === i}
              >
                <h3 className="plan-title">{plan.name}</h3>
                <div className="plan-price">{plan.price === 0 ? "Gratis · 14 días" : `$${plan.price}/mes`}</div>
                <ul className="plan-limits" aria-hidden={openIdx === i ? false : true}>
                  {plan.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>

                <div style={{ marginTop: 12 }}>
                  <button className="ui-btn" onClick={() => setOpenIdx(i === openIdx ? null : i)}>
                    {openIdx === i ? "Ocultar detalles" : "Ver detalles"}
                  </button>
                  <Link to={`/checkout?plan=${plan.id}`} className="ui-btn ui-btn--ghost" style={{ marginLeft: 8 }}>
                    Comprar ahora
                  </Link>
                </div>

                {openIdx === i && (
                  <div className="plan-details" role="region" aria-live="polite">
                    <h4 className="plan-details__title">¿Qué incluye?</h4>
                    <ul className="plan-details__list">
                      {plan.bullets.map((d) => <li key={d}>{d}</li>)}
                      <li>Integraciones con pasarelas de pago</li>
                      <li>Soporte por email</li>
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
