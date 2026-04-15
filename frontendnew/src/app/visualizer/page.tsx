"use client";

import { useState, useRef, useCallback, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { TYPE_CONFIG, classifyHop } from "./MapView";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

// ── Input validation ──────────────────────────────────────────────────────────
function validateTarget(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Please enter a domain or IP address.";
  if (t.includes(" ")) return "Input must be a single domain or IP — no spaces allowed.";

  const stripped = t.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];

  // IPv4
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(stripped)) {
    const parts = stripped.split(".").map(Number);
    if (parts.some((p) => p > 255)) return "Invalid IP — each octet must be 0–255.";
    if (parts[0] === 0) return "0.x.x.x is not a routable address.";
    return null;
  }

  // IPv6 — let backend validate
  if (stripped.includes(":")) return null;

  // Domain
  const domainRe = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!domainRe.test(stripped)) return "That doesn't look like a valid domain or IP address.";
  return null;
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function greatCircleArc(a: THREE.Vector3, b: THREE.Vector3, r: number, segments = 64): THREE.Vector3[] {
  const ua = a.clone().normalize();
  const ub = b.clone().normalize();
  const dot = Math.min(Math.max(ua.dot(ub), -1), 1);
  const omega = Math.acos(dot);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let p: THREE.Vector3;
    if (Math.abs(omega) < 0.0001) {
      p = ua.clone();
    } else {
      const sinO = Math.sin(omega);
      p = ua.clone().multiplyScalar(Math.sin((1 - t) * omega) / sinO)
         .add(ub.clone().multiplyScalar(Math.sin(t * omega) / sinO));
    }
    points.push(p.multiplyScalar(r * 1.02));
  }
  return points;
}

