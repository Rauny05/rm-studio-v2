"use client";

import { SmoothScroll } from "@/components/portfolio/SmoothScroll";
import { CustomCursor } from "@/components/portfolio/CustomCursor";
import { Navigation } from "@/components/portfolio/Navigation";
import { Hero } from "@/components/portfolio/Hero";
import { Identity } from "@/components/portfolio/Identity";
import { ContentUniverse } from "@/components/portfolio/ContentUniverse";
import { TechPhilosophy } from "@/components/portfolio/TechPhilosophy";
import { TechLab } from "@/components/portfolio/TechLab";
import SocialProof from "@/components/portfolio/SocialProof";
import FinalCTA from "@/components/portfolio/FinalCTA";
import Footer from "@/components/portfolio/Footer";

export default function PortfolioPage() {
  return (
    <SmoothScroll>
      {/* Custom cursor — desktop only */}
      <div className="hidden md:block">
        <CustomCursor />
      </div>

      {/* Noise film grain overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Fixed navigation */}
      <Navigation />

      {/* Main content */}
      <main>
        {/* 1. Cinematic hero */}
        <section id="hero">
          <Hero />
        </section>

        {/* 2. Horizontal scroll identity */}
        <section id="shows">
          <Identity />
        </section>

        {/* 3. Content universe grid */}
        <section id="content">
          <ContentUniverse />
        </section>

        {/* 4. Tech philosophy + timeline */}
        <section id="philosophy">
          <TechPhilosophy />
        </section>

        {/* 5. Interactive tech lab */}
        <section id="lab">
          <TechLab />
        </section>

        {/* 6. Social proof */}
        <SocialProof />

        {/* 7. Final CTA */}
        <section id="contact">
          <FinalCTA />
        </section>
      </main>

      <Footer />
    </SmoothScroll>
  );
}
