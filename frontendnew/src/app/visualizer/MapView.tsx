"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// ── Router type classification ────────────────────────────────────────────────
export type RouterType = "local" | "isp" | "cdn" | "exchange" | "destination" | "unknown" | "backbone";

export function classifyHop(
  hop: any,
  index: number,
  total: number
): RouterType {
  const ip: string = hop.ip || "";
  const orgRaw: string = hop.geo?.org || "";
  const org = orgRaw.toLowerCase();

  
  if (index === 0) return "local";
  if (index === total - 1) return "destination";


  if (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    (ip >= "172.16.0.0" && ip <= "172.31.255.255") ||
    ip.startsWith("127.") ||
    ip === "0.0.0.0"
  ) {
    return "local";
  }

  
  const CDN_KEYWORDS = [
    "cloudflare",
    "akamai",
    "fastly",
    "edgecast",
    "cdn",
    "cloudfront",
    "google",
    "amazon",
    "aws",
    "gstatic",
    "azure",
    "microsoft"
  ];

  if (CDN_KEYWORDS.some(k => org.includes(k))) {
    return "cdn";
  }

 
  const IX_KEYWORDS = [
    "internet exchange",
    " ix ",
    " ix-",
    "-ix",
    "peering",
    "nap"
  ];

  if (IX_KEYWORDS.some(k => org.includes(k))) {
    return "exchange";
  }

  const BACKBONE_KEYWORDS = [
    "level 3",
    "lumen",
    "telia",
    "ntt",
    "gtt",
    "cogent",
    "tata communications",
    "verizon",
    "zayo"
  ];

  if (BACKBONE_KEYWORDS.some(k => org.includes(k))) {
    return "backbone";
  }

  const ISP_KEYWORDS = [
    "airtel",
    "jio",
    "isp",
    "vodafone",
    "bsnl",
    "comcast",
    "spectrum",
    "att",
    "telecom",
    "broadband",
    "internet service"
  ];

  if (ISP_KEYWORDS.some(k => org.includes(k))) {
    return "isp";
  }

  if (index <= 3) return "isp";


  return "unknown";
}

export const TYPE_CONFIG: Record<RouterType, { color: string; label: string; ring: string }> = {
  local:       { color: "#22c55e", label: "LOCAL",  ring: "rgba(34,197,94,0.3)" },
  isp:         { color: "#3b82f6", label: "ISP",    ring: "rgba(59,130,246,0.3)" },
  cdn:         { color: "#f97316", label: "CDN",    ring: "rgba(249,115,22,0.3)" },
  exchange:    { color: "#a855f7", label: "IX",     ring: "rgba(168,85,247,0.3)" },
   backbone: {
  color: "#eab308",
  label: "BACKBONE",
  ring: "rgba(234, 179, 8, 0.3)"
},
  destination: { color: "#ef4444", label: "DEST",   ring: "rgba(239,68,68,0.3)" },
  unknown:     { color: "#94a3b8", label: "HOP",    ring: "rgba(148,163,184,0.18)" },
};

// ── Dynamic Leaflet imports ───────────────────────────────────────────────────
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

