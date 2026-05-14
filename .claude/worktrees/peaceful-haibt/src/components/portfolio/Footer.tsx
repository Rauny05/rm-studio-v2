"use client";

import { motion } from "framer-motion";

const SOCIAL_LINKS = [
  { label: "X / Twitter", href: "https://twitter.com/rajivmakhni" },
  { label: "YouTube", href: "https://youtube.com/@rajivmakhni" },
  { label: "Instagram", href: "https://instagram.com/rajivmakhni" },
  { label: "LinkedIn", href: "https://linkedin.com/in/rajivmakhni" },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "#030303",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "48px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "32px",
        }}
        className="footer-grid"
      >
        <style>{`
          @media (max-width: 640px) {
            .footer-grid {
              grid-template-columns: 1fr !important;
              text-align: center !important;
            }
            .footer-right {
              text-align: center !important;
            }
          }
        `}</style>

        {/* Left: Name + Copyright */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: "13px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Rajiv Makhni
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              color: "rgba(255,255,255,0.22)",
              letterSpacing: "0.02em",
            }}
          >
            © 2025 All rights reserved.
          </span>
        </div>

        {/* Center: Social links */}
        <nav
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
          aria-label="Social links"
        >
          {SOCIAL_LINKS.map((link) => (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ color: "#00D1FF" }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        {/* Right: Tagline */}
        <div
          className="footer-right"
          style={{ textAlign: "right" }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            Tech. Simplified. Humanized.
          </span>
        </div>
      </div>
    </footer>
  );
}
