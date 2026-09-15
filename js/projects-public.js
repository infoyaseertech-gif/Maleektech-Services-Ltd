// ============================================================
// PUBLIC PROJECTS RENDERER — read-only. Fetches from Supabase
// and renders cards into #project-grid. No write access, no
// link to the admin panel anywhere in this file or the page.
// ============================================================

import { supabaseConfig } from './supabase-config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

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
  const media = p.media_type === 'video'
    ? `<video src="${p.media_url}" muted loop playsinline autoplay></video>`
    : `<img src="${p.media_url}" alt="${escapeHtml(p.title)}" loading="lazy">`;
  const locHtml = p.location
    ? `<div class="loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg> ${escapeHtml(p.location)}</div>`
    : '';
  const featuredBadge = p.featured ? '<span class="featured-badge">Featured</span>' : '';
  return `
    <div class="project-card" data-category="${escapeHtml(p.category)}">
      <div class="project-thumb project-thumb-media">${featuredBadge}${media}</div>
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

  // The grid already contains hand-authored project cards in the HTML.
  // Anything fetched here is APPENDED so those are never wiped out.
  const hasStaticCards = grid.querySelectorAll('.project-card').length > 0;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: false });

  if (loadingState) loadingState.style.display = 'none';

  if (error) {
    // Static cards are still on screen, so fail quietly rather than
    // implying the whole page is broken.
    if (!hasStaticCards && loadingState) {
      loadingState.style.display = 'block';
      loadingState.textContent = 'Could not load projects right now — please refresh.';
    }
    return;
  }

  if (!data || data.length === 0) {
    if (!hasStaticCards && emptyState) emptyState.style.display = 'block';
    return;
  }

  grid.insertAdjacentHTML('beforeend', data.map(cardHtml).join(''));
}

document.addEventListener('DOMContentLoaded', renderProjects);
