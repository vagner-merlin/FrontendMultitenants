// src/modules/billing/service.ts
import { nanoid } from "nanoid";
import { http, STORAGE_KEYS } from "../../shared/api/client";
import type { AxiosResponse } from "axios";
import type {
  Plan,
  PlanId,
  Subscription,
  Usage,
  HistoryEvent,
  HistoryPage,
  Payment,
  SubscriptionResponse,
  PaymentsResponse,
} from "./types";

/* catálogo inmutable de planes (mock/local) */
const PLANS: ReadonlyArray<Plan> = [
  { id: "basico", name: "Básico", priceUsd: 0, limits: { maxUsers: 3, maxRequests: 1000, maxStorageGB: 100 } },
  { id: "profesional", name: "Pro", priceUsd: 80, limits: { maxUsers: 20, maxRequests: 25000, maxStorageGB: 300 } },
  { id: "enterprise", name: "Enterprise", priceUsd: 300, limits: { maxUsers: 100, maxRequests: 60000, maxStorageGB: 1000 } },
] as const;

export function listPlans(): Promise<Plan[]> {
  return Promise.resolve(PLANS.slice());
}

export function getPlanById(id: PlanId): Plan {
  const p = PLANS.find((x) => x.id === id);
  if (!p) throw new Error("Plan no encontrado");
  return p;
}

/* Storage keys locales */
const LS_SUB_KEY = "billing.subscription";
const LS_PAYMENTS_KEY = "billing.payments";
const LS_USAGE_KEY = "billing.usage";
const LS_HIST_KEY = "billing.history";

/* helpers localStorage */
const loadJSON = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const saveJSON = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

/* tenantHeaders: añade X-Tenant-ID solo si hay tenant (evita preflight si vacío) */
function tenantHeaders(tenantId?: string): Record<string, string> | undefined {
  const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
  if (!id) return undefined;
  return { "X-Tenant-ID": id };
}

/* helper para añadir evento al historial local */
function pushLocalHistoryEvent(e: Omit<HistoryEvent, "id" | "at">) {
  const list = loadJSON<HistoryEvent[]>(LS_HIST_KEY) ?? [];
  const ev: HistoryEvent = { id: nanoid(), at: new Date().toISOString(), ...e };
  list.unshift(ev);
  saveJSON(LS_HIST_KEY, list);
}

/* =========================
   Suscripción / pagos / usage (mock + delegación a backend si existe)
   Las funciones usan el backend si responde, si no usan fallback local.
========================= */

export async function getSubscription(tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.get("/api/subscription", { headers: headers ?? { Authorization: "" } });
    return res.data?.subscription ?? null;
  } catch {
    // fallback local
    const all = loadJSON<Subscription[]>(LS_SUB_KEY) ?? [];
    return all.find((s) => s.tenantId === (tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT))) ?? null;
  }
}

export async function listPayments(tenantId?: string): Promise<Payment[]> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<PaymentsResponse> = await http.get("/api/subscription/payments", { headers: headers ?? { Authorization: "" } });
    return Array.isArray(res.data?.payments) ? res.data.payments : [];
  } catch {
    const all = loadJSON<Payment[]>(LS_PAYMENTS_KEY) ?? [];
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
    return id ? all.filter((p) => p.tenantId === id) : all;
  }
}

export async function createManualPayment(p: Omit<Payment, "id" | "createdAt"> & { tenantId?: string }): Promise<Payment> {
  const headers = tenantHeaders(p.tenantId);
  try {
    const res: AxiosResponse<{ payment: Payment }> = await http.post("/api/subscription/payments/create", p, { headers: headers ?? { Authorization: "" } });
    if (res.data?.payment) return res.data.payment;
  } catch {
    // fallback: continue to create local
  }
  const now = new Date().toISOString();
  const payment: Payment = {
    id: nanoid(),
    tenantId: p.tenantId ?? (localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown"),
    amountCents: p.amountCents,
    currency: p.currency,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    method: p.method,
    externalId: p.externalId,
    createdAt: now,
  };
  const existing = loadJSON<Payment[]>(LS_PAYMENTS_KEY) ?? [];
  existing.push(payment);
  saveJSON(LS_PAYMENTS_KEY, existing);
  return payment;
}

/* Usage */
export async function getUsage(tenantId?: string): Promise<Usage | null> {
  try {
    const headers = tenantHeaders(tenantId);
    const res: AxiosResponse<Usage> = await http.get("/api/subscription/usage", { headers: headers ?? { Authorization: "" } });
    return res.data ?? null;
  } catch {
    const all = loadJSON<Usage[]>(LS_USAGE_KEY) ?? [];
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
    if (!id) return null;
    return all.find((u) => u.tenantId === id) ?? {
      tenantId: id,
      users: 1,
      requests: 20,
      storageGB: 1,
      measuredAt: new Date().toISOString(),
    };
  }
}

/* Change plan / activate / cancel (actualiza storage local y intenta backend) */
async function saveLocalSubscription(s: Subscription): Promise<void> {
  const all = loadJSON<Subscription[]>(LS_SUB_KEY) ?? [];
  const idx = all.findIndex((x) => x.tenantId === s.tenantId);
  if (idx >= 0) all[idx] = s;
  else all.push(s);
  saveJSON(LS_SUB_KEY, all);
}

export async function activateSubscription(actor: string, tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post("/api/subscription/activate", { actor }, { headers: headers ?? { Authorization: "" } });
    return res.data?.subscription ?? null;
  } catch {
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown";
    const current = (await getSubscription(id)) ?? {
      id: nanoid(),
      tenantId: id,
      planId: "basico" as PlanId,
      state: "en_prueba",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      startedAt: new Date().toISOString(),
      orgName: localStorage.getItem(STORAGE_KEYS.TENANT) ?? id,
    };
    current.state = "activo";
    current.startedAt = new Date().toISOString();
    await saveLocalSubscription(current);

    // registrar evento en historial local usando actor
    pushLocalHistoryEvent({ tenantId: id, action: "activate_subscription", actor, meta: { planId: current.planId } });

    return current;
  }
}

