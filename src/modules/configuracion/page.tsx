import React from "react";
import { useConfig } from "./useConfig";
import type { AppearanceConfig } from "./types";

const ConfigurationPage: React.FC = () => {
  const { appearance, updateAppearance, resetToDefaults } = useConfig();

  const handleSelectChange = <K extends keyof AppearanceConfig>(
    key: K,
    value: AppearanceConfig[K]
  ) => {
    updateAppearance({ [key]: value });
  };

  const handleToggle = (key: keyof AppearanceConfig) => {
    updateAppearance({ [key]: !appearance[key] });
  };

  return (
    <div className="page">
      <div className="ui-page__header">
        <h1 className="ui-title">Configuración de Apariencia</h1>
        <p className="ui-page__description">
          Personaliza la apariencia y el comportamiento de la aplicación.
        </p>
      </div>

      <div className="config-grid">
        {/* Tema */}
        <div className="config-section">
          <h3 className="config-section__title">Tema</h3>
          <div className="config-options">
            {(["dark", "light", "auto"] as const).map(theme => (
              <label key={theme} className="config-option">
                <input
                  type="radio"
                  name="theme"
                  checked={appearance.theme === theme}
                  onChange={() => handleSelectChange("theme", theme)}
                />
                <span className="config-option__label">
                  {theme === "dark" ? "Oscuro" : theme === "light" ? "Claro" : "Automático"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Color de acento */}
        <div className="config-section">
          <h3 className="config-section__title">Color de acento</h3>
          <div className="config-colors">
            {(["blue", "purple", "green", "orange", "pink"] as const).map(color => (
              <button
                key={color}
                className={`config-color ${appearance.accentColor === color ? "config-color--active" : ""}`}
                data-color={color}
                onClick={() => handleSelectChange("accentColor", color)}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Tamaño de fuente */}
        <div className="config-section">
          <h3 className="config-section__title">Tamaño de fuente</h3>
          <div className="config-options">
            {(["small", "medium", "large"] as const).map(size => (
              <label key={size} className="config-option">
                <input
                  type="radio"
                  name="fontSize"
                  checked={appearance.fontSize === size}
                  onChange={() => handleSelectChange("fontSize", size)}
                />
                <span className="config-option__label">
                  {size === "small" ? "Pequeño" : size === "medium" ? "Mediano" : "Grande"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Ancho del sidebar */}
        <div className="config-section">
          <h3 className="config-section__title">Ancho del menú</h3>
          <div className="config-options">
            {(["compact", "normal", "wide"] as const).map(width => (
              <label key={width} className="config-option">
                <input
                  type="radio"
                  name="sidebarWidth"
                  checked={appearance.sidebarWidth === width}
                  onChange={() => handleSelectChange("sidebarWidth", width)}
                />
                <span className="config-option__label">
                  {width === "compact" ? "Compacto" : width === "normal" ? "Normal" : "Ancho"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Densidad */}
        <div className="config-section">
          <h3 className="config-section__title">Densidad del contenido</h3>
          <div className="config-options">
            {(["compact", "comfortable", "spacious"] as const).map(density => (
              <label key={density} className="config-option">
                <input
                  type="radio"
                  name="density"
                  checked={appearance.density === density}
                  onChange={() => handleSelectChange("density", density)}
                />
                <span className="config-option__label">
                  {density === "compact" ? "Compacto" : density === "comfortable" ? "Cómodo" : "Espacioso"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Bordes redondeados */}
        <div className="config-section">
          <h3 className="config-section__title">Bordes redondeados</h3>
          <div className="config-options">
            {(["sharp", "rounded", "extra-rounded"] as const).map(radius => (
              <label key={radius} className="config-option">
                <input
                  type="radio"
                  name="borderRadius"
                  checked={appearance.borderRadius === radius}
                  onChange={() => handleSelectChange("borderRadius", radius)}
                />
                <span className="config-option__label">
                  {radius === "sharp" ? "Rectos" : radius === "rounded" ? "Redondeados" : "Muy redondeados"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Animaciones */}
        <div className="config-section">
          <h3 className="config-section__title">Animaciones</h3>
          <label className="config-toggle">
            <input
              type="checkbox"
              checked={appearance.animations}
              onChange={() => handleToggle("animations")}
            />
            <span className="config-toggle__slider" />
            <span className="config-toggle__label">Habilitar animaciones</span>
          </label>
        </div>
      </div>

      <div className="config-actions">
        <button className="ui-btn ui-btn--ghost" onClick={resetToDefaults}>
          Restaurar valores predeterminados
        </button>
      </div>
    </div>
  );
};

export default ConfigurationPage;