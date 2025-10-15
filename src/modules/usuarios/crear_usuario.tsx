// src/modules/usuarios/crear_usuario.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";

interface UserForm {
  // Información personal
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  telefono: string;
  
  // Información laboral
  cargo: string;
  departamento: string;
  fecha_ingreso: string;
  
  // Configuración de cuenta
  is_active: boolean;
  is_staff: boolean;
  user_permissions: string[];
  
  // Avatar
  avatar?: string;
}

// Permisos organizados por grupos
const PERMISSION_GROUPS = {
  usuarios: {
    name: "👥 Gestión de Usuarios",
    permissions: [
      { id: "add_user", name: "Crear usuarios" },
      { id: "change_user", name: "Editar usuarios" },
      { id: "delete_user", name: "Eliminar usuarios" },
      { id: "view_user", name: "Ver usuarios" },
    ]
  },
  creditos: {
    name: "💰 Gestión de Créditos",
    permissions: [
      { id: "add_credito", name: "Crear créditos" },
      { id: "change_credito", name: "Editar créditos" },
      { id: "delete_credito", name: "Eliminar créditos" },
      { id: "view_credito", name: "Ver créditos" },
      { id: "approve_credito", name: "Aprobar créditos" },
    ]
  },
  pagos: {
    name: "💳 Gestión de Pagos",
    permissions: [
      { id: "add_pago", name: "Registrar pagos" },
      { id: "change_pago", name: "Editar pagos" },
      { id: "delete_pago", name: "Eliminar pagos" },
      { id: "view_pago", name: "Ver pagos" },
    ]
  },
  reportes: {
    name: "📊 Reportes y Análisis",
    permissions: [
      { id: "view_reports", name: "Ver reportes" },
      { id: "export_reports", name: "Exportar reportes" },
      { id: "advanced_reports", name: "Reportes avanzados" },
    ]
  },
  administracion: {
    name: "⚙️ Administración",
    permissions: [
      { id: "backup_data", name: "Crear backups" },
      { id: "restore_data", name: "Restaurar datos" },
      { id: "view_logs", name: "Ver auditoría" },
      { id: "manage_settings", name: "Configurar sistema" },
    ]
  }
};

const DEPARTAMENTOS = [
  "Comercial",
  "Finanzas", 
  "Recursos Humanos",
  "Tecnología",
  "Administración",
  "Operaciones"
];

const CARGOS = [
  "Gerente",
  "Supervisor", 
  "Analista",
  "Asistente",
  "Coordinador",
  "Especialista"
];

const CrearUsuarioPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const [form, setForm] = useState<UserForm>({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    telefono: "",
    cargo: "",
    departamento: "",
    fecha_ingreso: new Date().toISOString().split('T')[0],
    is_active: true,
    is_staff: false,
    user_permissions: ["view_user", "view_credito", "view_pago"],
    avatar: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setForm(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Auto-generar username desde email
    if (name === "email" && value.includes("@")) {
      const username = value.split("@")[0];
      setForm(prev => ({
        ...prev,
        username: prev.username || username
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setForm(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      user_permissions: checked 
        ? [...prev.user_permissions, permissionId]
        : prev.user_permissions.filter(p => p !== permissionId)
    }));
  };

  const toggleGroupPermissions = (groupKey: string, checked: boolean) => {
    const groupPermissions = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS].permissions.map(p => p.id);
    
    setForm(prev => ({
      ...prev,
      user_permissions: checked
        ? [...new Set([...prev.user_permissions, ...groupPermissions])]
        : prev.user_permissions.filter(p => !groupPermissions.includes(p))
    }));
  };

  const isGroupSelected = (groupKey: string) => {
    const groupPermissions = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS].permissions.map(p => p.id);
    return groupPermissions.every(p => form.user_permissions.includes(p));
  };

  const isGroupPartiallySelected = (groupKey: string) => {
    const groupPermissions = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS].permissions.map(p => p.id);
    const selectedCount = groupPermissions.filter(p => form.user_permissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < groupPermissions.length;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(form.first_name && form.last_name && form.email);
      case 2:
        return !!(form.cargo && form.departamento);
      case 3:
        return true; // Siempre válido, permisos son opcionales
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      setMessage({ text: "Por favor complete todos los campos obligatorios", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2)) {
      setMessage({ text: "Por favor complete todos los campos obligatorios", type: "error" });
      return;
    }

    setLoading(true);

    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "user_created",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: `Usuario creado: ${form.first_name} ${form.last_name} (${form.email})`
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));

      setMessage({ text: "Usuario creado exitosamente", type: "success" });
      
      setTimeout(() => {
        navigate("/app/usuarios");
      }, 2000);

    } catch (error) {
      setMessage({ text: "Error al crear el usuario", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getStepClass = (step: number) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "active";
    return "pending";
  };

  return (
    <section className="page">
      <div style={{ marginBottom: "32px" }}>
        <h1 className="ui-title">👤 Crear Nuevo Usuario</h1>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          Complete la información del nuevo usuario en 3 sencillos pasos
        </p>
        
        {/* Progress Steps */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          marginBottom: "32px",
          gap: "24px"
        }}>
          {[1, 2, 3].map((step) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: step <= currentStep ? "#3b82f6" : "#e5e7eb",
                color: step <= currentStep ? "white" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "16px"
              }}>
                {step < currentStep ? "✓" : step}
              </div>
              <span style={{ 
                color: step <= currentStep ? "#3b82f6" : "#9ca3af",
                fontWeight: step === currentStep ? "bold" : "normal"
              }}>
                {step === 1 && "Información Personal"}
                {step === 2 && "Información Laboral"}
                {step === 3 && "Permisos y Configuración"}
              </span>
              {step < 3 && (
                <div style={{
                  width: "60px",
                  height: "2px",
                  backgroundColor: step < currentStep ? "#3b82f6" : "#e5e7eb",
                  marginLeft: "16px"
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: "24px" }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          {/* Paso 1: Información Personal */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ marginBottom: "24px", color: "#1f2937" }}>
                👤 Información Personal
              </h3>
              
              {/* Avatar */}
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{ 
                  width: "120px", 
                  height: "120px", 
                  borderRadius: "50%", 
                  margin: "0 auto 16px",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "4px solid #e5e7eb",
                  position: "relative"
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "48px", color: "#9ca3af" }}>👤</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="ui-btn ui-btn--ghost">
                  📷 Seleccionar Foto
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Ej: Juan Carlos"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellido *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Ej: Pérez González"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Ej: juan.perez@empresa.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nombre de Usuario</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Se genera automáticamente"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="Ej: +591 70123456"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Ingreso</label>
                  <input
                    type="date"
                    name="fecha_ingreso"
                    value={form.fecha_ingreso}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Información Laboral */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ marginBottom: "24px", color: "#1f2937" }}>
                💼 Información Laboral
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label>Cargo *</label>
                  <select
                    name="cargo"
                    value={form.cargo}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar cargo</option>
                    {CARGOS.map(cargo => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Departamento *</label>
                  <select
                    name="departamento"
                    value={form.departamento}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar departamento</option>
                    {DEPARTAMENTOS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ 
                marginTop: "32px", 
                padding: "20px", 
                backgroundColor: "#f8fafc", 
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <h4 style={{ marginBottom: "16px", color: "#475569" }}>⚙️ Configuración de Cuenta</h4>
                
                <div style={{ display: "flex", gap: "24px" }}>
                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />
                    <span>✅ Usuario activo</span>
                  </label>

                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      name="is_staff"
                      checked={form.is_staff}
                      onChange={handleChange}
                    />
                    <span>👑 Es administrador</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Permisos */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ marginBottom: "24px", color: "#1f2937" }}>
                🔐 Permisos y Privilegios
              </h3>
              
              <p style={{ color: "#6b7280", marginBottom: "24px" }}>
                Seleccione los permisos que tendrá este usuario en el sistema
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                  const isSelected = isGroupSelected(groupKey);
                  const isPartial = isGroupPartiallySelected(groupKey);
                  
                  return (
                    <div 
                      key={groupKey}
                      style={{ 
                        border: "2px solid #e5e7eb", 
                        borderRadius: "12px", 
                        padding: "20px",
                        backgroundColor: isSelected ? "#f0f9ff" : isPartial ? "#fefce8" : "#ffffff",
                        borderColor: isSelected ? "#0ea5e9" : isPartial ? "#eab308" : "#e5e7eb"
                      }}
                    >
                      <div style={{ marginBottom: "16px" }}>
                        <label className="checkbox-group" style={{ fontSize: "16px", fontWeight: "bold" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleGroupPermissions(groupKey, e.target.checked)}
                            style={{ transform: "scale(1.2)" }}
                          />
                          <span>{group.name}</span>
                          {isPartial && (
                            <span style={{ 
                              fontSize: "12px", 
                              color: "#eab308", 
                              marginLeft: "8px" 
                            }}>
                              (Parcial)
                            </span>
                          )}
                        </label>
                      </div>
                      
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                        gap: "12px",
                        marginLeft: "24px"
                      }}>
                        {group.permissions.map(permission => (
                          <label key={permission.id} className="checkbox-group">
                            <input
                              type="checkbox"
                              checked={form.user_permissions.includes(permission.id)}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            />
                            <span style={{ fontSize: "14px" }}>{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ 
            marginTop: "32px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb"
          }}>
            <div>
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="ui-btn ui-btn--ghost"
                >
                  ← Anterior
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                type="button" 
                onClick={() => navigate("/app/usuarios")}
                className="ui-btn ui-btn--ghost"
              >
                Cancelar
              </button>
              
              {currentStep < 3 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="ui-btn"
                  disabled={!validateStep(currentStep)}
                >
                  Siguiente →
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="ui-btn"
                  disabled={loading}
                >
                  {loading ? "⏳ Creando..." : "✅ Crear Usuario"}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default CrearUsuarioPage;