"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

type NodeGraphProps = {
  /** When true, one node pulses in the danger color. */
  alert?: boolean;
  className?: string;
};

const DESKTOP_COUNT = 34;
const MOBILE_COUNT = 22;
const LINK_DIST = 110;
const MOBILE_LINK_DIST = 88;

function readCssColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(138, 148, 160, ${alpha})`;
  const n = Number.parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function NodeGraph({ alert = false, className = "" }: NodeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alertRef = useRef(alert);
  const alertNodeRef = useRef(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let linkDist = LINK_DIST;
    let paused = document.hidden;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      reducedMotionRef.current = mq.matches;
    };
    syncMotion();
    mq.addEventListener("change", syncMotion);

    const seed = () => {
      const mobile = window.innerWidth < 768;
      const count = mobile ? MOBILE_COUNT : DESKTOP_COUNT;
      linkDist = mobile ? MOBILE_LINK_DIST : LINK_DIST;
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1.1 + Math.random() * 1.4,
      }));
      alertNodeRef.current = Math.floor(count * 0.42);
    };

    const drawFrame = (now: number, animate: boolean) => {
      const muted = readCssColor("--muted", "#8a94a0");
      const danger = readCssColor("--danger", "#ff5c57");
      const border = readCssColor("--border", "#1e252d");
      ctx.clearRect(0, 0, width, height);

      if (animate) {
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
          node.x = Math.min(width, Math.max(0, node.x));
          node.y = Math.min(height, Math.max(0, node.y));
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          const alpha = (1 - dist / linkDist) * (animate ? 0.22 : 0.18);
          ctx.strokeStyle = hexToRgba(border, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      nodes.forEach((node, i) => {
        const isAlert = alertRef.current && i === alertNodeRef.current;
        if (isAlert) {
          const pulse = animate ? 0.55 + 0.45 * Math.sin(now / 280) : 0.85;
          ctx.fillStyle = hexToRgba(danger, 0.25 + pulse * 0.35);
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r + 4 + pulse * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = hexToRgba(danger, 0.9);
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r + 1.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = hexToRgba(muted, 0.32);
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const loop = (now: number) => {
      const animate = !paused && !reducedMotionRef.current;
      drawFrame(now, animate);
      if (!paused) {
        raf = window.requestAnimationFrame(loop);
      }
    };

    const start = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(loop);
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      drawFrame(performance.now(), false);
    };

    const onVisibility = () => {
      paused = document.hidden;
      if (paused) {
        window.cancelAnimationFrame(raf);
        drawFrame(performance.now(), false);
      } else {
        start();
      }
    };

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", syncMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`.trim()}
    />
  );
}
