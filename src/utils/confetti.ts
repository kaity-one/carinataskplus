import confetti from 'canvas-confetti';

export function fireConfetti(origin?: { x: number; y: number }) {
  try {
    confetti({
      particleCount: 55,
      spread: 70,
      origin: origin || { y: 0.7 },
      colors: ['#10b981', '#f97316', '#6366f1', '#ec4899', '#3b82f6'],
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.debug('Confetti error:', err);
  }
}

export function fireSuperConfetti() {
  try {
    const end = Date.now() + 800;
    const colors = ['#10b981', '#f59e0b', '#6366f1', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (err) {
    console.debug('Confetti error:', err);
  }
}
