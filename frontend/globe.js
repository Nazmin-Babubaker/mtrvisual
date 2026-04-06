// globe.js - Three.js globe setup and animation

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const container = document.getElementById('globe-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050a);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 3.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(container.clientWidth, container.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.left = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.enableZoom = true;
controls.zoomSpeed = 0.8;
controls.rotateSpeed = 0.8;
controls.target.set(0, 0, 0);

// Stars background
const starGeometry = new THREE.BufferGeometry();
const starCount = 2000;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i*3] = (Math.random() - 0.5) * 2000;
  starPositions[i*3+1] = (Math.random() - 0.5) * 1000;
  starPositions[i*3+2] = (Math.random() - 0.5) * 500 - 200;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.7 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Earth sphere
const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Atmosphere glow
const glowGeometry = new THREE.SphereGeometry(1.01, 64, 64);
const glowMaterial = new THREE.MeshPhongMaterial({ color: 0x2266aa, transparent: true, opacity: 0.12 });
const atmosphere = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(atmosphere);

function latLngToVector3(lat, lng, radius = 1.01) {
  const phi = (90-lat) * Math.PI / 180;
  const theta = (lng+180) * Math.PI / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

let globeMarkers = [];
let globeArcs = [];

function clearGlobe() {
  globeMarkers.forEach(item => {
    if (item.mesh) scene.remove(item.mesh);
    if (item.label) scene.remove(item.label);
  });
  globeArcs.forEach(arc => scene.remove(arc));
  globeMarkers = [];
  globeArcs = [];
}

function addGlobeMarker(lat, lng, colorHex, hopIndex, tooltipText = "") {
  const pos = latLngToVector3(lat, lng, 1.008);
  const geometry = new THREE.SphereGeometry(0.012, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.5 });
  const marker = new THREE.Mesh(geometry, material);
  marker.userData = { hopIndex };
  marker.position.copy(pos);
  scene.add(marker);
  
  const div = document.createElement('div');
  div.textContent = tooltipText || `Hop ${hopIndex+1}`;
  div.style.color = '#d4dde8';
  div.style.fontSize = '10px';
  div.style.fontFamily = "'JetBrains Mono', monospace";
  div.style.backgroundColor = 'rgba(17,23,32,0.8)';
  div.style.padding = '2px 6px';
  div.style.borderRadius = '12px';
  div.style.border = `1px solid ${new THREE.Color(colorHex).getStyle()}`;
  div.style.whiteSpace = 'nowrap';
  div.style.backdropFilter = 'blur(4px)';
  div.style.pointerEvents = 'none';
  const label = new CSS2DObject(div);
  label.position.copy(pos.clone().multiplyScalar(1.02));
  scene.add(label);
  
  globeMarkers.push({ mesh: marker, label, hopIndex, lat, lng });
  return marker;
}

async function animateGlobeArc(fromLat, fromLng, toLat, toLng, colorHex, duration = 500) {
  const startVec = latLngToVector3(fromLat, fromLng, 1.01);
  const endVec = latLngToVector3(toLat, toLng, 1.01);
  const points = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = Math.acos(Math.min(1, Math.max(-1, startVec.dot(endVec))));
    const sinTheta = Math.sin(theta);
    const a = Math.sin((1 - t) * theta) / sinTheta;
    const b = Math.sin(t * theta) / sinTheta;
    const interpVec = new THREE.Vector3().copy(startVec).multiplyScalar(a).add(endVec.clone().multiplyScalar(b)).normalize().multiplyScalar(1.01);
    points.push(interpVec);
  }
  
  const material = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const lineObj = new THREE.Line(geometry, material);
  scene.add(lineObj);
  globeArcs.push(lineObj);
  
  let currentStep = 1;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (currentStep > points.length) {
        clearInterval(interval);
        resolve();
        return;
      }
      const slice = points.slice(0, currentStep);
      const newPositions = new Float32Array(slice.length * 3);
      slice.forEach((p, idx) => {
        newPositions[idx*3] = p.x;
        newPositions[idx*3+1] = p.y;
        newPositions[idx*3+2] = p.z;
      });
      geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
      currentStep++;
    }, duration / steps);
  });
}

async function animateGlobeRoute(geoHops, hopsFull, classifications) {
  if (!geoHops.length) return;
  clearGlobe();
  const HOP_COLORS_GLOBE = { local:'#94a3b8', isp:'#00aaff', cdn:'#f59e0b', origin:'#00e5a0' };
  
  for (let i = 0; i < geoHops.length; i++) {
    const hop = geoHops[i];
    const origHopIndex = hop.originalIndex;
    const type = classifications[origHopIndex];
    let colorHex = HOP_COLORS_GLOBE[type] || '#00aaff';
    if (origHopIndex === hopsFull.length-1) colorHex = '#00e5a0';
    const marker = addGlobeMarker(hop.geo.lat, hop.geo.lng, colorHex, origHopIndex, `${hop.host || hop.ip}\n${hop.geo.city || ''} ${hop.geo.country || ''}`);
    marker.userData.pulse = true;
    setTimeout(() => {
      if (marker && marker.material) marker.material.emissiveIntensity = 0.9;
      setTimeout(() => { if(marker && marker.material) marker.material.emissiveIntensity = 0.3; }, 400);
    }, 100);
  }
  
  for (let i = 1; i < geoHops.length; i++) {
    const prev = geoHops[i-1];
    const curr = geoHops[i];
    const currType = classifications[curr.originalIndex];
    let arcColor = HOP_COLORS_GLOBE[currType] || '#f59e0b';
    if (curr.originalIndex === hopsFull.length-1) arcColor = '#00e5a0';
    await animateGlobeArc(prev.geo.lat, prev.geo.lng, curr.geo.lat, curr.geo.lng, arcColor, 480);
    await new Promise(r => setTimeout(r, 180));
  }
}

function animateGlobe() {
  requestAnimationFrame(animateGlobe);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animateGlobe();

window.addEventListener('resize', () => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
});

setTimeout(() => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
}, 100);

window.__globe = { animateGlobeRoute, clearGlobe };