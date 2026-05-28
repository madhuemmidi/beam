// paws.js
// the cat paw easter egg — took longer than i'd like to admit
// draws little svg paw prints walking across the footer

const PAW = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
  <!-- main pad -->
  <ellipse cx="12" cy="15" rx="5" ry="4" fill="currentColor" opacity="0.55"/>
  <!-- toe beans -->
  <ellipse cx="6.5" cy="9.5" rx="2.2" ry="2.8" fill="currentColor" opacity="0.45" transform="rotate(-15 6.5 9.5)"/>
  <ellipse cx="10.8" cy="7.5" rx="2" ry="2.6" fill="currentColor" opacity="0.45"/>
  <ellipse cx="15.2" cy="7.5" rx="2" ry="2.6" fill="currentColor" opacity="0.45"/>
  <ellipse cx="19" cy="10" rx="2" ry="2.6" fill="currentColor" opacity="0.45" transform="rotate(15 19 10)"/>
</svg>`;

function spawnPaws() {
  const container = document.getElementById('pawPrints');
  if (!container) return;

  container.innerHTML = '';

  // alternate left/right paw placement like a walking cat
  const count = 8;
  for (let i = 0; i < count; i++) {
    const paw = document.createElement('span');
    paw.innerHTML = PAW;
    paw.style.cssText = `
      display: inline-block;
      color: var(--ink3);
      opacity: 0;
      transform: scale(0.7) rotate(${i % 2 === 0 ? '-8' : '8'}deg) translateY(${i % 2 === 0 ? '2' : '-2'}px);
      animation: pawAppear 0.4s ease forwards;
      animation-delay: ${i * 0.12}s;
    `;
    container.appendChild(paw);
  }
}

// inject keyframes if not already there
if (!document.getElementById('pawStyles')) {
  const style = document.createElement('style');
  style.id = 'pawStyles';
  style.textContent = `
    @keyframes pawAppear {
      0%   { opacity: 0; transform: scale(0.3) translateY(8px); }
      60%  { opacity: 0.5; transform: scale(1.1) translateY(-1px); }
      100% { opacity: 0.35; transform: scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// trigger on scroll near footer
const footer = document.querySelector('.footer');
if (footer) {
  let triggered = false;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;
      spawnPaws();
    }
  }, { threshold: 0.5 });
  observer.observe(footer);
}
