import { buildLegacyTheme, type StudioTheme } from "sanity";

/**
 * Premium dark studio theme aligned with the portfolio's sky/cyan glass aesthetic.
 */
export const studioTheme: StudioTheme = buildLegacyTheme({
  "--black": "#030712",
  "--white": "#f8fafc",

  "--gray": "#64748b",
  "--gray-base": "#64748b",

  "--component-bg": "#0f172a",
  "--component-text-color": "#e2e8f0",

  "--brand-primary": "#38bdf8",

  "--default-button-color": "#94a3b8",
  "--default-button-primary-color": "#0ea5e9",
  "--default-button-success-color": "#14b8a6",
  "--default-button-warning-color": "#f59e0b",
  "--default-button-danger-color": "#f43f5e",

  "--main-navigation-color": "#020617",
  "--main-navigation-color--inverted": "#f1f5f9",

  "--focus-color": "#38bdf8",
});
