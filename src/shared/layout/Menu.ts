// Tipos simples del menú
export type MenuItem = {
  label: string;
  path: string;         // ruta para <NavLink to=...>
  icon?: string;        // emoji o nombre de icono si luego usas librería
  exact?: boolean;      // si debe hacer match exacto (para "/")
};

// Menú principal del sidebar - CORREGIR rutas para app anidado
export const MENU: MenuItem[] = [
  { label: "Dashboard", path: "/", icon: "🏠", exact: true },
  { label: "Usuarios", path: "/usuarios", icon: "👥" },
  { label: "Créditos", path: "/creditos", icon: "💰" },
  { label: "Pagos", path: "/pagos", icon: "💳" },
  { label: "Planes", path: "/planes", icon: "📊" },
  { label: "Configuración", path: "/configuracion", icon: "⚙️" },
];
