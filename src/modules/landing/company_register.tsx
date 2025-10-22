// src/modules/landing/company_register.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/service";
import "../../styles/auth.css";

// Tipos basados en el endpoint POST /api/register/empresa-user/
interface RegistrationForm {
  // Datos de la empresa
  razon_social: string;
  email_contacto: string;
  nombre_comercial: string;
  imagen_url_empresa: string;
  
  // Datos del usuario administrador
  username: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  email: string;
  imagen_url_perfil: string;
  
  // Plan seleccionado (para después del registro)
  selected_plan: string;
}

const CompanyRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCompanyAndUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const [form, setForm] = useState<RegistrationForm>({
    // Datos de la empresa
    razon_social: "",
    email_contacto: "",
    nombre_comercial: "",
    imagen_url_empresa: "",
    
    // Datos del usuario administrador
    username: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    email: "",
    imagen_url_perfil: "",
    
    // Plan seleccionado
    selected_plan: "basico", // Plan por defecto
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setForm(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Auto-completar campos relacionados
    if (name === "nombre_comercial" && !form.razon_social) {
      setForm(prev => ({
        ...prev,
        razon_social: value
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "imagen_url_empresa" | "imagen_url_perfil") => {
    const file = e.target.files?.[0];
    if (file) {
      // Por ahora solo guardamos el nombre del archivo
      // En un caso real, aquí subirías la imagen a un servidor y obtendrías la URL
      const fakeUrl = `https://ejemplo.com/uploads/${file.name}`;
      setForm(prev => ({
        ...prev,
        [field]: fakeUrl
      }));
    }
  };

  const validateForm = (): string | null => {
    // Validar datos de la empresa
    if (!form.nombre_comercial.trim()) return "El nombre comercial es requerido";
    if (!form.razon_social.trim()) return "La razón social es requerida";
    if (!form.email_contacto.trim()) return "El email de contacto es requerido";
    
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

      // Preparar datos para el endpoint
      const registrationData = {
        razon_social: form.razon_social,
        email_contacto: form.email_contacto,
        nombre_comercial: form.nombre_comercial,
        imagen_url_empresa: form.imagen_url_empresa,
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        imagen_url_perfil: form.imagen_url_perfil,
      };

      console.log("Datos de registro:", registrationData);

      // Llamar al servicio de registro
      const response = await registerCompanyAndUser(registrationData);
      
      console.log("Respuesta del registro:", response);
      
      if (response.success && response.empresa_id) {
        setMessage({ text: "Registro exitoso. Redirigiendo a selección de plan...", type: "success" });
        
        console.log("Redirigiendo a planes-seleccion con:", {
          empresa_id: response.empresa_id,
          selectedPlan: form.selected_plan,
          user: response.user
        });
        
        // Redirigir a selección de plan con los datos necesarios
        setTimeout(() => {
          navigate("/planes-seleccion", { 
            state: { 
              empresa_id: response.empresa_id,
              selectedPlan: form.selected_plan,
              user: response.user 
            },
            replace: true
          });
        }, 1500);
      } else {
        console.error("Error en respuesta:", response);
        setMessage({ text: response.message || "Error al registrar empresa", type: "error" });
      }

    } catch (error) {
      console.error("Error en registro:", error);
      setMessage({ text: "Error al registrar. Intente nuevamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-container">
      <div className="auth-box-modern" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Formulario principal */}
        <div className="auth-right" style={{ width: "100%" }}>
          <form className="auth-form-modern" onSubmit={handleSubmit} noValidate>
            <h2>Registro de Empresa</h2>
            <p>Complete los datos de su empresa y usuario administrador</p>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            {/* Datos de la Empresa */}
            <fieldset style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", marginBottom: "16px" }}>
              <legend style={{ fontWeight: "bold", color: "#1f2937" }}>🏢 Datos de la Empresa</legend>
              
              <div className="input-group">
                <span className="input-icon">🏢</span>
                <input
                  type="text"
                  name="nombre_comercial"
                  placeholder="Nombre comercial *"
                  value={form.nombre_comercial}
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
                <span className="input-icon">🖼️</span>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "imagen_url_empresa")}
                    style={{ display: "none" }}
                  />
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    {form.imagen_url_empresa ? "Logo cargado ✓" : "Subir logo de la empresa"}
                  </span>
                </label>
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

              <div className="input-group">
                <span className="input-icon">🖼️</span>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "imagen_url_perfil")}
                    style={{ display: "none" }}
                  />
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    {form.imagen_url_perfil ? "Foto de perfil cargada ✓" : "Subir foto de perfil"}
                  </span>
                </label>
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