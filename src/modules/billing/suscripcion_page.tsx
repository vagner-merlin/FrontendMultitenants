import React, { useEffect, useMemo, useState } from "react";
import {
  getSubscription,
  getPlanById,
  getUsage,
  activateSubscription,
  changePlan,
  getHistory,
  listPlans,
  cancelSubscription,
  listPayments,
  // ✅ nuevos imports
  deleteHistoryEvent,
  clearHistory,
} from "../billing/service";
import type { Subscription, Usage, Plan, PlanId, HistoryEvent, Payment } from "../billing/types";
import "../../styles/dashboard.css";
import { useTenantContext } from "../tenant/hooks";

const pct = (used: number, max: number): number => Math.min(100, Math.round((used / max) * 100));
const levelClass = (p: number): string => (p >= 100 ? "alert" : p >= 80 ? "warn" : "ok");

const Progress: React.FC<{ label: string; used: number; max: number; unit?: string }> = ({
  label,
  used,
  max,
  unit,
}) => {
  const p = pct(used, max);
  return (
    <div className="usage-row">
      <div className="usage-head">
        <span>{label}</span>
        <span className={`usage-meta usage-meta--${levelClass(p)}`}>
          {used}
          {unit ? ` ${unit}` : ""} / {max}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="ui-progress">
        <div className={`ui-progress__bar ui-progress__bar--${levelClass(p)}`} style={{ inlineSize: `${p}%` }} />
      </div>
    </div>
  );
};

/* Tag acepta el estado definido en Subscription.state y lo mapea a label/clase */
const Tag: React.FC<{ s: Subscription["state"] }> = ({ s }) => {
  const map = {
    en_prueba: { cls: "trial", label: "Trial" },
    activo: { cls: "active", label: "Activo" },
    cancelado: { cls: "canceled", label: "Cancelado" },
  } as const;
  const info = map[s] ?? map.en_prueba;
  return <span className={`tag tag--${info.cls}`}>{info.label}</span>;
};