function buildIcon(type: RouterType, hopNum: number) {
  if (typeof window === "undefined") return undefined;
  const L = require("leaflet");
  const cfg = TYPE_CONFIG[type];
  const html = `
    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${cfg.ring};
        animation:mtrPulse 2.2s ease-out infinite;
      "></div>
      <div style="
        width:22px;height:22px;border-radius:50%;
        background:#0a1020;
        border:2px solid ${cfg.color};
        display:flex;align-items:center;justify-content:center;
        font-size:8px;font-weight:800;color:${cfg.color};
        font-family:monospace;position:relative;z-index:1;
        box-shadow:0 0 10px ${cfg.color}66;
      ">${hopNum}</div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20] });
}

// ── Packet animation canvas ───────────────────────────────────────────────────
function PacketAnimator({ points, mapRef }: { points: [number, number][]; mapRef: React.MutableRefObject<any> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    if (points.length < 2 || !mapRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const totalSegs = points.length - 1;
    const speed = 0.003;

    function px(lat: number, lng: number) {
      const p = mapRef.current.latLngToContainerPoint([lat, lng]);
      return { x: p.x, y: p.y };
    }

    function draw() {
  if (!canvas || !ctx || !canvas.parentElement) {
    animRef.current = requestAnimationFrame(draw);
    return;
  }

  const rect = canvas.parentElement.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  tRef.current = (tRef.current + speed) % 1;
  const gt = tRef.current * totalSegs;
  const si = Math.min(Math.floor(gt), totalSegs - 1);
  const st = gt - si;

  const [la1, ln1] = points[si];
  const [la2, ln2] = points[Math.min(si + 1, points.length - 1)];
  const p1 = px(la1, ln1);
  const p2 = px(la2, ln2);
  const x = p1.x + (p2.x - p1.x) * st;
  const y = p1.y + (p2.y - p1.y) * st;

  // Outer glow
  const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
  g.addColorStop(0, "rgba(99,200,255,0.5)");
  g.addColorStop(1, "rgba(99,200,255,0)");
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // Core
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = "#63c8ff";
  ctx.shadowColor = "#63c8ff";
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Trail
  for (let i = 1; i <= 7; i++) {
    const tt = ((tRef.current - i * speed * 3.5) + 1) % 1;
    const gt2 = tt * totalSegs;
    const si2 = Math.min(Math.floor(gt2), totalSegs - 1);
    const st2 = gt2 - si2;

    const [tl1, tg1] = points[si2];
    const [tl2, tg2] = points[Math.min(si2 + 1, points.length - 1)];
    const tp1 = px(tl1, tg1);
    const tp2 = px(tl2, tg2);

    const tx = tp1.x + (tp2.x - tp1.x) * st2;
    const ty = tp1.y + (tp2.y - tp1.y) * st2;

    ctx.beginPath();
    ctx.arc(tx, ty, Math.max(3.5 - i * 0.4, 0.5), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99,200,255,${Math.max(0.45 - i * 0.055, 0)})`;
    ctx.fill();
  }

  animRef.current = requestAnimationFrame(draw);
}
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [points, mapRef]);

  return (
    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 500 }} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MapView({ hops }: { hops: any[] }) {
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Keep original index so map marker numbers match the sidebar's hop numbers
  const validHops = hops
    .map((h, originalIndex) => ({ hop: h, originalIndex }))
    .filter(({ hop }) => hop.geo?.lat && hop.geo?.lng);
  const points: [number, number][] = validHops.map(({ hop }) => [hop.geo.lat, hop.geo.lng]);

  useEffect(() => {
    if (mapRef.current && points.length > 1) {
      try {
        const L = require("leaflet");
        mapRef.current.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
      } catch {}
    }
  }, [points.length]);

  if (points.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "rgba(255,255,255,0.18)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.12em" }}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="24" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="26" cy="26" r="15" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle cx="26" cy="26" r="6" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="2" y1="26" x2="50" y2="26" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="26" y1="2" x2="26" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </svg>
        AWAITING TRACE DATA
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <style>{`
        @keyframes mtrPulse {
          0%   { transform:scale(0.7); opacity:0.9; }
          100% { transform:scale(2.4); opacity:0; }
        }
        .leaflet-container { background:#080f1f !important; }
        .leaflet-popup-content-wrapper {
          background:#0d1526 !important;
          border:1px solid rgba(255,255,255,0.08) !important;
          border-radius:8px !important;
          color:white !important;
          box-shadow:0 12px 40px rgba(0,0,0,0.7) !important;
          backdrop-filter:blur(8px);
        }
        .leaflet-popup-tip { background:#0d1526 !important; }
        .leaflet-popup-close-button { color:rgba(255,255,255,0.35) !important; top:8px !important; right:10px !important; }
        .leaflet-control-zoom { border:1px solid rgba(255,255,255,0.1) !important; border-radius:6px !important; overflow:hidden; }
        .leaflet-control-zoom a { background:#0d1526 !important; color:rgba(255,255,255,0.6) !important; border-color:rgba(255,255,255,0.08) !important; }
        .leaflet-control-zoom a:hover { background:#142040 !important; color:white !important; }
        .leaflet-bar { box-shadow:0 4px 16px rgba(0,0,0,0.5) !important; }
      `}</style>

      <MapContainer
        center={points[0]}
        zoom={3}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        whenReady={() => setReady(true)}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Glow underlay */}
        <Polyline positions={points} pathOptions={{ color: "rgba(59,130,246,0.1)", weight: 10 }} />
        {/* Dashed route */}
        <Polyline positions={points} pathOptions={{ color: "rgba(99,200,255,0.4)", weight: 1.5, dashArray: "6 8" }} />

        {validHops.map(({ hop, originalIndex }) => {
          const type = classifyHop(hop, originalIndex, hops.length);
          const cfg = TYPE_CONFIG[type];
          const icon = buildIcon(type, originalIndex + 1);
          if (!icon) return null;
          return (
            <Marker key={originalIndex} position={[hop.geo.lat, hop.geo.lng]} icon={icon}>
              <Popup>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.75, minWidth: 170 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                    <span style={{ background: cfg.color + "20", color: cfg.color, border: `1px solid ${cfg.color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em" }}>{cfg.label}</span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>HOP {originalIndex + 1}</span>
                  </div>
                  <div style={{ color: "white", fontWeight: 500, fontSize: 13 }}>{hop.ip || "Silent Router"}</div>
                  {hop.geo?.city && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{hop.geo.city}, {hop.geo.country}</div>}
                  {hop.geo?.org && <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, marginTop: 1 }}>{hop.geo.org}</div>}
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.07)", color: "#63c8ff", fontSize: 13, fontWeight: 500 }}>
                    {hop.avgRtt ? `${hop.avgRtt} ms` : "— ms"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {ready && points.length >= 2 && <PacketAnimator points={points} mapRef={mapRef} />}
    </div>
  );
}