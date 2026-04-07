"use client";
import { useState } from "react";
import HeroScene from "@/components/hero/HeroScene";

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background font-mono antialiased">
      {/* 1. THE HERO STATE */}
      {!hasStarted && (
        <div className="relative h-full w-full">
          <HeroScene />

          {/* CONTENT OVERLAY - Changed 'justify-center' to 'justify-start' and added padding-top */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-24 md:pt-32 text-center px-4 overflow-hidden">
            
            <div className="space-y-8 max-w-5xl">
              {/* TITLE: Added tracking-in-expand and blur-reveal */}
              <div className="relative inline-block">
                <div className="absolute -inset-10 bg-brand/10 blur-[120px] rounded-full opacity-40 animate-pulse" />
                <h1 className="relative text-7xl md:text-[140px] font-black italic uppercase tracking-tighter 
                               animate-in fade-in zoom-in-95 blur-in-md duration-1000 ease-out 
                               [animation-fill-mode:backwards]">
                  MTR_<span className="text-brand text-glow">VISUAL</span>
                </h1>
              </div>

              {/* DESCRIPTION: Added a staggered slide-up with tracking animation */}
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 [animation-fill-mode:backwards]">
                <div className="flex items-center justify-center gap-3">
                  <span className="h-[1px] w-8 bg-zinc-800" />
                  <span className="text-brand font-bold uppercase tracking-[0.3em] text-[10px]">System Status: Operational</span>
                  <span className="h-[1px] w-8 bg-zinc-800" />
                </div>
                
                <p className="max-w-xl mx-auto text-zinc-400 font-medium text-sm md:text-base leading-relaxed tracking-tight">
                  Advanced network hop visualization engine. Detect and map the physical path 
                  of IP packets across the global internet backbone in real-time.
                </p>
              </div>
              
              {/* BUTTON: Clean reveal with a subtle border-pulse */}
              <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700 [animation-fill-mode:backwards]">
                <button 
                  onClick={() => setHasStarted(true)}
                  className="relative group overflow-hidden border border-zinc-700 hover:border-white px-12 py-4 text-sm font-bold tracking-[0.2em] transition-all cursor-pointer bg-black/20 backdrop-blur-sm"
                >
                  <span className="relative z-10 text-white group-hover:text-black transition-colors duration-300">
                    INITIALIZE_TRACE_
                  </span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </button>
              </div>
            </div>

            {/* FOOTER: Technical meta-data */}
            <div className="absolute bottom-8 left-12 right-12 flex justify-between items-end animate-in fade-in duration-1000 delay-1000 [animation-fill-mode:backwards]">
              <div className="text-[10px] text-zinc-600 space-y-1 text-left uppercase tracking-widest">
                <div>Loc: 0.0.0.0 // Global</div>
                <div>Engine: Three_v0.160</div>
              </div>
              <div className="text-[10px] text-zinc-600 text-right uppercase tracking-widest leading-relaxed">
                MTR_VISUAL_V2 <br /> 
                <span className="text-zinc-800 italic">Network Intelligence Platform</span>
              </div>
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