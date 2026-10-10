import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// jsdom has no IntersectionObserver at all. The shared <Section> wrapper
// (src/components/ui/Section.tsx, used by nearly every section component)
// always passes Framer Motion a `viewport` prop regardless of reduced
// motion, so Framer Motion always tries to observe on mount and throws
// "IntersectionObserver is not defined" without this. The on-scroll trigger
// behavior itself is never exercised under jsdom either way; this stub only
// exists so components that merely contain a <Section> can mount.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

window.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

afterEach(() => {
  cleanup();
  // jsdom keeps one window (and its storage) alive across every test in a
  // file, so a test that writes to localStorage would otherwise leak into
  // the next one and make results depend on run order.
  window.localStorage.clear();
});

beforeEach(() => {
  // jsdom doesn't evaluate real media queries. Framer Motion's
  // useReducedMotion, and src/lib/theme.ts's systemMode, both call
  // matchMedia directly, so tests need a deterministic stand-in instead of
  // jsdom's default (which throws "not implemented").
  //
  // Default: report reduced motion as active (so AnimatePresence takes its
  // near-instant transition branch instead of leaving an exit animation
  // mounted for the next assertion to race against) and every other query,
  // including prefers-color-scheme, as not matching. A test that needs a
  // specific matchMedia answer (e.g. exercising systemMode()'s light
  // branch) should override this locally with vi.spyOn / mockReturnValueOnce
  // rather than relying on this default.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
