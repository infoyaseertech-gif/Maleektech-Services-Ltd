// ============================================================
// MALEEKTECH SERVICES LTD — shared site behavior
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const panel = document.querySelector('.mobile-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- scroll reveal (progressive enhancement) ----------
     Content is visible by default (see CSS). Only once we've confirmed
     IntersectionObserver works do we "arm" the hidden/animate-in state,
     so nothing ever depends on JS to become visible. */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    document.body.classList.add('reveal-armed');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- services page: drawing-sheet tabs ---------- */
  const sheetButtons = document.querySelectorAll('.sheet-nav button');
  const sheetPanels = document.querySelectorAll('.sheet-panel');
  if (sheetButtons.length) {
    sheetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        sheetButtons.forEach(b => b.classList.remove('active'));
        sheetPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
        history.replaceState(null, '', '#' + target);
      });
    });
    // open tab from URL hash on load
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const match = document.querySelector('.sheet-nav button[data-target="' + hash + '"]');
      if (match) match.click();
    }
  }

  /* ---------- projects page: category filter ---------- */
  const filterButtons = document.querySelectorAll('.filter-row button');
  const projectCards = document.querySelectorAll('.project-card');
  if (filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-filter');
        projectCards.forEach(card => {
          const show = cat === 'all' || card.getAttribute('data-category') === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------- contact form (front-end only — wire to backend/email service) ---------- */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        form.reset();
        btn.textContent = 'Message sent';
        setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2200);
      }, 900);
      // NOTE: connect this to a real endpoint (e.g. Formspree, EmailJS,
      // or a Firebase Function) so enquiries actually reach the team.
    });
  }

});
