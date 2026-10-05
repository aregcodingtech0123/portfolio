import { buildLegacyTheme, type StudioTheme } from "sanity";

/**
 * Flat dark studio theme built from the portfolio's design tokens (dark mode values).
 */
export const studioTheme: StudioTheme = buildLegacyTheme({
  "--black": "#0a0c0f",
  "--white": "#e8ebee",

  "--gray": "#8a94a0",
  "--gray-base": "#8a94a0",

  "--component-bg": "#11151a",
  "--component-text-color": "#e8ebee",

  "--brand-primary": "#5bf29b",

  "--default-button-color": "#8a94a0",
  "--default-button-primary-color": "#5bf29b",
  "--default-button-success-color": "#5bf29b",
  "--default-button-warning-color": "#e5b567",
  "--default-button-danger-color": "#ff5c57",

  "--main-navigation-color": "#0a0c0f",
  "--main-navigation-color--inverted": "#e8ebee",

  "--focus-color": "#5bf29b",
});
