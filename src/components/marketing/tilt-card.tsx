"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pointer-tracked 3D tilt. Rotates toward the cursor on a perspective plane
 * and lifts slightly, giving the hero real depth. A short eased transition on
 * `transform` gives the follow a spring-like trail without a physics library.
 *
 * Emil principles applied: only `transform` animates (GPU); custom ease-out
 * curve; disabled entirely for touch (no hover) and prefers-reduced-motion.
 * Children can opt into parallax layering with `preserve-3d` + translateZ.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 9,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);
  const [transform, setTransform] = React.useState<string>();
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    const rotY = px * maxTilt * 2;
    const rotX = -py * maxTilt * 2;
    setTransform(
      `perspective(1400px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(
        2
      )}deg) scale(1.015)`
    );
    setActive(true);
  }

  function onLeave() {
    setTransform("perspective(1400px) rotateX(0deg) rotateY(0deg) scale(1)");
    setActive(false);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "[transform-style:preserve-3d] will-change-transform",
        // Slower settle on leave, snappier follow while active.
        active
          ? "transition-transform duration-150 ease-out"
          : "transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        className
      )}
      style={enabled && transform ? { transform } : undefined}
    >
      {children}
    </div>
  );
}
