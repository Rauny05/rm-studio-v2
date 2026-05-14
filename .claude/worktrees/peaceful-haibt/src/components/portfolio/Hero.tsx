"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/* ── Particle config ── */
const PARTICLE_COUNT = 120;

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

function initParticles(w: number, h: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: 0.5 + Math.random() * 1.5,
    speed: 0.2 + Math.random() * 0.5,
    opacity: 0.2 + Math.random() * 0.5,
  }));
}

/* ── Stagger variants ── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const scrollBounce = {
  animate: {
    y: [0, 8, 0],
    transition: { repeat: Infinity, duration: 1.6, ease: "easeInOut" },
  },
};

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  /* ── Particle canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particlesRef.current = initParticles(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,209,255,${p.opacity})`;
        ctx.fill();

        // drift upward, wrap around
        p.y -= p.speed;
        if (p.y + p.radius < 0) {
          p.y = canvas.height + p.radius;
          p.x = Math.random() * canvas.width;
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ── Mouse parallax on headline ── */
  useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) * 0.02;
      const dy = (e.clientY - cy) * 0.02;
      gsap.to(headline, { x: dx, y: dy, duration: 0.6, ease: "power2.out" });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 50%, #0A0A1A 0%, #050505 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Scanline */}
      <div className="scanline" />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        id="particle-canvas"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "24px",
          padding: "0 24px",
        }}
      >
        {/* Label */}
        <motion.p
          variants={itemVariants}
          style={{
            fontFamily: "var(--font-inter), 'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#00D1FF",
            margin: 0,
          }}
        >
          EST. 1995 · INDIA&apos;S PREMIER TECH VOICE
        </motion.p>

        {/* Headline */}
        <motion.div
          variants={itemVariants}
          ref={headlineRef}
          style={{ willChange: "transform" }}
        >
          <h1
            className="rm-display"
            style={{
              margin: 0,
              fontSize: "clamp(56px, 10vw, 140px)",
              lineHeight: 0.92,
            }}
          >
            <span style={{ display: "block", color: "#ffffff" }}>TECH.</span>
            <span
              className="gradient-text-primary"
              style={{ display: "block" }}
            >
              SIMPLIFIED.
            </span>
            <span style={{ display: "block", color: "#ffffff" }}>
              HUMANIZED.
            </span>
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          className="rm-body"
          style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.55)",
            maxWidth: "32rem",
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          30 years of decoding technology for 1.4 billion Indians. Journalist.
          Broadcaster. Tech Philosopher.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={itemVariants}
          style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}
        >
          <button
            className="magnetic-btn"
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              background: "#00D1FF",
              color: "#050505",
              border: "none",
              borderRadius: "100px",
              padding: "16px 32px",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 32px rgba(0,209,255,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            Enter Experience
          </button>

          <button
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "100px",
              padding: "16px 32px",
              cursor: "pointer",
              transition: "border-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#00D1FF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.2)";
            }}
          >
            Watch Latest →
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          zIndex: 10,
        }}
      >
        {/* Vertical line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
          style={{
            width: "1px",
            height: "40px",
            background:
              "linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))",
            transformOrigin: "top",
          }}
        />

        {/* SCROLL label */}
        <span
          style={{
            fontFamily: "var(--font-inter), 'Inter', sans-serif",
            fontSize: "9px",
            fontWeight: 500,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          SCROLL
        </span>

        {/* Bouncing arrow */}
        <motion.svg
          {...scrollBounce}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          style={{ marginTop: "-4px" }}
        >
          <path
            d="M1 1L6 6L11 1"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>
    </section>
  );
}
