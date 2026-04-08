// script.js - Main application logic

const API = 'http://localhost:5000';
const map = L.map('map', { center:[20,0], zoom:2, zoomControl:true });
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution:'© OpenStreetMap © CartoDB', subdomains:'abcd', maxZoom:19
}).addTo(map);

const CDN_KEYWORDS = ['cloudflare','akamai','fastly','cloudfront','amazon','google','microsoft','azure','vercel','netlify'];
function classifyHop(hop, isLast) {
  if (isLast) return 'origin';
  if (!hop.ip || !hop.geo) return 'local';
  const org = (hop.geo.org || '').toLowerCase();
  if (CDN_KEYWORDS.some(k => org.includes(k))) return 'cdn';
  return 'isp';
}
const HOP_COLORS = { local:'#94a3b8', isp:'#00aaff', cdn:'#f59e0b', origin:'#00e5a0' };

let mapLayers = [];
let hopItems = [];

function clearMap() {
  mapLayers.forEach(l => map.removeLayer(l));
  mapLayers = [];
}

async function startTrace() {
  const input = document.getElementById('url-input').value.trim();
  if (!input) return;
  const btn = document.getElementById('trace-btn');
  btn.disabled = true;
  btn.textContent = 'Running…';
  clearMap();
  if (window.__globe) window.__globe.clearGlobe();
  showLoading();
  try {
    const res = await fetch(`${API}/trace`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ url: input })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Trace failed');
    renderSidebar(data.hops);
    await animateTrace(data.hops);
    showStats(data);
  } catch(e) {
    showError(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Trace route';
  }
}

