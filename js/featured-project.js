// ============================================================
// RIKENI / SOKOTO PROJECT GALLERY — click the project card to
// open a full-screen lightbox of all 19 site photos, with
// next/prev navigation and keyboard support.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('rikeni-gallery-trigger');
  const lightbox = document.getElementById('fp-lightbox');
  if (!trigger || !lightbox) return;

  const TOTAL = 19;
  const images = Array.from({ length: TOTAL }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return `assets/projects/rikeni-sokoto/full/photo-${n}.jpg`;
  });

  const lbImg = document.getElementById('fp-lb-img');
  const lbCounter = document.getElementById('fp-lb-counter');
  const closeBtn = document.getElementById('fp-lb-close');
  const prevBtn = document.getElementById('fp-lb-prev');
  const nextBtn = document.getElementById('fp-lb-next');

  let current = 0;

  function show(index) {
    current = (index + images.length) % images.length;
    lbImg.src = images[current];
    lbCounter.textContent = `${current + 1} / ${images.length}`;
  }

  function open() {
    show(0);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
});
