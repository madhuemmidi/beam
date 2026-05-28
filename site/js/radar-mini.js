// radar-mini.js
// the little radar on the homepage — just for vibes
// made it draggable so people can play with it right away

const canvas = document.getElementById('radarCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let angle = 30; // current beam angle
  let isDragging = false;
  let animFrame = 0;
  let sweepAngle = 0; // rotating sweep

  function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#b8860b';
  }

  function draw() {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.44;
    const accent = getCSSVar('--accent');
    const border = getCSSVar('--border');

    ctx.clearRect(0, 0, W, H);

    // grid circles
    [0.33, 0.66, 1.0].forEach(lvl => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * lvl, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(184,134,11,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // angle ticks
    for (let a = 0; a < 360; a += 30) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
      ctx.strokeStyle = 'rgba(184,134,11,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // angle labels
    const labels = { 0: '0°', 90: '90°', 180: '180°', 270: '270°' };
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.fillStyle = 'rgba(107,94,74,0.6)';
    ctx.textAlign = 'center';
    Object.entries(labels).forEach(([a, label]) => {
      const rad = (parseFloat(a) * Math.PI) / 180;
      ctx.fillText(label, cx + (R + 18) * Math.cos(rad), cy + (R + 18) * Math.sin(rad) + 4);
    });

    // sweep fade — rotates continuously
    const sweepRad = (sweepAngle * Math.PI) / 180;
    const grad = ctx.createConicalGradient
      ? null // not supported everywhere
      : null;

    // manual sweep trail (3 lines with decreasing opacity)
    for (let trail = 0; trail < 60; trail += 5) {
      const t = (sweepAngle - trail + 360) % 360;
      const tRad = (t * Math.PI) / 180;
      const opacity = (1 - trail / 60) * 0.15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(tRad), cy + R * Math.sin(tRad));
      ctx.strokeStyle = `rgba(184,134,11,${opacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
    ctx.strokeStyle = `rgba(184,134,11,0.7)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // beam direction line (draggable)
    const beamRad = ((angle - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * 0.9 * Math.cos(beamRad), cy + R * 0.9 * Math.sin(beamRad));
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // fake blip dots — 2-3 random targets
    const blips = [
      { a: 45, r: 0.6 },
      { a: 130, r: 0.4 },
      { a: 200, r: 0.75 },
    ];
    blips.forEach(b => {
      const bRad = (b.a * Math.PI) / 180;
      // fade blip based on sweep proximity
      const diff = Math.abs(((sweepAngle - b.a + 360) % 360));
      const age = diff < 180 ? diff : 360 - diff;
      const opacity = Math.max(0, 1 - age / 120) * 0.85;
      if (opacity > 0.05) {
        ctx.beginPath();
        ctx.arc(cx + R * b.r * Math.cos(bRad), cy + R * b.r * Math.sin(bRad), 3, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(184,134,11,${opacity})`;
        ctx.fill();
      }
    });

    // center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = accent;
    ctx.fill();

    // frequency label
    ctx.font = '9px IBM Plex Mono, monospace';
    ctx.fillStyle = 'rgba(107,94,74,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('300 GHz', cx - R * 0.95, cy - R * 0.8);
  }

  function animate() {
    sweepAngle = (sweepAngle + 0.8) % 360;
    draw();
    animFrame = requestAnimationFrame(animate);
  }

  // drag to steer beam
  function getAngleFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX - canvas.width / 2;
    const y = (e.clientY - rect.top) * scaleY - canvas.height / 2;
    return Math.atan2(y, x) * 180 / Math.PI + 90; // 0° = up
  }

  canvas.addEventListener('mousedown', () => isDragging = true);
  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      angle = getAngleFromEvent(e);
    }
  });

  canvas.addEventListener('touchstart', () => isDragging = true);
  canvas.addEventListener('touchend', () => isDragging = false);
  canvas.addEventListener('touchmove', (e) => {
    if (isDragging) {
      e.preventDefault();
      angle = getAngleFromEvent(e.touches[0]);
    }
  }, { passive: false });

  animate();
}
