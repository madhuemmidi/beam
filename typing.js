// typing.js
// simple typewriter — cycles through rf-related phrases


const phrases = [
  'debugging phased arrays',
  'obsessing over THz',
  'learning beamforming',
  'characterizing antennas',
  'studying mmWave ICs',
  'reading IEEE papers at 2am',
];

const el = document.getElementById('typingText');
if (el) {
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let pauseCounter = 0;

  function tick() {
    const phrase = phrases[phraseIdx];

    if (!deleting) {
      charIdx++;
      el.textContent = phrase.slice(0, charIdx);
      if (charIdx === phrase.length) {
        // pause at end before deleting
        deleting = true;
        pauseCounter = 28;
        setTimeout(tick, 1600);
        return;
      }
    } else {
      if (pauseCounter > 0) {
        pauseCounter--;
        setTimeout(tick, 50);
        return;
      }
      charIdx--;
      el.textContent = phrase.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
    }

    const speed = deleting ? 35 : 65;
    setTimeout(tick, speed);
  }

  setTimeout(tick, 800);
}
