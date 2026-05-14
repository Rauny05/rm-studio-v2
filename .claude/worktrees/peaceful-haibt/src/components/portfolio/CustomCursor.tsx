"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      gsap.to(dot, {
        x: mouseX,
        y: mouseY,
        duration: 0.1,
        ease: "power3.out",
      });

      gsap.to(ring, {
        x: mouseX,
        y: mouseY,
        duration: 0.35,
        ease: "power3.out",
      });
    };

    const onMouseEnterHover = () => ring.classList.add("cursor-hover");
    const onMouseLeaveHover = () => ring.classList.remove("cursor-hover");

    document.addEventListener("mousemove", onMouseMove);

    const hoverTargets = document.querySelectorAll(
      "a, button, [data-cursor-hover]"
    );
    hoverTargets.forEach((el) => {
      el.addEventListener("mouseenter", onMouseEnterHover);
      el.addEventListener("mouseleave", onMouseLeaveHover);
    });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      hoverTargets.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnterHover);
        el.removeEventListener("mouseleave", onMouseLeaveHover);
      });
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
