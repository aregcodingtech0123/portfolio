import type { ReactNode } from "react";

type SimpleTimelineRowProps = {
  /** Free-text period as stored ("08/2025 – 10/2025"). Omitted when empty. */
  period?: string;
  /** True only when the content says the entry is ongoing. */
  current?: boolean;
  currentLabel: string;
  /** Serif heading: the role, or the program of study. */
  title: ReactNode;
  /** Company or institution, shown in medium weight under the title. */
  org?: string;
  /** City and country, or Remote. Shown as quiet meta next to the org when set. */
  location?: string;
  description?: string;
};

/**
 * One row of the Simple timeline: the period on the left from md up (stacked on
 * top on mobile), the entry on the right, a square marker on the vertical rule.
 * Layout and the rule live in globals.css (.m-tl-*), scoped to the Simple skin.
 * Reading order is period, then entry, so it matches the visual order.
 */
export function SimpleTimelineRow({
  period,
  current,
  currentLabel,
  title,
  org,
  location,
  description,
}: SimpleTimelineRowProps) {
  return (
    <li className="m-tl-row">
      <span className="m-tl-marker" aria-hidden />
      <div className="m-tl-when">
        {period && <p className="m-tl-date">{period}</p>}
        {current && (
          <p className="m-status">
            <span className="m-pill-dot" aria-hidden />
            {currentLabel}
          </p>
        )}
      </div>
      <div className="m-tl-what">
        <h3 className="m-h3 break-words">{title}</h3>
        {org && (
          <p className="m-tl-org">
            {org}
            {location ? <span className="m-meta">{` · ${location}`}</span> : null}
          </p>
        )}
        {!org && location ? <p className="m-meta">{location}</p> : null}
        {description && <p className="m-tl-desc">{description}</p>}
      </div>
    </li>
  );
}
