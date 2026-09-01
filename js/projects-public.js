// ============================================================
// PUBLIC PROJECTS RENDERER — read-only. Fetches from Firestore
// and renders cards into #project-grid. No write access, no
// link to the admin panel anywhere in this file or the page.
// ============================================================

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, getDocs, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CATEGORY_LABELS = {
  construction: 'General Construction',
  ict: 'ICT Training & Consultancy',
  property: 'Project & Property Mgmt'
};

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function cardHtml(p) {
  const catLabel = CATEGORY_LABELS[p.category] || p.category || '';
  const media = p.mediaType === 'video'
    ? `<video src="${p.mediaUrl}" muted loop playsinline autoplay></video>`
    : `<img src="${p.mediaUrl}" alt="${escapeHtml(p.title)}" loading="lazy">`;
  const locHtml = p.location
    ? `<div class="loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg> ${escapeHtml(p.location)}</div>`
    : '';
  return `
    <div class="project-card" data-category="${escapeHtml(p.category)}">
      <div class="project-thumb project-thumb-media">${media}</div>
      <div class="project-body">
        <div class="cat">${escapeHtml(catLabel)}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        ${locHtml}
      </div>
    </div>`;
}

async function renderProjects() {
  const grid = document.getElementById('project-grid');
  const emptyState = document.getElementById('projects-empty');
  const loadingState = document.getElementById('projects-loading');
  if (!grid) return;

  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    if (loadingState) loadingState.style.display = 'none';

    if (snap.empty) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    const html = [];
    snap.forEach((docSnap) => html.push(cardHtml(docSnap.data())));
    grid.innerHTML = html.join('');
  } catch (err) {
    if (loadingState) loadingState.textContent = 'Could not load projects right now — please refresh.';
  }
}

document.addEventListener('DOMContentLoaded', renderProjects);