// ── Globe scene ───────────────────────────────────────────────────────────────
function GlobeEarth({ hops }: { hops: any[] }) {
  const globeGroupRef = useRef<THREE.Group>(null!);
  const cloudsRef     = useRef<THREE.Mesh>(null!);

  const [dayTex, cloudTex] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return [
      loader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"),
      loader.load("https://threejs.org/examples/textures/planets/earth_clouds_1024.png"),
    ];
  }, []);

  useFrame((_, delta) => {
    globeGroupRef.current.rotation.y += delta * 0.05;
    cloudsRef.current.rotation.y     += delta * 0.062;
  });

  const RADIUS = 1.5;
  const validHops = useMemo(() => hops.filter((h) => h.geo?.lat != null && h.geo?.lng != null), [hops]);

  const hopMarkers = useMemo(() => validHops.map((h, i) => {
    const type = classifyHop(h, i, validHops.length);
    const cfg  = TYPE_CONFIG[type];
    return {
      pos:           latLngToVec3(h.geo.lat, h.geo.lng, RADIUS + 0.02),
      unitV:         latLngToVec3(h.geo.lat, h.geo.lng, 1),
      labelPos:      latLngToVec3(h.geo.lat, h.geo.lng, RADIUS + 0.18),
      color:         cfg.color,
      hopNum:        i + 1,
      city:          h.geo?.city  || null,
      country:       h.geo?.country || null,
    };
  }), [validHops]);

  const arcObjects = useMemo(() => {
    if (hopMarkers.length < 2) return [];
    return hopMarkers.slice(0, -1).map((m, i) => {
      const pts = greatCircleArc(m.unitV, hopMarkers[i + 1].unitV, RADIUS);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x63c8ff, transparent: true, opacity: 0.6 });
      return new THREE.Line(geo, mat);
    });
  }, [hopMarkers]);

  return (
    <>
      <group ref={globeGroupRef}>
        <mesh>
          <sphereGeometry args={[RADIUS, 96, 96]} />
          <meshPhongMaterial map={dayTex} specular={new THREE.Color(0x112244)} shininess={15} />
        </mesh>
        <mesh>
          <sphereGeometry args={[RADIUS * 1.065, 48, 48]} />
          <meshBasicMaterial color="#1a55cc" transparent opacity={0.06} side={THREE.BackSide} />
        </mesh>
        {arcObjects.map((lineObj, i) => <primitive key={`arc-${i}`} object={lineObj} />)}
        {hopMarkers.map((m, i) => (
          <group key={`hop-${i}`} position={m.pos}>
            <mesh>
              <ringGeometry args={[0.018, 0.014, 20]} />
              <meshBasicMaterial color={m.color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.010, 5, 10]} />
              <meshBasicMaterial color={m.color} />
            </mesh>
            {/* Floating label — rendered as HTML, anchored to label position above the dot */}
            <Html
              position={[
                m.labelPos.x - m.pos.x,
                m.labelPos.y - m.pos.y,
                m.labelPos.z - m.pos.z,
              ]}
              center
              occlude={false}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                whiteSpace: "nowrap",
              }}>
                {/* Number badge */}
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#0a1020",
                  border: `1.5px solid ${m.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 7, fontWeight: 800, color: m.color,
                  fontFamily: "monospace",
                  boxShadow: `0 0 6px ${m.color}88`,
                }}>{m.hopNum}</div>
                {/* City label */}
                {m.city && (
                  <div style={{
                    marginTop: 2,
                    background: "rgba(5,12,24,0.82)",
                    border: `1px solid ${m.color}33`,
                    borderRadius: 3,
                    padding: "1px 5px",
                    fontSize: 7,
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.04em",
                    backdropFilter: "blur(4px)",
                  }}>{m.city}{m.country ? `, ${m.country}` : ""}</div>
                )}
              </div>
            </Html>
          </group>
        ))}
      </group>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[RADIUS * 1.013, 64, 64]} />
        <meshPhongMaterial map={cloudTex} transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </>
  );
}

function GlobeView({ hops }: { hops: any[] }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#050c18" }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 40 }} gl={{ antialias: true, alpha: false }} style={{ cursor: "grab" }}>
        <Stars radius={150} depth={50} count={4500} factor={2.5} saturation={0} fade speed={0.2} />
        <ambientLight intensity={2.1} />
        <OrbitControls enablePan={false} enableZoom zoomSpeed={0.6} rotateSpeed={0.5} minDistance={2.2} maxDistance={7} enableDamping dampingFactor={0.08} />
        <Suspense fallback={null}><GlobeEarth hops={hops} /></Suspense>
      </Canvas>
    </div>
  );
}

// ── Error types ───────────────────────────────────────────────────────────────
type ErrorKind = "validation" | "network" | "backend" | "empty";
interface TraceError { kind: ErrorKind; message: string; }

const ERROR_META: Record<ErrorKind, { color: string; icon: string; title: string }> = {
  validation: { color: "#f59e0b", icon: "⚠",  title: "INVALID INPUT"     },
  network:    { color: "#ef4444", icon: "⚡", title: "CONNECTION ERROR"  },
  backend:    { color: "#ef4444", icon: "✕",  title: "TRACE FAILED"      },
  empty:      { color: "#94a3b8", icon: "◎",  title: "NO ROUTE DATA"     },
};

// ── Input error tooltip ───────────────────────────────────────────────────────
function InputError({ message }: { message: string }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
      background: "#0d1526", border: "1px solid rgba(245,158,11,0.35)",
      borderTop: "2px solid #f59e0b", borderRadius: "0 0 6px 6px",
      padding: "8px 12px 9px", fontSize: 11, color: "#fcd34d",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", gap: 7,
      animation: "errDrop 0.2s cubic-bezier(0.16,1,0.3,1) both",
      boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
    }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>⚠</span>
      {message}
    </div>
  );
}

// ── Sidebar error card ────────────────────────────────────────────────────────
function SidebarError({ error, onRetry }: { error: TraceError; onRetry: () => void }) {
  const meta = ERROR_META[error.kind];
  return (
    <div style={{
      margin: 14, padding: "14px 14px 12px",
      borderRadius: 7, border: `1px solid ${meta.color}33`,
      borderLeft: `3px solid ${meta.color}`,
      background: `${meta.color}0a`,
      display: "flex", flexDirection: "column", gap: 7,
      animation: "hopIn 0.3s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 13, color: meta.color }}>{meta.icon}</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: meta.color }}>
          {meta.title}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
        {error.message}
      </div>
      <button
        onClick={onRetry}
        style={{
          alignSelf: "flex-start", marginTop: 2, padding: "5px 12px",
          background: "transparent", border: `1px solid ${meta.color}44`,
          borderRadius: 4, color: meta.color, fontFamily: "'Syne', sans-serif",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = `${meta.color}15`; e.currentTarget.style.borderColor = `${meta.color}80`; }}
        onMouseOut={(e)  => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${meta.color}44`; }}
      >
        RETRY
      </button>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  const entries: Array<{ type: keyof typeof TYPE_CONFIG; desc: string }> = [
    { type: "local",       desc: "Your machine / LAN" },
    { type: "isp",         desc: "ISP router" },
    { type: "backbone",    desc: "Core internet backbone network" },
    { type: "exchange",    desc: "Internet Exchange" },
    { type: "cdn",         desc: "CDN / Cloud edge" },
    { type: "destination", desc: "Target host" },
    { type: "unknown",     desc: "Unknown hop" },
  ];
  return (
    <div style={{ padding: "15px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: 10, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>NODE TYPES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {entries.map(({ type, desc }) => {
          const cfg = TYPE_CONFIG[type];
          return (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 6px ${cfg.color}88`, flexShrink: 0 }} />
              <span style={{ fontSize: 10, letterSpacing: "0.12em", color: cfg.color, fontWeight: 700, fontFamily: "'Syne', sans-serif", minWidth: 36 }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}>{desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hop item ──────────────────────────────────────────────────────────────────
function HopItem({ hop, index, total, selected, onSelect }: any) {
  const type = classifyHop(hop, index, total);
  const cfg  = TYPE_CONFIG[type];
  const rtt  = hop.avgRtt ? parseFloat(hop.avgRtt) : null;
  const rttColor = rtt === null ? "rgba(255,255,255,0.25)" : rtt < 50 ? "#22c55e" : rtt < 150 ? "#f59e0b" : "#ef4444";

  return (
    <div onClick={() => onSelect(index === selected ? null : index)} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
      background: selected ? "rgba(99,200,255,0.05)" : "transparent",
      borderLeft: selected ? `2px solid ${cfg.color}` : "2px solid transparent",
      transition: "background 0.15s", animation: "hopIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${cfg.color}`, background: cfg.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: cfg.color, fontFamily: "monospace", flexShrink: 0 }}>
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hop.ip || "Silent Router"}</div>
        {hop.geo?.city
          ? <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{hop.geo.city}, {hop.geo.country}</div>
          : <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 1, fontStyle: "italic" }}>no geolocation</div>}
        {hop.geo?.org && (
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace", letterSpacing: "0.02em" }}>
            {hop.geo.org}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: rttColor, fontFamily: "monospace" }}>{rtt !== null ? `${rtt}ms` : "—"}</span>
        <span style={{ fontSize: 8, letterSpacing: "0.12em", fontWeight: 700, color: cfg.color, fontFamily: "'Syne', sans-serif" }}>{cfg.label}</span>
      </div>
    </div>
  );
}

