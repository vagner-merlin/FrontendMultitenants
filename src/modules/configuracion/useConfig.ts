import { useState, useEffect, useCallback } from "react";
import type { ConfigState, AppearanceConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

const STORAGE_KEY = "app.config";

export function useConfig() {
  const [config, setConfig] = useState<ConfigState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const updateAppearance = useCallback((updates: Partial<AppearanceConfig>) => {
    setConfig(prev => ({
      ...prev,
      appearance: { ...prev.appearance, ...updates }
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  // Aplicar CSS custom properties al document
  useEffect(() => {
    const { appearance } = config;
    const root = document.documentElement;

    // Tema
    root.setAttribute("data-theme", appearance.theme);

    // Colores de acento
    const accentColors = {
      blue: { primary: "#3b82f6", secondary: "#1e40af" },
      purple: { primary: "#8b5cf6", secondary: "#7c3aed" },
      green: { primary: "#10b981", secondary: "#059669" },
      orange: { primary: "#f59e0b", secondary: "#d97706" },
      pink: { primary: "#ec4899", secondary: "#db2777" }
    };
    const colors = accentColors[appearance.accentColor];
    root.style.setProperty("--accent-primary", colors.primary);
    root.style.setProperty("--accent-secondary", colors.secondary);

    // Tamaño de fuente
    const fontSizes = { small: "14px", medium: "16px", large: "18px" };
    root.style.setProperty("--base-font-size", fontSizes[appearance.fontSize]);

    // Ancho del sidebar
    const sidebarWidths = { compact: "180px", normal: "220px", wide: "280px" };
    root.style.setProperty("--sidebar-width", sidebarWidths[appearance.sidebarWidth]);

    // Densidad (espaciado)
    const densities = { 
      compact: { padding: "8px", gap: "6px" },
      comfortable: { padding: "12px", gap: "8px" },
      spacious: { padding: "16px", gap: "12px" }
    };
    const density = densities[appearance.density];
    root.style.setProperty("--ui-padding", density.padding);
    root.style.setProperty("--ui-gap", density.gap);

    // Border radius
    const borderRadii = { sharp: "0px", rounded: "8px", "extra-rounded": "16px" };
    root.style.setProperty("--ui-border-radius", borderRadii[appearance.borderRadius]);

    // Animaciones
    root.style.setProperty("--animations", appearance.animations ? "all 0.2s ease" : "none");

  }, [config]);

  return {
    config,
    appearance: config.appearance,
    updateAppearance,
    resetToDefaults
  };
}