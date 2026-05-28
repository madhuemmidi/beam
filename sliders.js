// sliders.js
// wires up all the sliders + handles the ripple/interdependency logic
// the ripple effect was the fun part to figure out

// current state
let params = {
  frequency: 10,      // GHz
  elements: 8,        // count
  spacing: 50,        // % of lambda (50 = 0.5λ)
  steerAngle: 0,      // degrees
  phaseShift: 0,      // degrees
  amplitude: 100      // %
};

// DOM refs
const sliders = {
  freq:      document.getElementById('freq'),
  elements:  document.getElementById('elements'),
  spacing:   document.getElementById('spacing'),
  angle:     document.getElementById('angle'),
  phase:     document.getElementById('phase'),
  amplitude: document.getElementById('amplitude'),
};

const displays = {
  freq:      document.getElementById('freq-val'),
  elements:  document.getElementById('elem-val'),
  spacing:   document.getElementById('spacing-val'),
  angle:     document.getElementById('angle-val'),
  phase:     document.getElementById('phase-val'),
  amplitude: document.getElementById('amp-val'),
};

const rippleText = document.getElementById('rippleText');

// format display values
function formatVal(key, raw) {
  const v = parseFloat(raw);
  switch (key) {
    case 'freq':      return v + ' GHz';
    case 'elements':  return Math.round(v) + '';
    case 'spacing':   return (v / 100).toFixed(2) + 'λ';
    case 'angle':     return v + '°';
    case 'phase':     return v + '°';
    case 'amplitude': return v + '%';
    default:          return raw;
  }
}

// ripple descriptions — what changes when you move what
// each entry: [changedParam, affectedParam, description string]
const rippleRules = {
  freq: (v) => {
    const ghz = parseFloat(v);
    // higher freq = smaller wavelength = need tighter spacing
    const newSpacing = Math.max(10, Math.min(100, Math.round(50 - (ghz - 10) * 0.3)));
    // silently nudge spacing slider
    nudgeParam('spacing', newSpacing);
    const direction = ghz > params.frequency ? 'increased' : 'decreased';
    const beamDir = ghz > params.frequency ? 'narrowed' : 'widened';
    return `You ${direction} Frequency → Beam ${beamDir} → Element spacing recommendation ${ghz > params.frequency ? 'decreased' : 'increased'}`;
  },
  elements: (v) => {
    const n = parseInt(v);
    const direction = n > params.elements ? 'added more' : 'reduced';
    return `You ${direction} Antenna Elements → Beam is now ${n > params.elements ? 'sharper and more focused' : 'wider and more spread'} → Side lobe level ${n > params.elements ? 'improved slightly' : 'got worse'}`;
  },
  spacing: (v) => {
    const d = parseFloat(v) / 100;
    if (d > 0.5) {
      return `Element Spacing > 0.5λ → Grating lobes may appear → You might see phantom beams in the plot ⚠`;
    } else if (d < 0.3) {
      return `Element Spacing < 0.3λ → Antennas are very close → Mutual coupling effects would be significant in real hardware`;
    }
    return `Element Spacing at ${d.toFixed(2)}λ → Good range, minimal grating lobe risk`;
  },
  angle: (v) => {
    const a = parseFloat(v);
    // large steering angles widen the beam
    const beamWidening = Math.abs(a) > 40 ? ' — beam is widening due to projection effect' : '';
    return `Steering to ${a}° → Beam pointed ${a > 0 ? 'right' : a < 0 ? 'left' : 'straight ahead'}${beamWidening}`;
  },
  phase: (v) => {
    const p = parseFloat(v);
    // phase shift interacts with steering angle
    const effective = params.steerAngle + p * 0.1;
    nudgeParam('angle', Math.max(-60, Math.min(60, Math.round(params.steerAngle + p * 0.08))));
    return `Phase Shift changed to ${p}° → Effective steering angle shifted → Beam moved to ~${effective.toFixed(1)}°`;
  },
  amplitude: (v) => {
    const a = parseFloat(v);
    return `Signal Amplitude set to ${a}% → Beam ${a < 50 ? 'is weaker — range reduced significantly in real radar' : a === 100 ? 'at full strength' : 'at reduced power'}`;
  }
};

// nudge a param and update its slider/display without triggering its own ripple
function nudgeParam(key, value, animate = true) {
  const sliderKey = key === 'spacing' ? 'spacing' : key === 'angle' ? 'angle' : key;
  const slider = sliders[sliderKey];
  const display = displays[sliderKey];
  if (!slider) return;

  slider.value = value;
  if (display) display.textContent = formatVal(sliderKey, value);

  // highlight the affected param block
  if (animate) {
    const block = slider.closest('.param-block');
    if (block) {
      block.classList.add('ripple-highlight');
      setTimeout(() => block.classList.remove('ripple-highlight'), 1200);
    }
  }
}

// update params object from slider keys
function syncParams() {
  params = {
    frequency:  parseFloat(sliders.freq.value),
    elements:   parseInt(sliders.elements.value),
    spacing:    parseFloat(sliders.spacing.value),
    steerAngle: parseFloat(sliders.angle.value),
    phaseShift: parseFloat(sliders.phase.value),
    amplitude:  parseFloat(sliders.amplitude.value),
  };
}

// main redraw
function redraw() {
  syncParams();
  window.currentParams = params;
  drawBeam(params);
}

// wire up each slider
Object.entries(sliders).forEach(([key, slider]) => {
  if (!slider) return;

  slider.addEventListener('input', (e) => {
    const val = e.target.value;

    // update display immediately
    if (displays[key]) displays[key].textContent = formatVal(key, val);

    // run ripple logic
    const prevParams = { ...params };
    syncParams();

    if (rippleRules[key]) {
      const msg = rippleRules[key](val);
      rippleText.style.opacity = '0';
      setTimeout(() => {
        rippleText.textContent = msg;
        rippleText.style.opacity = '1';
      }, 150);
    }

    redraw();
  });
});

// initial draw on load
redraw();
