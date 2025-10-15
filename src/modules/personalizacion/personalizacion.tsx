// src/modules/personalizacion/personalizacion.tsx
import React, { useState, useEffect } from "react";
import "../../styles/dashboard.css";

interface PersonalizationSettings {
  // Apariencia
  theme: "light" | "dark";
  accent_color: string;
  font_size: "small" | "medium" | "large";
  sidebar_position: "left" | "right";
  
  // Idioma y región
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
  
  // Funcionalidades
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_widgets: string[];
  quick_actions: string[];
  
  // Empresa
  company_logo: string;
  company_name: string;
}

const AVAILABLE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green  
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6b7280", // gray
  "#1f2937", // dark
  "#059669", // emerald
];

const LANGUAGES = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
];

const TIMEZONES = [
  { value: "America/La_Paz", label: "La Paz (UTC-4)" },
  { value: "America/Santiago", label: "Santiago (UTC-3)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)" },
  { value: "UTC", label: "UTC (UTC+0)" },
];

const PersonalizacionPage: React.FC = () => {
  const [settings, setSettings] = useState<PersonalizationSettings>({
    theme: "light",
    accent_color: "#3b82f6",
    font_size: "medium",
    sidebar_position: "left",
    language: "es",
    timezone: "America/La_Paz",
    date_format: "DD/MM/YYYY",
    currency: "BOB",
    notifications_enabled: true,
    email_notifications: true,
    dashboard_widgets: ["stats", "recent_activities", "pending_approvals"],
    quick_actions: ["new_credit", "new_payment", "search_client"],
    company_logo: "",
    company_name: "Mi Empresa"
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  // Cargar configuración guardada
  useEffect(() => {
    const savedSettings = localStorage.getItem("personalization_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        setLogoPreview(parsed.company_logo || "");
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    }
  }, []);

  // Aplicar configuración en tiempo real
  useEffect(() => {
    applyThemeSettings();
  }, [settings]);

  const applyThemeSettings = () => {
    const root = document.documentElement;
    
    // Aplicar tema
    if (settings.theme === "dark") {
      root.classList.add("dark-theme");
    } else {
      root.classList.remove("dark-theme");
    }
    
    // Aplicar color de acento
    root.style.setProperty("--accent-color", settings.accent_color);
    
    // Aplicar tamaño de fuente
    const fontSizes = {
      small: "14px",
      medium: "16px", 
      large: "18px"
    };
    root.style.setProperty("--base-font-size", fontSizes[settings.font_size]);
    
    // Actualizar logo en localStorage para el sidebar
    localStorage.setItem("ui.company.logo", settings.company_logo);
    
    // Disparar evento para actualizar el sidebar
    window.dispatchEvent(new CustomEvent("personalization-updated"));
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        handleSettingChange("company_logo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem("personalization_settings", JSON.stringify(settings));
      
      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "settings_changed",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: "Configuración de personalización actualizada"
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));
      
      setMessage({ text: "Configuración guardada exitosamente", type: "success" });
      
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
      
    } catch (error) {
      setMessage({ text: "Error guardando la configuración", type: "error" });
    }
  };

  const resetSettings = () => {
    if (confirm("¿Está seguro de que desea restablecer toda la configuración?")) {
      const defaultSettings: PersonalizationSettings = {
        theme: "light",
        accent_color: "#3b82f6",
        font_size: "medium",
        sidebar_position: "left",
        language: "es",
        timezone: "America/La_Paz",
        date_format: "DD/MM/YYYY",
        currency: "BOB",
        notifications_enabled: true,
        email_notifications: true,
        dashboard_widgets: ["stats", "recent_activities", "pending_approvals"],
        quick_actions: ["new_credit", "new_payment", "search_client"],
        company_logo: "",
        company_name: "Mi Empresa"
      };
      
      setSettings(defaultSettings);
      setLogoPreview("");
      localStorage.removeItem("personalization_settings");
      localStorage.removeItem("ui.company.logo");
      
      setMessage({ text: "Configuración restablecida", type: "success" });
    }
  };

  return (
    <section className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="ui-title">🎨 Personalización</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={saveSettings} className="ui-btn">
            💾 Guardar Cambios
          </button>
          <button onClick={resetSettings} className="ui-btn ui-btn--ghost">
            🔄 Restablecer
          </button>
        </div>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Apariencia */}
        <div className="card">
          <h3>🎨 Apariencia</h3>
          
          <div className="form-group">
            <label>Tema</label>
            <div style={{ display: "flex", gap: "12px" }}>
              <label className="radio-group">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={settings.theme === "light"}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                />
                <span>☀️ Claro</span>
              </label>
              <label className="radio-group">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={settings.theme === "dark"}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                />
                <span>🌙 Oscuro</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Color de Acento</label>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{
                  width: "100%",
                  height: "40px",
                  backgroundColor: settings.accent_color,
                  border: "2px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold"
                }}
              >
                {settings.accent_color}
              </button>
              
              {showColorPicker && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  marginTop: "8px",
                  zIndex: 1000,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          handleSettingChange("accent_color", color);
                          setShowColorPicker(false);
                        }}
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: color,
                          border: settings.accent_color === color ? "3px solid #000" : "1px solid #e5e7eb",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Tamaño de Fuente</label>
            <select
              value={settings.font_size}
              onChange={(e) => handleSettingChange("font_size", e.target.value)}
            >
              <option value="small">Pequeño</option>
              <option value="medium">Mediano</option>
              <option value="large">Grande</option>
            </select>
          </div>
        </div>

        {/* Empresa */}
        <div className="card">
          <h3>🏢 Información de la Empresa</h3>
          
          <div className="form-group">
            <label>Nombre de la Empresa</label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => handleSettingChange("company_name", e.target.value)}
              placeholder="Mi Empresa"
            />
          </div>

          <div className="form-group">
            <label>Logo de la Empresa</label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ 
                width: "80px", 
                height: "80px", 
                borderRadius: "8px", 
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "2px dashed #d1d5db"
              }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "24px", color: "#9ca3af" }}>🏢</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="ui-btn ui-btn--ghost">
                  📁 Seleccionar Logo
                </label>
                {logoPreview && (
                  <button 
                    onClick={() => {
                      setLogoPreview("");
                      handleSettingChange("company_logo", "");
                    }}
                    className="ui-btn ui-btn--ghost"
                    style={{ marginLeft: "8px" }}
                  >
                    🗑️ Quitar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Idioma y Región */}
        <div className="card">
          <h3>🌍 Idioma y Región</h3>
          
          <div className="form-group">
            <label>Idioma</label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange("language", e.target.value)}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Zona Horaria</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSettingChange("timezone", e.target.value)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Formato de Fecha</label>
            <select
              value={settings.date_format}
              onChange={(e) => handleSettingChange("date_format", e.target.value)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div className="form-group">
            <label>Moneda</label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingChange("currency", e.target.value)}
            >
              <option value="BOB">BOB - Boliviano</option>
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="BRL">BRL - Real</option>
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="CLP">CLP - Peso Chileno</option>
            </select>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="card">
          <h3>🔔 Notificaciones</h3>
          
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => handleSettingChange("notifications_enabled", e.target.checked)}
              />
              <span>Habilitar notificaciones en el navegador</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) => handleSettingChange("email_notifications", e.target.checked)}
              />
              <span>Recibir notificaciones por email</span>
            </label>
          </div>
        </div>
      </div>

      {/* Vista previa */}
      <div className="card" style={{ marginTop: "24px" }}>
        <h3>👁️ Vista Previa</h3>
        <div style={{ 
          padding: "20px", 
          backgroundColor: settings.theme === "dark" ? "#1f2937" : "#ffffff",
          color: settings.theme === "dark" ? "#ffffff" : "#000000",
          borderRadius: "8px",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ width: "32px", height: "32px", borderRadius: "4px" }} />
            ) : (
              <div style={{ 
                width: "32px", 
                height: "32px", 
                backgroundColor: settings.accent_color, 
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold"
              }}>
                {settings.company_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: settings.font_size === "large" ? "18px" : settings.font_size === "small" ? "14px" : "16px" }}>
              {settings.company_name}
            </span>
          </div>
          
          <button style={{
            backgroundColor: settings.accent_color,
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: settings.font_size === "large" ? "16px" : settings.font_size === "small" ? "12px" : "14px"
          }}>
            Botón de Ejemplo
          </button>
        </div>
      </div>
    </section>
  );
};

export default PersonalizacionPage;