import type { LayoutProps } from "sanity";

const glassStyles = `
  [data-ui="Navbar"],
  [data-ui="PaneHeader"] {
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
  }

  [data-ui="Card"],
  [data-ui="Dialog"] {
    border-radius: 16px;
    border: 1px solid rgba(56, 189, 248, 0.12);
    box-shadow: 0 16px 48px rgba(2, 6, 23, 0.45);
  }

  [data-ui="Navbar"] {
    border-bottom: 1px solid rgba(56, 189, 248, 0.08);
  }
`;

export function StudioGlassLayout(props: LayoutProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: glassStyles }} />
      {props.renderDefault(props)}
    </>
  );
}
