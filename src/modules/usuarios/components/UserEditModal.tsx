import { useEffect, useState } from "react";
import type { ReactElement, FormEvent } from "react";
import type { User } from "../types";
import { updateUser } from "../service";

type Props = {
  user: User | null;
  onClose: () => void;
  onSaved?: () => void;
};

export default function UserEditModal({ user, onClose, onSaved }: Props): ReactElement | null {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    role: "usuario" as User["role"]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre ?? "",
        email: user.email ?? "",
        telefono: user.telefono ?? "",
        role: user.role ?? "usuario"
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await updateUser(user.id, {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        role: form.role
      });
      onSaved?.();
      onClose();
    } catch {
      alert("No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-modal" role="dialog" aria-modal="true">
      <div className="ui-modal__content">
        <header className="ui-modal__header">
          <h3>Editar usuario</h3>
          <button className="ui-btn ui-btn--ghost" onClick={onClose}>×</button>
        </header>
        <div className="ui-modal__body">
          <form className="ui-form" onSubmit={handleSave}>
            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Nombre</label>
                <input className="ui-input" value={form.nombre} onChange={(e) => setForm(s => ({ ...s, nombre: e.target.value }))} />
              </div>
              <div className="ui-form__field">
                <label className="ui-label">Email</label>
                <input className="ui-input" type="email" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} />
              </div>
            </div>

            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Teléfono</label>
                <input className="ui-input" value={form.telefono} onChange={(e) => setForm(s => ({ ...s, telefono: e.target.value }))} />
              </div>
              <div className="ui-form__field">
                <label className="ui-label">Rol</label>
                <select className="ui-select" value={form.role} onChange={(e) => setForm(s => ({ ...s, role: e.target.value as User["role"] }))}>
                  <option value="superadmin">Superadmin</option>
                  <option value="administrador">Administrador</option>
                  <option value="gerente">Gerente</option>
                  <option value="contador">Contador</option>
                  <option value="usuario">Usuario</option>
                </select>
              </div>
            </div>

            <div className="ui-form__actions">
              <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}