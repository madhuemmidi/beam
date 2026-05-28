// beam-math.js
// all the array factor stuff — took a while to get this right
// ref: IEEE Antenna Theory (Balanis), Analog Devices phased array guide

/**
 * compute the array factor at angle theta (degrees)
 * for a uniform linear array
 *
 * AF(theta) = sum_{n=0}^{N-1} exp(j * n * (k*d*sin(theta) - phase_shift))
 *
 * returns magnitude normalized to 1
 */
function computeArrayFactor(thetaDeg, N, dLambda, steerDeg, phaseShiftDeg) {
  const theta = (thetaDeg * Math.PI) / 180;
  const steer = (steerDeg * Math.PI) / 180;
  const psi = 2 * Math.PI * dLambda * Math.sin(theta); // phase from geometry
  const delta = (phaseShiftDeg * Math.PI) / 180;       // manual phase shift
  const progressive = 2 * Math.PI * dLambda * Math.sin(steer); // steering phase

  let re = 0, im = 0;
  for (let n = 0; n < N; n++) {
    const ang = n * (psi - progressive + delta);
    re += Math.cos(ang);
    im += Math.sin(ang);
  }
  return Math.sqrt(re * re + im * im) / N;
}

/**
 * build full 360-degree pattern — returns array of {angle, magnitude}
 * resolution: 1 degree steps (good enough for this tool)
 */
function buildPattern(params) {
  const { elements, spacing, steerAngle, phaseShift, amplitude } = params;
  const N = Math.round(elements);
  const d = spacing / 100; // convert % to lambda fraction (0.5lambda default)
  const amp = amplitude / 100;

  const pattern = [];
  for (let deg = -90; deg <= 90; deg += 0.5) {
    const mag = computeArrayFactor(deg, N, d, steerAngle, phaseShift) * amp;
    pattern.push({ angle: deg, magnitude: mag });
  }
  return pattern;
}

/**
 * estimate beamwidth (3dB width) around main lobe
 */
function estimateBeamwidth(params) {
  const { elements, spacing, steerAngle } = params;
  const N = Math.round(elements);
  const d = spacing / 100;

  // rough analytical estimate: beamwidth ≈ 0.886 * lambda / (N * d * cos(theta0))
  const theta0 = Math.abs(steerAngle * Math.PI / 180);
  const cosT = Math.cos(theta0);
  if (cosT < 0.01 || N < 2 || d < 0.01) return '—';
  const bw = (0.886 / (N * d * cosT)) * (180 / Math.PI);
  return Math.min(bw, 180).toFixed(1) + '°';
}

/**
 * check for grating lobes — happen when d > lambda/2
 * grating lobes appear when d > 1/(1 + |sin(theta0)|)
 */
function checkGratingLobes(params) {
  const { spacing, steerAngle } = params;
  const d = spacing / 100;
  const theta0 = steerAngle * Math.PI / 180;
  const threshold = 1 / (1 + Math.abs(Math.sin(theta0)));
  if (d > threshold) return 'present ⚠';
  return 'none';
}

/**
 * estimate first sidelobe level relative to main lobe (in dB)
 * for uniform array it's roughly -13.5 dB
 * gets better with more elements, worse with high phase shift
 */
function estimateSidelobeLevel(params) {
  const { elements } = params;
  const N = Math.round(elements);
  // uniform weighting sidelobe ~ -13.5 dB, improves slightly with more elements
  const base = -13.5;
  const correction = Math.log10(N) * 1.2;
  return (base - correction).toFixed(1) + ' dB';
}