function renderSidebar(hops) {
  const list = document.getElementById('hop-list');
  list.innerHTML = '';
  hopItems = [];
  hops.forEach((hop, i) => {
    const isLast = i === hops.length - 1;
    const type = classifyHop(hop, isLast);
    const color = HOP_COLORS[type];
    const hasgeo = hop.geo?.lat != null;
    const item = document.createElement('div');
    item.className = 'hop-item';
    if (hasgeo) item.onclick = () => map.flyTo([hop.geo.lat, hop.geo.lng], 6, {duration:1});
    const rttColor = !hop.avgRtt ? 'var(--muted)' : hop.avgRtt < 50 ? '#00e5a0' : hop.avgRtt < 150 ? '#f59e0b' : '#f87171';
    item.innerHTML = `
      <div class="hop-dot" style="border-color:${color};color:${color}"></div>
      <div class="hop-content">
        <div class="hop-num">hop ${hop.hop}</div>
        <div class="hop-host">${!hop.ip ? '??? (silent router)' : hop.ip}</div>
        ${hasgeo ? `<div class="hop-place">${[hop.geo.city, hop.geo.country].filter(Boolean).join(', ')}</div>` : ''}
        ${hop.geo?.org ? `<div class="hop-org">${hop.geo.org}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end">
        <div class="hop-rtt" style="color:${rttColor}">${hop.avgRtt ? hop.avgRtt.toFixed(1)+'ms' : '—'}</div>
        ${hop.loss > 0 ? `<div class="hop-loss ${hop.loss>20?'bad':''}">${hop.loss}% loss</div>` : ''}
      </div>`;
    list.appendChild(item);
    hopItems.push(item);
  });
}

async function animateTrace(hops) {
  const geoHops = hops.map((h, idx) => ({ ...h, originalIndex: idx })).filter(h => h.geo?.lat != null);
  if (!geoHops.length) return;
  const bounds = L.latLngBounds(geoHops.map(h => [h.geo.lat, h.geo.lng]));
  map.fitBounds(bounds, { padding:[60,60], animate:true, duration:1 });
  await sleep(900);
  
  const classifications = hops.map((h, idx) => classifyHop(h, idx === hops.length-1));
  const globePromise = window.__globe ? window.__globe.animateGlobeRoute(geoHops, hops, classifications) : Promise.resolve();
  
  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    const isLast = i === hops.length - 1;
    const type = classifyHop(hop, isLast);
    const color = HOP_COLORS[type];
    hopItems[i]?.classList.add('active');
    const dot = hopItems[i]?.querySelector('.hop-dot');
    if (dot) dot.classList.add('pulsing');
    if (hop.geo?.lat != null) {
      const marker = L.circleMarker([hop.geo.lat, hop.geo.lng], {
        radius: isLast ? 9 : i === 0 ? 7 : 5,
        color, weight: 2, fillColor: '#0b0f14', fillOpacity: 1,
      }).addTo(map);
      marker.bindPopup(buildPopup(hop, type, i, hops.length));
      mapLayers.push(marker);
      const prev = findPrevGeo(hops, i);
      if (prev) {
        await drawArc([prev.geo.lat, prev.geo.lng], [hop.geo.lat, hop.geo.lng], color);
      }
    }
    if (i > 0) hopItems[i-1]?.querySelector('.hop-dot')?.classList.remove('pulsing');
    await sleep(isLast ? 0 : 280);
  }
  await globePromise;
}

function findPrevGeo(hops, i) {
  for (let j = i-1; j >= 0; j--) if (hops[j].geo?.lat != null) return hops[j];
  return null;
}

function drawArc(from, to, color) {
  return new Promise(resolve => {
    const steps = 45;
    let pts = [];
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const lat = from[0] + (to[0] - from[0]) * f;
      const lng = from[1] + (to[1] - from[1]) * f;
      pts.push([lat, lng]);
    }
    let drawn = [pts[0]];
    const line = L.polyline(drawn, { color, weight: 1.8, opacity: 0.75, dashArray: '6 4' }).addTo(map);
    mapLayers.push(line);
    let idx = 1;
    const iv = setInterval(() => {
      if (idx >= pts.length) { clearInterval(iv); resolve(); return; }
      drawn.push(pts[idx++]);
      line.setLatLngs(drawn);
    }, 20);
  });
}

function buildPopup(hop, type, idx, total) {
  const g = hop.geo;
  return `<div style="min-width:165px"><div style="font-size:11px;color:#4a5a6a;margin-bottom:5px">hop ${hop.hop} · ${type}</div>
    <div style="font-size:13px;font-weight:500;margin-bottom:4px;color:${HOP_COLORS[type]}">${hop.ip||'???'}</div>
    ${g?.city ? `<div style="font-size:11px;margin-bottom:2px">${[g.city,g.region,g.country].filter(Boolean).join(', ')}</div>` : ''}
    ${g?.org ? `<div style="font-size:11px;color:#4a5a6a;margin-bottom:6px">${g.org}</div>` : ''}
    ${hop.avgRtt ? `<div style="font-size:12px">RTT: <span style="color:#00e5a0">${hop.avgRtt.toFixed(1)} ms</span></div>` : ''}
    ${hop.loss>0 ? `<div style="font-size:11px;color:#f87171">${hop.loss}% packet loss</div>` : ''}</div>`;
}

function showLoading() {
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('hop-list').innerHTML = `<div class="state-box"><div class="spinner"></div><div class="state-title">Tracing route…</div><div class="state-sub">mtr sends 5 probes per hop — usually takes 10–20 seconds</div></div>`;
}

function showError(msg) {
  document.getElementById('hop-list').innerHTML = `<div class="state-box"><div class="state-title" style="color:#f87171">Trace failed</div><div class="state-sub" style="color:#f87171">${msg}</div></div>`;
}

function showStats(data) {
  const lastRtt = [...data.hops].reverse().find(h => h.avgRtt > 0)?.avgRtt;
  document.getElementById('stat-hops').textContent = data.hops.length;
  document.getElementById('stat-geo').textContent = data.geoCount;
  document.getElementById('stat-rtt').textContent = lastRtt ? lastRtt.toFixed(0)+'ms' : '—';
  document.getElementById('stats-bar').style.display = 'flex';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

document.getElementById('url-input').addEventListener('keydown', e => { if(e.key==='Enter') startTrace(); });

function switchView(type) {
  const mapPanel = document.getElementById('panel-map');
  const globePanel = document.getElementById('panel-globe');
  const btnMap = document.getElementById('btn-map');
  const btnGlobe = document.getElementById('btn-globe');

  if (type === 'map') {
    mapPanel.classList.remove('hidden');
    globePanel.classList.add('hidden');
    btnMap.classList.add('active');
    btnGlobe.classList.remove('active');
  } else {
    mapPanel.classList.add('hidden');
    globePanel.classList.remove('hidden');
    btnMap.classList.remove('active');
    btnGlobe.classList.add('active');
    window.dispatchEvent(new Event('resize'));
  }
}