const SubscriptionPage: React.FC = () => {
  const { current: tenant } = useTenantContext();
  const tenantId = tenant?.id;

  const [sub, setSub] = React.useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [hist, setHist] = useState<HistoryEvent[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // estado para eliminar historial / eventos
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [s, u, p] = await Promise.all([getSubscription(tenantId), getUsage(tenantId), listPlans()]);
        if (!mounted) return;
        setSub(s);
        setUsage(u);
        setPlans(p);
        const h = await getHistory(1, 15, tenantId);
        if (!mounted) return;
        setHist(h.results);
        const pay = await listPayments(tenantId);
        if (!mounted) return;
        setPayments(pay);
      } catch (e) {
        console.error("Billing load error:", e);
        if (mounted) setError("No se pudo cargar la información de suscripción.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  const plan = useMemo(() => (sub ? getPlanById(sub.planId) : null), [sub]);

  const activate = async () => {
    if (!sub) return;
    const ok = window.confirm("¿Activar suscripción ahora?");
    if (!ok) return;
    const next = await activateSubscription("usuario", tenantId);
    setSub(next);
  };

  const doChangePlan = async () => {
    if (!sub) return;
    const other = plans.filter((p) => p.id !== sub.planId);
    const text = `Cambiar plan actual (${sub.planId}) a:\n` + other.map((p) => `- ${p.id} (${p.name})`).join("\n");
    const val = window.prompt(text, other[0]?.id ?? "pro");
    const value = (val ?? "").trim() as PlanId;
    if (!other.some((p) => p.id === value)) return;
    const ok = window.confirm(`Confirmar cambio a ${value}?`);
    if (!ok) return;
    const next = await changePlan(value, "usuario", tenantId);
    setSub(next);
  };

  const deactivate = async () => {
    if (!sub) return;
    if (!window.confirm("¿Desactivar (cancelar) tu suscripción?")) return;
    const next = await cancelSubscription("usuario", tenantId);
    setSub(next);
  };

  const reactivate = async () => {
    if (!sub) return;
    if (!window.confirm("¿Reactivar suscripción ahora?")) return;
    const next = await activateSubscription("usuario", tenantId);
    setSub(next);
  };

  // 🗑️ eliminar un evento
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("¿Eliminar este evento del historial?")) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteHistoryEvent(id, "usuario");
      setHist((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el evento. Intenta de nuevo.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // 🧹 eliminar todo el historial
  const handleClearHistory = async () => {
    if (hist.length === 0) return;
    if (
      !window.confirm(
        `¿Eliminar todo el historial (${hist.length} eventos)? Esta acción no se puede deshacer.`
      )
    )
      return;
    setClearing(true);
    try {
      await clearHistory("usuario");
      setHist([]);
    } catch (err) {
      console.error(err);
      alert("No se pudo limpiar el historial. Intenta de nuevo.");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="ui-cell--center">Cargando suscripción…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <div className="ui-cell--muted">{error}</div>
      </section>
    );
  }

  if (!sub || !plan || !usage) {
    return (
      <section className="page">
        <h1 className="ui-title">Mi suscripción</h1>
        <div className="ui-cell--muted">
          Aún no tienes suscripción activa. Ve a <strong>Planes</strong> para iniciar un trial.
        </div>
      </section>
    );
  }

  const limits = plan.limits;

  return (
    <section className="page">
      <h1 className="ui-title">Mi suscripción</h1>

      <div className="card sub-card">
        <header className="sub-header">
          <div>
            <div className="sub-org">{sub.orgName}</div>
            <div className="sub-plan">
              {plan.name} · <Tag s={sub.state} />{" "}
              {sub.state === "en_prueba" && sub.trialEndsAt ? (
                <span className="ui-meta">· Finaliza: {new Date(sub.trialEndsAt).toLocaleDateString()}</span>
              ) : null}
            </div>
          </div>
          <div className="sub-actions">
            {sub.state === "en_prueba" && (
              <button className="ui-btn" onClick={activate}>
                Activar suscripción
              </button>
            )}

            {sub.state !== "cancelado" ? (
              <button className="ui-btn ui-btn--danger" onClick={deactivate}>
                Desactivar
              </button>
            ) : (
              <button className="ui-btn" onClick={reactivate}>
                Reactivar
              </button>
            )}

            <button className="ui-btn ui-btn--ghost" onClick={doChangePlan} disabled={sub.state === "cancelado"}>
              Cambiar plan
            </button>
          </div>
        </header>

        <div className="sub-usage">
          <Progress label="Usuarios" used={usage.users} max={limits.maxUsers} />
          <Progress label="Solicitudes/mes" used={usage.requests} max={limits.maxRequests} />
          <Progress label="Almacenamiento" used={usage.storageGB} max={limits.maxStorageGB} unit="GB" />
        </div>

        {hist.length > 0 && (
          <>
            <div className="sub-h3-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h3 className="sub-h3" style={{ margin: 0 }}>
                Historial
              </h3>
              <button
                className="ui-btn ui-btn--danger"
                onClick={handleClearHistory}
                disabled={clearing}
                aria-disabled={clearing}
                style={{ marginInlineStart: "auto" }}
                title="Eliminar todo el historial"
              >
                {clearing ? "Eliminando…" : "Eliminar historial"}
              </button>
            </div>

            <div className="history">
              {hist.map((e) => {
                const isDeleting = deletingIds.has(e.id);
                return (
                  <div key={e.id} className="history-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="history-main" style={{ flex: 1 }}>
                      <div className="history-action">{e.action}</div>
                      <div className="history-meta">{new Date(e.at).toLocaleString()} · {e.actor}</div>
                    </div>

                    <div className="history-actions">
                      <button
                        className="link-button"
                        onClick={() => handleDeleteEvent(e.id)}
                        disabled={isDeleting}
                        aria-disabled={isDeleting}
                        title="Eliminar este evento"
                      >
                        {isDeleting ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h3>Pagos</h3>
        {payments.length === 0 ? (
          <div>No hay pagos registrados.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Período</th>
                <th>Método</th>
                <th>ID externo</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id}>
                  <td>{new Date(pay.createdAt).toLocaleString()}</td>
                  <td>
                    {(pay.amountCents / 100).toFixed(2)} {pay.currency.toUpperCase()}
                  </td>
                  <td>
                    {pay.periodStart ? new Date(pay.periodStart).toLocaleDateString() : "-"} —{" "}
                    {pay.periodEnd ? new Date(pay.periodEnd).toLocaleDateString() : "-"}
                  </td>
                  <td>{pay.method}</td>
                  <td>{pay.externalId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default SubscriptionPage;
