// Tipos simples del menú
export type MenuItem = {
  label: string;
  path: string;         // ruta para <NavLink to=...>
  icon?: string;        // emoji o nombre de icono si luego usas librería
  exact?: boolean;      // si debe hacer match exacto (para "/")
};

// Menú principal del sidebar - Sistema SaaS Completo
export const MENU: MenuItem[] = [
  { label: "Dashboard", path: "/", icon: "🏠", exact: true },
  
  // Gestión de usuarios y roles (Punto 2)
  { label: "Crear Usuario", path: "/crear-usuario", icon: "👤" },
  { label: "Usuarios", path: "/usuarios", icon: "👥" },
  
  // Auditoría y logs (Punto 3)
  { label: "Historial de Actividades", path: "/actividades", icon: "📋" },
  
  // Módulos de negocio
  { label: "Créditos", path: "/creditos", icon: "💰" },
  { label: "Pagos", path: "/pagos", icon: "💳" },
  
  // Reportes avanzados (Punto 4)
  { label: "Reportes", path: "/reportes", icon: "📊" },
  
  // Personalización (Punto 6)
  { label: "Personalización", path: "/personalizacion", icon: "🎨" },
  
  // Dashboard de Ingresos (anteriormente Backup - Punto 7)
  { label: "Dashboard Ingresos", path: "/ingresos", icon: "�" },
  
  // Configuración general
  { label: "Configuración", path: "/configuracion", icon: "⚙️" },
];
