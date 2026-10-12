/** Reduces a full Lighthouse result to the fields the report needs. */
const num = (lhr, id) => lhr.audits[id]?.numericValue ?? null;
const detailsOf = (lhr, id) => lhr.audits[id]?.details ?? null;

/**
 * Lighthouse 13 folded the old "largest-contentful-paint-element" audit into
 * the LCP breakdown insight: a table of phases plus the LCP node.
 */
function lcpBreakdown(lhr) {
  const list = detailsOf(lhr, "lcp-breakdown-insight")?.items ?? [];
  const node = list.find((i) => i.type === "node") ?? null;
  const phases = {};
  for (const row of list.find((i) => i.type === "table")?.items ?? [])
    phases[row.subpart] = row.duration;
  return {
    lcpElement: node
      ? { selector: node.selector, snippet: node.snippet, label: node.nodeLabel }
      : null,
    lcpPhases: phases,
  };
}

export function slimRun(lhr) {
  const metricsItem = lhr.audits.metrics?.details?.items?.[0] ?? {};
  const requests = (lhr.audits["network-requests"]?.details?.items ?? []).map((r) => ({
    url: r.url,
    type: r.resourceType,
    status: r.statusCode,
    transfer: r.transferSize,
    size: r.resourceSize,
    start: r.networkRequestTime,
    end: r.networkEndTime,
    priority: r.priority,
    failed: r.statusCode === -1 || r.statusCode === 0 || undefined,
  }));
  const resSummary = {};
  for (const r of lhr.audits["resource-summary"]?.details?.items ?? [])
    resSummary[r.resourceType] = { count: r.requestCount, transfer: r.transferSize };

  return {
    score: lhr.categories.performance.score,
    metrics: {
      fcp: num(lhr, "first-contentful-paint"),
      lcp: num(lhr, "largest-contentful-paint"),
      cls: num(lhr, "cumulative-layout-shift"),
      tbt: num(lhr, "total-blocking-time"),
      tti: num(lhr, "interactive"),
      si: num(lhr, "speed-index"),
      ttfb: num(lhr, "server-response-time"),
      bytes: num(lhr, "total-byte-weight"),
      mainThread: num(lhr, "mainthread-work-breakdown"),
      bootup: num(lhr, "bootup-time"),
      observedLcp: metricsItem.observedLargestContentfulPaint ?? null,
      observedFcp: metricsItem.observedFirstContentfulPaint ?? null,
      observedLoad: metricsItem.observedLoad ?? null,
    },
    benchmarkIndex: lhr.environment?.benchmarkIndex ?? null,
    ...lcpBreakdown(lhr),
    resSummary,
    requests,
    audits: {
      renderBlocking: detailsOf(lhr, "render-blocking-insight"),
      layoutShifts: detailsOf(lhr, "layout-shifts"),
      clsCulprits: detailsOf(lhr, "cls-culprits-insight"),
      longTasks: detailsOf(lhr, "long-tasks"),
      bootup: detailsOf(lhr, "bootup-time"),
      mainThread: detailsOf(lhr, "mainthread-work-breakdown"),
      unusedJs: detailsOf(lhr, "unused-javascript"),
      unusedCss: detailsOf(lhr, "unused-css-rules"),
      legacyJs: detailsOf(lhr, "legacy-javascript-insight"),
      duplicatedJs: detailsOf(lhr, "duplicated-javascript-insight"),
      imageDelivery: detailsOf(lhr, "image-delivery-insight"),
      fontDisplay: detailsOf(lhr, "font-display-insight"),
      thirdParty: detailsOf(lhr, "third-parties-insight"),
      lcpDiscovery: detailsOf(lhr, "lcp-discovery-insight"),
      documentLatency: detailsOf(lhr, "document-latency-insight"),
      domSize: detailsOf(lhr, "dom-size-insight"),
      networkTree: detailsOf(lhr, "network-dependency-tree-insight"),
    },
    runWarnings: lhr.runWarnings,
    lhVersion: lhr.lighthouseVersion,
    userAgent: lhr.environment?.hostUserAgent,
  };
}
