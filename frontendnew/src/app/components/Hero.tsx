"use client";
import Globe from "./Globe";

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#03050a] text-white">
      
      {/* Background subtle stars (temporary) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,255,0.08),transparent_60%)]" />

      {/* CENTER CONTENT */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        
        {/* Small label */}
        <p className="text-xs tracking-[0.4em] text-gray-400 mb-4">
          NETWORK TRACE VISUALIZER
        </p>

     

        {/* Sub text */}
        <p className="mt-4 text-sm text-gray-400 max-w-md">
          Visualize the physical journey of your packets across the internet
        </p>

        {/* CTA */}
        <button className="mt-8 px-6 py-3 border border-[#00aaff] text-[#00aaff] rounded-full hover:bg-[#00aaff] hover:text-black transition-all duration-300">
          Start Tracing
        </button>
      </div>

      {/* PLANET PLACEHOLDER (we replace this with Three.js later) */}
      <Globe />
    </section>
  );
}