// ============================================================
// MALEEKTECH PROJECT MANAGER — private project media manager
// Not linked from the public site. Protected by Supabase Auth
// (login) + Row Level Security (only auth'd users can write).
// ============================================================

import { supabaseConfig } from './supabase-config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
const BUCKET = supabaseConfig.bucket;
const TABLE = 'projects';

// ---------- DOM refs ----------
const loginView = document.getElementById('login-view');
const dashView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const uploadForm = document.getElementById('upload-form');
const uploadBtn = document.getElementById('upload-btn');
const progressWrap = document.getElementById('progress-wrap');
const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const uploadMsg = document.getElementById('upload-msg');
const listEl = document.getElementById('admin-project-list');
const listEmpty = document.getElementById('admin-list-empty');
const userEmailEl = document.getElementById('user-email');

// Holds the last-fetched list in display order, so Up/Down buttons
// can find neighbors without an extra round-trip.
let currentProjects = [];

// ---------- auth state ----------
function showDashboard(session) {
  loginView.style.display = 'none';
  dashView.style.display = 'block';
  userEmailEl.textContent = session.user.email;
  loadProjects();
}
function showLogin() {
  loginView.style.display = 'block';
  dashView.style.display = 'none';
}

supabase.auth.getSession().then(({ data }) => {
  if (data.session) showDashboard(data.session); else showLogin();
});
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) showDashboard(session); else showLogin();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) loginError.textContent = 'Login failed — check your email and password.';
});

logoutBtn.addEventListener('click', () => supabase.auth.signOut());

// ---------- image compression ----------
// Resizes to a max dimension and re-encodes as JPEG before upload.
// Videos and GIFs (to preserve animation) pass through untouched.
// Falls back to the original file if compression doesn't help or fails.
async function compressImage(file, maxDim = 1920, quality = 0.85) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // original was already smaller/better

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file; // any failure — just upload the original
  }
}

// ---------- upload (via direct XHR to Supabase Storage's REST
// endpoint, so we get real upload-progress events — the JS
// client library doesn't expose progress for browser uploads) ----------
function uploadFileWithProgress(path, file, accessToken, onProgress) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseConfig.url}/storage/v1/object/${BUCKET}/${encodeURIComponent(path)}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', supabaseConfig.anonKey);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(file);
  });
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('f-title').value.trim();
  const description = document.getElementById('f-description').value.trim();
  const category = document.getElementById('f-category').value;
  const location = document.getElementById('f-location').value.trim();
  const featured = document.getElementById('f-featured').checked;
  const fileInput = document.getElementById('f-file');
  let file = fileInput.files[0];

  uploadMsg.textContent = '';
  if (!file) {
    uploadMsg.textContent = 'Please choose an image or video file.';
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    uploadMsg.textContent = 'Your session expired — please sign in again.';
    return;
  }

  const mediaType = file.type.startsWith('video') ? 'video' : 'image';

  uploadBtn.disabled = true;
  progressWrap.style.display = 'block';
  progressBar.style.width = '0%';
  progressLabel.textContent = 'Preparing…';

  try {
    if (mediaType === 'image') {
      file = await compressImage(file);
    }

    const storagePath = `${crypto.randomUUID()}/${file.name}`;
    progressLabel.textContent = 'Uploading… 0%';

    await uploadFileWithProgress(storagePath, file, accessToken, (pct) => {
      progressBar.style.width = pct + '%';
      progressLabel.textContent = `Uploading… ${pct}%`;
    });

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const mediaUrl = pub.publicUrl;

    const { error: insertError } = await supabase.from(TABLE).insert({
      title, description, category, location, featured,
      media_type: mediaType, media_url: mediaUrl, storage_path: storagePath,
      sort_order: Date.now()
    });
    if (insertError) throw insertError;

    uploadForm.reset();
    progressWrap.style.display = 'none';
    uploadBtn.disabled = false;
    uploadMsg.textContent = 'Uploaded successfully.';
    uploadMsg.style.color = 'var(--green)';
    loadProjects();
    setTimeout(() => { uploadMsg.textContent = ''; }, 4000);
  } catch (err) {
    uploadMsg.textContent = 'Upload failed: ' + err.message;
    uploadMsg.style.color = '#C0392B';
    uploadBtn.disabled = false;
    progressWrap.style.display = 'none';
  }
});

// ---------- list, reorder, feature, delete ----------
async function loadProjects() {
  listEl.innerHTML = '<p class="admin-loading">Loading…</p>';
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: false });

  if (error) {
    listEl.innerHTML = `<p class="admin-loading">Could not load projects: ${escapeHtml(error.message)}</p>`;
    return;
  }
  currentProjects = data || [];

  if (currentProjects.length === 0) {
    listEl.innerHTML = '';
    listEmpty.style.display = 'block';
    return;
  }
  listEmpty.style.display = 'none';
  listEl.innerHTML = '';

  currentProjects.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    const mediaTag = p.media_type === 'video'
      ? `<video src="${p.media_url}" muted></video>`
      : `<img src="${p.media_url}" alt="${escapeHtml(p.title || '')}">`;
    row.innerHTML = `
      <div class="admin-row-thumb">${mediaTag}</div>
      <div class="admin-row-body">
        <h4>${escapeHtml(p.title || '(untitled)')} ${p.featured ? '<span class="admin-featured-pill">Featured</span>' : ''}</h4>
        <span class="admin-row-cat">${escapeHtml(p.category || '')}</span>
        <p>${escapeHtml(p.description || '')}</p>
      </div>
      <div class="admin-row-actions">
        <button class="admin-icon-btn" type="button" data-action="up" title="Move up" ${idx === 0 ? 'disabled' : ''}>&#8593;</button>
        <button class="admin-icon-btn" type="button" data-action="down" title="Move down" ${idx === currentProjects.length - 1 ? 'disabled' : ''}>&#8595;</button>
        <button class="admin-icon-btn" type="button" data-action="feature" title="${p.featured ? 'Unfeature' : 'Feature'}">${p.featured ? '★' : '☆'}</button>
        <button class="admin-row-delete" type="button" data-action="delete">Delete</button>
      </div>
    `;
    row.querySelector('[data-action="up"]').addEventListener('click', () => moveProject(idx, -1));
    row.querySelector('[data-action="down"]').addEventListener('click', () => moveProject(idx, 1));
    row.querySelector('[data-action="feature"]').addEventListener('click', () => toggleFeatured(p));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProject(p.id, p.storage_path));
    listEl.appendChild(row);
  });
}

async function moveProject(idx, direction) {
  const otherIdx = idx + direction;
  if (otherIdx < 0 || otherIdx >= currentProjects.length) return;
  const a = currentProjects[idx];
  const b = currentProjects[otherIdx];

  // Swapping sort_order (and featured, so the item visibly follows
  // where it was moved even across the featured/unfeatured boundary).
  const updates = [
    supabase.from(TABLE).update({ sort_order: b.sort_order, featured: b.featured }).eq('id', a.id),
    supabase.from(TABLE).update({ sort_order: a.sort_order, featured: a.featured }).eq('id', b.id)
  ];
  await Promise.all(updates);
  loadProjects();
}

async function toggleFeatured(p) {
  const { error } = await supabase.from(TABLE).update({ featured: !p.featured }).eq('id', p.id);
  if (error) { alert('Could not update: ' + error.message); return; }
  loadProjects();
}

async function deleteProject(id, storagePath) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  try {
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    loadProjects();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