export async function changePlan(newPlan: PlanId, actor: string, tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post("/api/subscription/change-plan", { newPlan, actor }, { headers: headers ?? { Authorization: "" } });
    return res.data?.subscription ?? null;
  } catch {
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown";
    const sub = (await getSubscription(id)) ?? {
      id: nanoid(),
      tenantId: id,
      planId: newPlan,
      state: "activo", // <-- literal
      orgName: id,
      startedAt: new Date().toISOString(),
    };
    const old = sub.planId;
    sub.planId = newPlan;
    await saveLocalSubscription(sub);

    // registrar evento en historial local usando actor y meta con plan antiguo/nuevo
    pushLocalHistoryEvent({ tenantId: id, action: "change_plan", actor, meta: { from: old, to: newPlan } });

    return sub;
  }
}

export async function cancelSubscription(actor: string, tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post("/api/subscription/cancel", { actor }, { headers: headers ?? { Authorization: "" } });
    return res.data?.subscription ?? null;
  } catch {
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown";
    const sub = (await getSubscription(id));
    if (!sub) return null;
    sub.state = "cancelado"; // <-- literal
    sub.cancelledAt = new Date().toISOString();
    await saveLocalSubscription(sub);

    // registrar evento en historial local usando actor
    pushLocalHistoryEvent({ tenantId: id, action: "cancel_subscription", actor, meta: { planId: sub.planId } });

    return sub;
  }
}

/* Historial */
export async function getHistory(page = 1, pageSize = 20, tenantId?: string): Promise<HistoryPage> {
  try {
    const headers = tenantHeaders(tenantId);
    const res: AxiosResponse<HistoryPage> = await http.get("/api/subscription/history", { headers: headers ?? { Authorization: "" }, params: { page, pageSize } });
    return res.data;
  } catch {
    const all = loadJSON<HistoryEvent[]>(LS_HIST_KEY) ?? [];
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
    const filtered = id ? all.filter((h) => h.tenantId === id) : all;
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);
    return { results, total, page, pageSize };
  }
}

export async function deleteHistoryEvent(id: string, actor: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
  const all = loadJSON<HistoryEvent[]>(LS_HIST_KEY) ?? [];
  saveJSON(LS_HIST_KEY, all.filter((e) => e.id !== id));
  // opcional: registrar eliminación por actor
  pushLocalHistoryEvent({ tenantId: localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown", action: "delete_history_event", actor, meta: { deletedId: id } });
}

export async function clearHistory(actor: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
  saveJSON(LS_HIST_KEY, []);
  pushLocalHistoryEvent({ tenantId: localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown", action: "clear_history", actor, meta: {} });
}

/* detalles textuales por plan (usado por la UI) */
export function getPlanDetails(id: PlanId): string[] {
  const common = [
    "Workflow de gestión financiera",
    "Contabilidad básica y reportes",
    "Integraciones con pasarelas de pago",
  ];
  switch (id) {
    case "basico":
      return [...common, "1 espacio de trabajo", "Usuarios limitados", "Reportes mensuales"];
    case "profesional":
      return [...common, "Multi-tenant", "Reportes avanzados y exportes", "Soporte prioritario"];
    case "enterprise":
      return [...common, "Integraciones SSO", "SLA personalizado", "Onboarding dedicado"];
    default:
      return common;
  }
}

/**
 * Inicia un trial para el tenant actual (o tenantId opcional).
 * - Intenta llamar al backend; si falla, crea/actualiza el registro en localStorage.
 * - Registra evento en historial local.
 */
export async function startTrial(planId: PlanId, orgName: string, actor: string, tenantId?: string): Promise<Subscription> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post(
      "/api/subscription/start-trial",
      { planId, orgName, actor },
      { headers: headers ?? { Authorization: "" } }
    );
    if (res.data?.subscription) {
      await saveLocalSubscription(res.data.subscription);
      pushLocalHistoryEvent({ tenantId: res.data.subscription.tenantId, action: "start_trial", actor, meta: { planId } });
      return res.data.subscription;
    }
  } catch {
    // fallback local
  }

  const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? `org_local_${Date.now()}`;
  const sub: Subscription = {
    id: nanoid(),
    tenantId: id,
    planId,
    state: "en_prueba",
    orgName,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  };
  await saveLocalSubscription(sub);
  pushLocalHistoryEvent({ tenantId: id, action: "start_trial", actor, meta: { planId } });
  return sub;
}
