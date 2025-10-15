/*
TenantChip: es solo un indicador/selector en el header que muestra 
el nombre de la organización (y opcionalmente plan/estado) 
y permite abrir un selector de organización al hacer click.
*/
// src/components/TenantChip.tsx
import React from "react";
import { useTenantContext } from "./hooks";

// Podemos mantener estos tipos para props específicas
type Status = "trial" | "active" | "canceled";

interface TenantChipProps {
  onClick?: () => void; // Solo necesitamos onClick como prop externa
}

const TenantChip: React.FC<TenantChipProps> = ({ onClick }) => {
  // Obtenemos los datos del tenant desde el contexto
  const { current } = useTenantContext();
  
  // Intentamos leer datos de suscripción del cache si existe
  const [subscription, setSubscription] = React.useState<{
    plan?: string;
    status?: Status | string;
    trialEndsAt?: string;
  } | undefined>(undefined);
  
  React.useEffect(() => {
    try {
      const cached = localStorage.getItem("cache.subscription");
      if (cached) {
        setSubscription(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Error al leer cache.subscription:", err);
    }
  }, []);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#f0f0f0",
        borderRadius: 16,
        padding: "4px 12px",
        cursor: onClick ? "pointer" : "default",
        fontSize: 14,
        marginLeft: 12,
        gap: 8,
      }}
      onClick={onClick}
      title={onClick ? "Cambiar organización" : undefined}
      data-testid="tenant-chip"
    >
      <span style={{ fontWeight: 600 }}>{current?.name ?? "Sin organización"}</span>
      {subscription?.plan && (
        <span style={{ color: "#888" }}>
          {subscription.plan} {subscription.status && `(${subscription.status})`}
        </span>
      )}
      {subscription?.trialEndsAt && (
        <span style={{ color: "#d77" }}>
          Trial hasta {new Date(subscription.trialEndsAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

export default TenantChip;