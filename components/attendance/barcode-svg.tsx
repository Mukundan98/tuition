"use client";

import JsBarcode from "jsbarcode";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type BarcodeSvgProps = {
  value: string;
  className?: string;
  /** JsBarcode narrow bar width (module). */
  width?: number;
  /** Bar height in px (excluding human-readable text under bars). */
  height?: number;
  /** Outer box height (px) — all labels match this viewport. Tailwind arbitrary value e.g. h-[76px]. */
  boxClassName?: string;
};

/** Fit barcode + caption into a fixed box so short and long payloads look the same size. */
export function BarcodeSvg({
  value,
  className,
  width = 2,
  height = 38,
  boxClassName = "h-[4.75rem] w-full max-w-[240px]",
}: BarcodeSvgProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const applyFit = useCallback(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap || !value.trim()) return;
    svg.style.transform = "";
    svg.style.transformOrigin = "0px 0px";

    const bbox = svg.getBBox();
    if (!bbox.width || !bbox.height) return;

    const pad = 4;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    if (cw < 8 || ch < 8) return;

    const scale = Math.min((cw - pad) / bbox.width, (ch - pad) / bbox.height);
    if (!Number.isFinite(scale) || scale <= 0) return;

    const tx = (cw - bbox.width * scale) / 2 - bbox.x * scale;
    const ty = (ch - bbox.height * scale) / 2 - bbox.y * scale;

    svg.style.transformOrigin = "0px 0px";
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, [value]);

  useEffect(() => {
    const el = svgRef.current;
    const wrap = wrapRef.current;
    if (!el || !value.trim()) return;
    try {
      JsBarcode(el, value.trim(), {
        format: "CODE128",
        displayValue: true,
        fontSize: 11,
        height,
        margin: 4,
        width,
      });
    } catch {
      el.replaceChildren();
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", "8");
      t.setAttribute("y", "20");
      t.setAttribute("fill", "currentColor");
      t.setAttribute("font-size", "11");
      t.textContent = "Invalid for Code 128";
      el.appendChild(t);
    }

    requestAnimationFrame(() => {
      applyFit();
    });

    const ro =
      typeof ResizeObserver !== "undefined" && wrap
        ? new ResizeObserver(() => {
            requestAnimationFrame(() => applyFit());
          })
        : null;
    if (wrap && ro) ro.observe(wrap);
    return () => {
      ro?.disconnect();
    };
  }, [value, width, height, applyFit]);

  if (!value.trim()) {
    return <p className={cn("text-xs text-muted-foreground", className)}>—</p>;
  }

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative mx-auto shrink-0 overflow-hidden [&_svg]:block [&_svg]:max-h-none [&_svg]:max-w-none",
        boxClassName,
        className
      )}
    >
      <svg ref={svgRef} className="text-foreground" />
    </div>
  );
}
