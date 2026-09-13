// ============================================================
// FEATURED PROJECT GALLERY — simple click-to-enlarge lightbox
// with next/prev navigation and keyboard support.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const thumbs = document.querySelectorAll('.fp-thumb');
  const lightbox = document.getElementById('fp-lightbox');
  if (!thumbs.length || !lightbox) return;

  const lbImg = document.getElementById('fp-lb-img');
  const lbCounter = document.getElementById('fp-lb-counter');
  const closeBtn = document.getElementById('fp-lb-close');
  const prevBtn = document.getElementById('fp-lb-prev');
  const nextBtn = document.getElementById('fp-lb-next');

  const images = Array.from(thumbs).map(t => t.getAttribute('data-full'));
  let current = 0;

  function show(index) {
    current = (index + images.length) % images.length;
    lbImg.src = images[current];
    lbCounter.textContent = `${current + 1} / ${images.length}`;
  }

  function open(index) {
    show(index);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  thumbs.forEach((t, i) => t.addEventListener('click', () => open(i)));
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
