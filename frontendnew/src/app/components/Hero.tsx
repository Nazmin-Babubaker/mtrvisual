"use client";
import { useRouter } from "next/navigation";
import Globe from "./Globe";

export default function Hero() {

    const router = useRouter();
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .space-root {
          position: relative;
          width: 100%;
          height: 100svh;
          min-height: 600px;
          overflow: hidden;
          background: #020d1f;
          font-family: 'DM Sans', sans-serif;
          color: white;
        }

        /* ── Starfield background ── */
        .bg-stars {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 90% 60% at 70% 60%, rgba(10,30,80,0.55) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 20% 20%, rgba(5,15,50,0.4) 0%, transparent 70%),
            #020d1f;
          z-index: 0;
        }

        /* Tiny star field via box-shadow trick */
        .stars-layer {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 12% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 28% 15%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 6%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 63% 22%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 78% 11%, rgba(255,255,255,0.65) 0%, transparent 100%),
            radial-gradient(1px 1px at 91% 5%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 5% 32%, rgba(255,255,255,0.55) 0%, transparent 100%),
            radial-gradient(1px 1px at 18% 42%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 55%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1px 1px at 52% 38%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 68% 48%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 84% 35%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 96% 42%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1px 1px at 8% 65%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 22% 72%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 56% 68%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 74% 75%, rgba(255,255,255,0.55) 0%, transparent 100%),
            radial-gradient(1px 1px at 88% 62%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 88%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 33% 92%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 85%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1px 1px at 79% 90%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 95% 78%, rgba(255,255,255,0.4) 0%, transparent 100%);
          z-index: 0;
        }

        /* ── Nav ── */
        .nav {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 52px;
          animation: navSlide 0.8s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 0.1s;
        }
        @keyframes navSlide {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.92);
          text-transform: uppercase;
        }

        .nav-hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
        }
        .nav-hamburger span {
          display: block;
          height: 1.5px;
          background: rgba(255,255,255,0.75);
          border-radius: 2px;
          transition: width 0.2s;
        }
        .nav-hamburger span:nth-child(1) { width: 24px; }
        .nav-hamburger span:nth-child(2) { width: 16px; }
        .nav-hamburger span:nth-child(3) { width: 20px; }
        .nav-hamburger:hover span { width: 24px !important; opacity: 0.95; }

        /* ── Content ── */
        .content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          padding: 0 52px;
        }

        /* ── Label ── */
        .label {
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(255,255,255,0.4);
          font-family: 'Syne', sans-serif;
          font-weight: 500;
          text-transform: uppercase;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 0.5s;
        }

        /* ── Headline ── */
        .headline {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(52px, 7.5vw, 96px);
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: #ffffff;
          margin-bottom: 28px;
          overflow: hidden;
        }

        .headline-line {
          display: block;
          opacity: 0;
          transform: translateY(60px);
          animation: lineReveal 1s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .headline-line:nth-child(1) { animation-delay: 0.65s; }
        .headline-line:nth-child(2) { animation-delay: 0.82s; }

        @keyframes lineReveal {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Subtext ── */
        .subtext {
          font-size: 15px;
          font-weight: 300;
          color: rgba(255,255,255,0.55);
          line-height: 1.7;
          margin-bottom: 44px;
          font-style: italic;
          letter-spacing: 0.01em;
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 1.05s;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── CTA ── */
        .cta-group {
          display: flex;
          align-items: center;
          gap: 28px;
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 1.2s;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 38px;
          border: 1.5px solid rgba(255,255,255,0.5);
          background: transparent;
          color: white;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s, color 0.3s;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.08);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .btn-primary:hover::before { transform: scaleX(1); }
        .btn-primary:hover { border-color: rgba(255,255,255,0.85); }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          cursor: pointer;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: rgba(255,255,255,0.75); }
        .btn-ghost-arrow {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .btn-ghost:hover .btn-ghost-arrow {
          border-color: rgba(255,255,255,0.5);
          transform: translateX(3px);
        }

        /* ── Bottom bar ── */
        .bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 52px;
          border-top: 1px solid rgba(255,255,255,0.06);
          opacity: 0;
          animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 1.4s;
        }

        .bottom-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .bottom-stat-label {
          font-size: 9px;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.28);
          font-family: 'Syne', sans-serif;
          font-weight: 500;
          text-transform: uppercase;
        }
        .bottom-stat-val {
          font-size: 13px;
          font-weight: 300;
          color: rgba(255,255,255,0.65);
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.04em;
        }

        .bottom-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.08);
        }

        /* ── Scroll indicator ── */
        .scroll-indicator {
          position: absolute;
          right: 52px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          opacity: 0;
          animation: fadeIn 1s forwards;
          animation-delay: 1.6s;
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        .scroll-line {
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.0), rgba(255,255,255,0.3));
          position: relative;
          overflow: hidden;
        }
        .scroll-line::after {
          content: '';
          position: absolute;
          top: -100%;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.8));
          animation: scrollDown 2s ease-in-out infinite;
          animation-delay: 2s;
        }
        @keyframes scrollDown {
          0%   { top: -100%; }
          100% { top: 100%; }
        }
        .scroll-text {
          font-size: 9px;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.25);
          font-family: 'Syne', sans-serif;
          writing-mode: vertical-rl;
          text-transform: uppercase;
        }

        /* ── Floating astronaut-like glow in center ── */
        .center-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(30,80,200,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 2;
          animation: glowPulse 4s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.12); }
        }

        /* ── Tagline counter ── */
        .counter-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 18px;
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 0.9s;
        }
        .counter-line {
          flex: 0 0 40px;
          height: 1px;
          background: rgba(255,255,255,0.2);
        }
        .counter-num {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.3);
        }
      `}</style>

      <div className="space-root">
        <div className="bg-stars" />
        <div className="stars-layer" />
        <div className="center-glow" />

        {/* Globe (Three.js) */}
        <Globe />

        {/* Nav */}
        <nav className="nav">
          <div className="nav-logo">MTR</div>
          
        </nav>

        {/* Main content */}
        <div className="content">
          <p className="label">Determine Request Path</p>

          <h1 className="headline">
            <span className="headline-line">MTR</span>
            <span className="headline-line">VISUAL</span>
          </h1>


          <p className="subtext">
            Be interested. Be explorer. Be first.
          </p>

          <div className="cta-group">
            <button className="btn-primary" onClick={() => router.push("/visualizer")}>
              START TRACING
            </button>
          </div>
        </div>

       
        {/* Bottom stats */}
        <div className="bottom-bar">
          <div className="bottom-stat">
            <span className="bottom-stat-label">Distance</span>
            <span className="bottom-stat-val">384,400 km</span>
          </div>
          <div className="bottom-divider" />
          <div className="bottom-stat">
            <span className="bottom-stat-label">Duration</span>
            <span className="bottom-stat-val">72 hrs avg</span>
          </div>
          <div className="bottom-divider" />
          <div className="bottom-stat">
            <span className="bottom-stat-label">Altitude</span>
            <span className="bottom-stat-val">408 km orbit</span>
          </div>
          <div className="bottom-divider" />
          <div className="bottom-stat">
            <span className="bottom-stat-label">Crew</span>
            <span className="bottom-stat-val">4 passengers</span>
          </div>
          <div className="bottom-divider" />
          <div className="bottom-stat">
            <span className="bottom-stat-label">Next launch</span>
            <span className="bottom-stat-val">Q2 · 2026</span>
          </div>
        </div>
      </div>
    </>
  );
}