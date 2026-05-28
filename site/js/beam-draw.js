// beam-draw.js
// draws the polar beam pattern on canvas
// // honestly the polar coordinate math here took me embarrassingly long

const canvas = document.getElementById('beamCanvas');
const ctx = canvas.getContext('2d');

// make it crisp on high-DPI screens
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr || 420 * dpr;
  canvas.height = canvas.width; // square
  ctx.scale(dpr, dpr);
  canvas.style.width = (canvas.width / dpr) + 'px';
  canvas.style.height = (canvas.height / dpr) + 'px';
}

// CSS variable color reader
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawBeam(params) {
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.42; // radius of the polar plot

  const ink = getCSSVar('--ink');
  const accent = getCSSVar('--accent');
  const border = getCSSVar('--border');
  const bg = getCSSVar('--bg');

  ctx.clearRect(0, 0, W, H);

  // background
  ctx.fillStyle = 'rgba(245,240,232,0.5)';
  ctx.fillRect(0, 0, W, H);

  // --- draw polar grid circles ---
  const levels = [0.25, 0.5, 0.75, 1.0];
  levels.forEach(lvl => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * lvl, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(100,80,40,0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // label on the right side
    if (lvl < 1.0) {
      ctx.fillStyle = 'rgba(100,80,40,0.45)';
      ctx.font = `9px IBM Plex Mono, monospace`;
      ctx.fillText(lvl.toFixed(2), cx + R * lvl + 3, cy - 3);
    }
  });

  // --- draw angle lines (every 30 degrees) ---
  for (let a = 0; a < 180; a += 30) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx - R * Math.cos(rad), cy - R * Math.sin(rad));
    ctx.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
    ctx.strokeStyle = 'rgba(100,80,40,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // angle labels along bottom half (visible angles -90 to +90)
  const labelAngles = [-90, -60, -30, 0, 30, 60, 90];
  ctx.fillStyle = 'rgba(100,80,40,0.5)';
  ctx.font = `9px IBM Plex Mono, monospace`;
  ctx.textAlign = 'center';
  labelAngles.forEach(a => {
    // map physical angle to canvas coords
    // 0° is straight up, ±90° is horizontal
    const rad = ((a - 90) * Math.PI) / 180; // rotate so 0° points up
    const lx = cx + (R + 14) * Math.cos(rad);
    const ly = cy + (R + 14) * Math.sin(rad);
    ctx.fillText(a + '°', lx, ly);
  });

  // center dot + crosshair
  ctx.strokeStyle = 'rgba(100,80,40,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - R);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  // --- compute and draw beam pattern ---
  const pattern = buildPattern(params);

  // beam fill (semi-transparent)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  pattern.forEach(({ angle, magnitude }) => {
    // angle: -90 to 90, magnitude: 0 to 1
    // map so 0° is upward (-90deg in canvas coords)
    const rad = ((angle - 90) * Math.PI) / 180;
    const r = magnitude * R;
    const px = cx + r * Math.cos(rad);
    const py = cy + r * Math.sin(rad);
    ctx.lineTo(px, py);
  });
  ctx.closePath();

  // fill with accent color, semi-transparent
  ctx.fillStyle = `rgba(184,134,11,0.12)`;
  ctx.fill();

  // beam outline
  ctx.beginPath();
  let first = true;
  pattern.forEach(({ angle, magnitude }) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    const r = magnitude * R;
    const px = cx + r * Math.cos(rad);
    const py = cy + r * Math.sin(rad);
    if (first) { ctx.moveTo(px, py); first = false; }
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = accent || '#b8860b';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([]);
  ctx.stroke();

  // close back to center
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  const firstP = pattern[0];
  const lastP = pattern[pattern.length - 1];
  const firstRad = ((firstP.angle - 90) * Math.PI) / 180;
  const lastRad = ((lastP.angle - 90) * Math.PI) / 180;
  ctx.lineTo(cx + firstP.magnitude * R * Math.cos(firstRad), cy + firstP.magnitude * R * Math.sin(firstRad));
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + lastP.magnitude * R * Math.cos(lastRad), cy + lastP.magnitude * R * Math.sin(lastRad));
  ctx.strokeStyle = 'rgba(184,134,11,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // steering direction indicator line
  const steerRad = ((params.steerAngle - 90) * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + R * 0.35 * Math.cos(steerRad), cy + R * 0.35 * Math.sin(steerRad));
  ctx.strokeStyle = 'rgba(184,134,11,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
  ctx.fillStyle = accent || '#b8860b';
  ctx.fill();

  // update stat readouts
  updateStats(params);
}

function updateStats(params) {
  const bwEl = document.getElementById('beamWidth');
  const saEl = document.getElementById('steerAngle');
  const slEl = document.getElementById('sideLevel');
  const glEl = document.getElementById('gratingLobes');

  if (bwEl) bwEl.textContent = estimateBeamwidth(params);
  if (saEl) saEl.textContent = params.steerAngle.toFixed(1) + '°';
  if (slEl) slEl.textContent = estimateSidelobeLevel(params);
  if (glEl) glEl.textContent = checkGratingLobes(params);
}

// init
setupCanvas();
window.addEventListener('resize', () => {
  setupCanvas();
  if (window.currentParams) drawBeam(window.currentParams);
});
