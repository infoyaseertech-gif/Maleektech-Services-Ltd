// ============================================================
// MALEEKTECH ADMIN — private project media manager
// Not linked from the public site. Protected by Firebase Auth.
// ============================================================

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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

// ---------- auth state ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.style.display = 'none';
    dashView.style.display = 'block';
    userEmailEl.textContent = user.email;
    loadProjects();
  } else {
    loginView.style.display = 'block';
    dashView.style.display = 'none';
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = 'Login failed — check your email and password.';
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// ---------- upload ----------
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('f-title').value.trim();
  const description = document.getElementById('f-description').value.trim();
  const category = document.getElementById('f-category').value;
  const location = document.getElementById('f-location').value.trim();
  const fileInput = document.getElementById('f-file');
  const file = fileInput.files[0];

  uploadMsg.textContent = '';
  if (!file) {
    uploadMsg.textContent = 'Please choose an image or video file.';
    return;
  }

  const mediaType = file.type.startsWith('video') ? 'video' : 'image';
  const newDocRef = doc(collection(db, 'projects'));
  const storagePath = `projects/${newDocRef.id}/${file.name}`;
  const storageRef = ref(storage, storagePath);

  uploadBtn.disabled = true;
  progressWrap.style.display = 'block';
  progressBar.style.width = '0%';
  progressLabel.textContent = 'Uploading… 0%';

  const task = uploadBytesResumable(storageRef, file);
  task.on('state_changed',
    (snap) => {
      const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      progressBar.style.width = pct + '%';
      progressLabel.textContent = `Uploading… ${pct}%`;
    },
    (err) => {
      uploadMsg.textContent = 'Upload failed: ' + err.message;
      uploadBtn.disabled = false;
      progressWrap.style.display = 'none';
    },
    async () => {
      const mediaUrl = await getDownloadURL(storageRef);
      await setDoc(newDocRef, {
        title, description, category, location, mediaType, mediaUrl, storagePath,
        createdAt: serverTimestamp()
      });
      uploadForm.reset();
      progressWrap.style.display = 'none';
      uploadBtn.disabled = false;
      uploadMsg.textContent = 'Uploaded successfully.';
      uploadMsg.style.color = 'var(--green)';
      loadProjects();
      setTimeout(() => { uploadMsg.textContent = ''; }, 4000);
    }
  );
});

// ---------- list + delete ----------
async function loadProjects() {
  listEl.innerHTML = '<p class="admin-loading">Loading…</p>';
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  if (snap.empty) {
    listEl.innerHTML = '';
    listEmpty.style.display = 'block';
    return;
  }
  listEmpty.style.display = 'none';
  listEl.innerHTML = '';

  snap.forEach((docSnap) => {
    const p = docSnap.data();
    const row = document.createElement('div');
    row.className = 'admin-row';
    const mediaTag = p.mediaType === 'video'
      ? `<video src="${p.mediaUrl}" muted></video>`
      : `<img src="${p.mediaUrl}" alt="${p.title || ''}">`;
    row.innerHTML = `
      <div class="admin-row-thumb">${mediaTag}</div>
      <div class="admin-row-body">
        <h4>${escapeHtml(p.title || '(untitled)')}</h4>
        <span class="admin-row-cat">${escapeHtml(p.category || '')}</span>
        <p>${escapeHtml(p.description || '')}</p>
      </div>
      <button class="admin-row-delete" type="button">Delete</button>
    `;
    row.querySelector('.admin-row-delete').addEventListener('click', () => deleteProject(docSnap.id, p.storagePath));
    listEl.appendChild(row);
  });
}

async function deleteProject(id, storagePath) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  try {
    if (storagePath) {
      await deleteObject(ref(storage, storagePath)).catch(() => {});
    }
    await deleteDoc(doc(db, 'projects', id));
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