// ── Trace summary ─────────────────────────────────────────────────────────────
function TraceSummary({ hops }: { hops: any[] }) {
  const validRtt  = hops.filter((h) => h.avgRtt).map((h) => parseFloat(h.avgRtt));
  const totalMs   = validRtt.length ? validRtt[validRtt.length - 1].toFixed(1) : "—";
  const avgMs     = validRtt.length ? (validRtt.reduce((a, b) => a + b, 0) / validRtt.length).toFixed(1) : "—";
  const countries = [...new Set(hops.filter((h) => h.geo?.country).map((h) => h.geo.country))];
  return (
    <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 0 }}>
      {[
        { label: "HOPS",      val: hops.length || "—" },
        { label: "TOTAL RTT", val: totalMs !== "—" ? `${totalMs}ms` : "—" },
        { label: "AVG RTT",   val: avgMs   !== "—" ? `${avgMs}ms`   : "—" },
        { label: "COUNTRIES", val: countries.length || "—" },
      ].map((s, i) => (
        <div key={i} style={{ flex: 1, borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingLeft: i > 0 ? 12 : 0 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.28)", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>{s.label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)", marginTop: 2 }}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VisualizerPage() {
  const router = useRouter();
  const [target,      setTarget     ] = useState("");
  const [loading,     setLoading    ] = useState(false);
  const [hops,        setHops       ] = useState<any[]>([]);
  const [selectedHop, setSelectedHop] = useState<number | null>(null);
  const [viewMode,    setViewMode   ] = useState<"map" | "globe">("map");
  const [traceError,  setTraceError ] = useState<TraceError | null>(null);
  const [inputError,  setInputError ] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
const abortCtrlRef = useRef<AbortController | null>(null);

  const handleTrace = useCallback(async () => {
  const validationMsg = validateTarget(target);
  if (validationMsg) {
    setInputError(validationMsg);
    inputRef.current?.focus();
    return;
  }
  setInputError(null);
  setTraceError(null);
  setLoading(true);
  setHops([]);
  setSelectedHop(null);

  const ctrl = new AbortController();
  abortCtrlRef.current = ctrl;

  const cleanTarget = target.trim().replace(/^https?:\/\//i, "").split("/")[0];

  try {
    let res: Response;
    try {
      res = await fetch("http://localhost:5000/trace", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: cleanTarget }),
        signal:  ctrl.signal,     
      });
    } catch (fetchErr: any) {
      if (fetchErr?.name === "AbortError") return;   // user cancelled, stay silent
      setTraceError({
        kind: "network",
        message: "Could not reach the backend server. Make sure it is running on port 5000.",
      });
      return;
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      setTraceError({ kind: "backend", message: `Server returned an unreadable response (HTTP ${res.status}). Check the backend logs.` });
      return;
    }

    if (!res.ok) {
      setTraceError({
        kind: "backend",
        message: data?.error ? `Backend error: ${data.error}` : `Request failed with HTTP ${res.status}.`,
      });
      return;
    }

    if (data.error) {
      const msg: string = data.error.toLowerCase();
      const friendly =
        msg.includes("invalid") || msg.includes("not a valid")
          ? `"${cleanTarget}" is not a valid target. Try a hostname like google.com or an IP like 8.8.8.8.`
        : msg.includes("resolv") || msg.includes("not found") || msg.includes("unknown host")
          ? `Could not resolve "${cleanTarget}". Check the spelling or try an IP address instead.`
        : msg.includes("permission") || msg.includes("operation not permitted")
          ? "Permission denied. Ensure the backend container has NET_RAW capability set in docker-compose."
        : msg.includes("timeout")
          ? "The trace timed out. The target host may be filtering ICMP packets."
        : data.error;
      setTraceError({ kind: "backend", message: friendly });
      return;
    }

    if (!data.hops || data.hops.length === 0) {
      setTraceError({
        kind: "empty",
        message: "The trace completed but returned no hops. The target may be on your local network or all probes were filtered.",
      });
      return;
    }

    setHops(data.hops);

  } finally {
    setLoading(false);
    abortCtrlRef.current = null;
  }
}, [target]);

const handleCancel = useCallback(async () => {
  // 1. Kill the fetch on the frontend
  abortCtrlRef.current?.abort();
  abortCtrlRef.current = null;
  setLoading(false);
  setTraceError(null);

  try {
    await fetch("http://localhost:5000/cancel", { method: "POST" });
  } catch {
  }
}, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
    if (inputError) setInputError(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .mtr-root {
          height:100svh; min-height:600px; background:#050c18; color:white;
          font-family:'DM Sans',sans-serif;
          display:grid; grid-template-rows:64px 1fr; overflow:hidden;
        }
        .mtr-nav {
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px; border-bottom:1px solid rgba(255,255,255,0.07);
          background:rgba(5,12,24,0.95); backdrop-filter:blur(12px);
          position:relative; z-index:100;
        }
        .mtr-logo { font-family:'Syne',sans-serif;cursor:pointer; font-weight:800; font-size:13px; letter-spacing:.22em; color:white; }
        .mtr-logo span { color:#3b82f6; }

        .search-wrap { flex:1; max-width:440px; margin:0 32px; position:relative; }
        .search-input {
          width:100%; height:38px; background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:white;
          font-family:'DM Sans',sans-serif; font-size:13px; padding:0 110px 0 38px;
          outline:none; transition:border-color .2s,background .2s; letter-spacing:.02em;
        }
        .search-input::placeholder { color:rgba(255,255,255,0.28); }
        .search-input:focus { border-color:rgba(59,130,246,0.6); background:rgba(255,255,255,0.07); }
        .search-input.err { border-color:rgba(245,158,11,0.6)!important; border-radius:6px 6px 0 0; background:rgba(245,158,11,0.04)!important; }
        .search-input.err:focus { border-color:rgba(245,158,11,0.85)!important; }

        .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:.4; pointer-events:none; }
        .search-btn {
          position:absolute; right:4px; top:4px; bottom:4px; padding:0 16px;
          background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.4);
          border-radius:4px; color:#93c5fd; font-family:'Syne',sans-serif;
          font-size:10px; font-weight:700; letter-spacing:.15em; cursor:pointer;
          transition:all .2s; white-space:nowrap;
        }
        .search-btn:hover:not(:disabled) { background:rgba(59,130,246,0.35); border-color:rgba(59,130,246,0.7); color:white; }
        .search-btn:disabled { opacity:.5; cursor:not-allowed; }
        .cancel-btn {
  position:absolute; right:4px; top:4px; bottom:4px; padding:0 16px;
  background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4);
  border-radius:4px; color:#fca5a5; font-family:'Syne',sans-serif;
  font-size:10px; font-weight:700; letter-spacing:.15em; cursor:pointer;
  transition:all .2s; white-space:nowrap;
}
.cancel-btn:hover { background:rgba(239,68,68,0.28); border-color:rgba(239,68,68,0.7); color:white; }

        .back-btn {
          font-size:12px; color:rgba(255,255,255,0.4); cursor:pointer;
          transition:color .2s; display:flex; align-items:center; gap:6px;
          padding:6px 0; font-family:'Syne',sans-serif; letter-spacing:.08em; white-space:nowrap;
        }
        .back-btn:hover { color:rgba(255,255,255,0.8); }

        .mtr-body { display:grid; grid-template-columns:300px 1fr; min-height:0; }
        .sidebar {
          display:flex; flex-direction:column;
          border-right:1px solid rgba(255,255,255,0.07);
          background:rgba(8,15,32,0.8); min-height:0; overflow:hidden;
        }
        .sidebar-header { padding:16px 20px 12px; border-bottom:1px solid rgba(255,255,255,0.05); flex-shrink:0; }
        .sidebar-title { font-family:'Syne',sans-serif; font-size:10px; font-weight:700; letter-spacing:.24em; color:rgba(255,255,255,0.67); text-transform:uppercase; }
        .hop-list { flex:1; overflow-y:auto; min-height:0; }
        .hop-list::-webkit-scrollbar { width:3px; }
        .hop-list::-webkit-scrollbar-track { background:transparent; }
        .hop-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
        .empty-state { padding:40px 20px; text-align:center; color:rgba(255,255,255,0.2); font-size:12px; line-height:1.8; }
        .loading-state { padding:24px 20px; display:flex; flex-direction:column; gap:10px; }
        .skeleton { height:48px; background:rgba(255,255,255,0.04); border-radius:4px; animation:shimmer 1.4s ease-in-out infinite; }
        .loading-hint { text-align:center; font-size:10px; color:rgba(255,255,255,0.2); margin-top:4px; font-family:'DM Sans',sans-serif; letter-spacing:.08em; }

        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes hopIn   { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes errDrop { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        .map-area { position:relative; overflow:hidden; background:#050c18; }
        .view-toggle {
          position:absolute; top:16px; right:16px; z-index:1000; display:flex;
          background:rgba(5,12,24,0.9); border:1px solid rgba(255,255,255,0.1);
          border-radius:6px; overflow:hidden; backdrop-filter:blur(8px);
        }
        .toggle-btn {
          padding:8px 16px; font-family:'Syne',sans-serif; font-size:10px; font-weight:700;
          letter-spacing:.12em; border:none; cursor:pointer; transition:all .2s;
          display:flex; align-items:center; gap:6px;
        }
        .toggle-btn.active { background:rgba(59,130,246,0.25); color:#93c5fd; }
        .toggle-btn:not(.active) { background:transparent; color:rgba(255,255,255,0.35); }
        .toggle-btn:not(.active):hover { color:rgba(255,255,255,0.65); }
        .packet-legend {
          position:absolute; bottom:16px; right:16px; z-index:1000;
          background:rgba(5,12,24,0.88); border:1px solid rgba(255,255,255,0.08);
          border-radius:6px; padding:10px 14px; backdrop-filter:blur(8px);
          display:flex; align-items:center; gap:8px; font-size:10px;
          color:rgba(255,255,255,0.4); font-family:'DM Sans',sans-serif;
        }
        .packet-dot {
          width:8px; height:8px; border-radius:50%; background:#63c8ff;
          box-shadow:0 0 8px #63c8ffaa; animation:packetGlow 1.2s ease-in-out infinite;
        }
        @keyframes packetGlow { 0%,100%{box-shadow:0 0 6px #63c8ff88} 50%{box-shadow:0 0 14px #63c8ff} }
        .globe-hint {
          position:absolute; bottom:16px; left:50%; transform:translateX(-50%); z-index:1000;
          background:rgba(5,12,24,0.75); border:1px solid rgba(255,255,255,0.07); border-radius:6px;
          padding:7px 14px; backdrop-filter:blur(8px); display:flex; align-items:center; gap:7px;
          font-size:10px; color:rgba(255,255,255,0.3); font-family:'DM Sans',sans-serif;
          pointer-events:none; white-space:nowrap;
        }
      `}</style>

      <div className="mtr-root">
        <nav className="mtr-nav">
          <div className="mtr-logo" onClick={() => router.push("/")} >MTR<span>·</span>VISUAL</div>

          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.5" />
              <path d="M11 11L14.5 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              className={`search-input${inputError ? " err" : ""}`}
              placeholder="Enter domain — e.g. google.com"
              value={target}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleTrace()}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? "input-err" : undefined}
            />
            {loading ? (
  <button className="cancel-btn" onClick={handleCancel}>
    ✕ CANCEL
  </button>
) : (
  <button className="search-btn" onClick={handleTrace}>
    TRACE →
  </button>
)}
            {inputError && <InputError message={inputError} />}
          </div>

          <div className="back-btn" onClick={() => router.push("/")}>← HOME</div>
        </nav>

        <div className="mtr-body">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title">Route Hops</div>
            </div>

            {hops.length > 0 && <TraceSummary hops={hops} />}

            <div className="hop-list">
              {loading && (
                <div className="loading-state">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                  <p className="loading-hint">Running trace — this may take up to 30s…</p>
                </div>
              )}

              {!loading && traceError && hops.length === 0 && (
                <SidebarError error={traceError} onRetry={handleTrace} />
              )}

              {!loading && !traceError && hops.length === 0 && (
                <div className="empty-state">
                  <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>⌖</div>
                  Enter a domain above<br />and start a trace to<br />see the route hops
                </div>
              )}

              {!loading && hops.map((hop, i) => (
                <HopItem key={i} hop={hop} index={i} total={hops.length} selected={selectedHop === i} onSelect={setSelectedHop} />
              ))}
            </div>

            <Legend />
          </aside>

          <div className="map-area">
            <div className="view-toggle">
              <button className={`toggle-btn ${viewMode === "map" ? "active" : ""}`} onClick={() => setViewMode("map")}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5L5.5 1l5 2L15 1.5V13.5L10.5 15l-5-2L1 13.5V2.5z" opacity="0.8" fillRule="evenodd" /></svg>
                MAP
              </button>
              <button className={`toggle-btn ${viewMode === "globe" ? "active" : ""}`} onClick={() => setViewMode("globe")}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <ellipse cx="8" cy="8" rx="3" ry="6.5" stroke="currentColor" strokeWidth="1" fill="none" />
                  <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1" />
                </svg>
                GLOBE
              </button>
            </div>

            {hops.length >= 2 && viewMode === "map" && (
              <div className="packet-legend"><div className="packet-dot" /> Packet in transit</div>
            )}
            {viewMode === "globe" && (
              <div className="globe-hint">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Drag to rotate · Scroll to zoom
              </div>
            )}

            {viewMode === "map"
              ? <div style={{ position: "absolute", inset: 0 }}><MapView hops={hops} /></div>
              : <div style={{ position: "absolute", inset: 0 }}><GlobeView hops={hops} /></div>}
          </div>
        </div>
      </div>
    </>
  );
}