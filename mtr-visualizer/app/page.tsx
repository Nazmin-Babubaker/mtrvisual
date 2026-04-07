"use client";
import { useState } from "react";
import HeroScene from "@/components/hero/HeroScene"; // Import the new scene

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background font-mono antialiased">
      {/* 1. THE HERO STATE (Cinematic Entry) */}
      {!hasStarted && (
        <div className="relative h-full w-full">
          {/* THE 3D GALAXY BACKGROUND */}
          <HeroScene />

          {/* THE HERO CONTENT OVERLAY */}

    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
      <div className="space-y-6 max-w-4xl">
        {/* Added a subtle glow behind the text */}
        <div className="relative inline-block">
            <div className="absolute -inset-8 bg-brand/20 blur-[100px] rounded-full opacity-50" />
            <h1 className="relative text-8xl md:text-[160px] font-black tracking-tighter italic uppercase animate-in slide-in-from-top-12 fade-in duration-1000 ease-out">
                MTR_<span className="text-brand text-glow">VISUAL</span>
            </h1>
        </div>

        <p className="max-w-xl mx-auto text-zinc-400 font-medium text-sm md:text-base leading-relaxed animate-in slide-in-from-bottom-6 fade-in duration-1000 delay-300 ease-out fill-mode-both">
          <span className="text-white font-bold block mb-2 uppercase tracking-widest text-[10px]">System Status: Operational</span>
          Advanced network hop visualization engine. Detect and map the physical path of IP packets across the global internet backbone in real-time.
        </p>
              
              <div className="pt-8 animate-in fade-in duration-1000 delay-700 fill-mode-both">
                <button 
                  onClick={() => setHasStarted(true)}
                  className="border border-white px-10 py-4 text-lg font-bold hover:bg-white hover:text-black transition-all cursor-pointer group"
                >
                  INITIALIZE_TRACE<span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
                </button>
              </div>
            </div>

            {/* Subdued footer text */}
            <div className="absolute bottom-6 text-[11px] text-zinc-700 animate-in fade-in duration-700 delay-1000 fill-mode-both">
              MTR_VISUAL_V2 // NETWORK INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>
      )}

      {/* 2. THE FUNCTIONAL DASHBOARD (State 2) */}
      {hasStarted && (
        <div className="animate-in fade-in zoom-in-95 duration-700 h-full w-full flex flex-col">
           {/* Modern Minimal Header */}
           <div className="px-6 h-16 border-b border-border flex justify-between items-center bg-panel">
              <span className="font-bold tracking-widest text-sm">MTR_VISUAL_V2</span>
              <div className="flex gap-4 items-center">
                 <span className="text-xs text-zinc-600">IDLE</span>
                 <button onClick={() => setHasStarted(false)} className="text-xs text-brand hover:text-white transition-colors cursor-pointer">/EXIT</button>
              </div>
           </div>

           {/* Dashboard Content */}
           <div className="flex-1 flex overflow-hidden">
              {/* This is where the TraceInput, Sidebar, and Visualizer will go next */}
              <div className="flex-1 bg-zinc-950 flex items-center justify-center border-l border-border">
                <div className="text-center">
                  <p className="text-zinc-600 font-bold italic text-5xl mb-3 tracking-tight">VISUALIZER_ENGINE</p>
                  <p className="text-zinc-700 text-sm">Waiting for valid trace input_</p>
                </div>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}