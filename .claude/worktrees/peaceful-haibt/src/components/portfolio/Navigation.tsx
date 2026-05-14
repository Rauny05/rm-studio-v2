"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

const NAV_LINKS = [
  { label: "Shows", href: "#shows" },
  { label: "Content", href: "#content" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Contact", href: "#contact" },
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP magnetic effect on Book Now button
  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>(".nav-book-btn");
    if (!btn) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.3;
      const dy = (e.clientY - cy) * 0.3;
      gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: "power2.out" });
    };

    const onMouseLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    };

    btn.addEventListener("mousemove", onMouseMove);
    btn.addEventListener("mouseleave", onMouseLeave);
    return () => {
      btn.removeEventListener("mousemove", onMouseMove);
      btn.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease",
        background: scrolled ? "rgba(5,5,5,0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 32px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Wordmark */}
        <a
          href="/"
          style={{
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#ffffff",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          RAJIV MAKHNI
        </a>

        {/* Center: Nav links (desktop) */}
        <ul
          className="nav-links-desktop"
          style={{
            display: "flex",
            gap: "36px",
            listStyle: "none",
            margin: 0,
            padding: 0,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="animated-underline"
                style={{
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "#ffffff")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "rgba(255,255,255,0.7)")
                }
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right: Book Now + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Book Now — desktop */}
          <button
            className="nav-book-btn magnetic-btn"
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#00D1FF",
              background: "transparent",
              border: "1px solid #00D1FF",
              borderRadius: "100px",
              padding: "8px 20px",
              cursor: "pointer",
              transition: "background 0.3s ease, color 0.3s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "#00D1FF";
              el.style.color = "#050505";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "transparent";
              el.style.color = "#00D1FF";
            }}
          >
            Book Now
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "none",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              width: "32px",
              height: "32px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: i === 1 ? "16px" : "22px",
                  height: "1.5px",
                  background: "#ffffff",
                  borderRadius: "2px",
                  transition: "transform 0.3s ease, opacity 0.3s ease",
                  transformOrigin: "center",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                  transform:
                    menuOpen && i === 0
                      ? "rotate(45deg) translate(4px, 4px)"
                      : menuOpen && i === 2
                      ? "rotate(-45deg) translate(4px, -4px)"
                      : "none",
                }}
              />
            ))}
          </button>
        </div>
      </div>

      {/* Inline responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-hamburger {
            display: flex !important;
          }
          .nav-book-btn {
            display: none !important;
          }
        }
      `}</style>
    </motion.nav>
  );
}
