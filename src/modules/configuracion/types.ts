export interface AppearanceConfig {
  theme: "dark" | "light" | "auto";
  accentColor: "blue" | "purple" | "green" | "orange" | "pink";
  fontSize: "small" | "medium" | "large";
  sidebarWidth: "compact" | "normal" | "wide";
  density: "comfortable" | "compact" | "spacious";
  animations: boolean;
  borderRadius: "sharp" | "rounded" | "extra-rounded";
}

export interface ConfigState {
  appearance: AppearanceConfig;
  // futuro: notifications, locale, etc.
}

export const DEFAULT_CONFIG: ConfigState = {
  appearance: {
    theme: "dark",
    accentColor: "blue",
    fontSize: "medium",
    sidebarWidth: "normal",
    density: "comfortable",
    animations: true,
    borderRadius: "rounded"
  }
};