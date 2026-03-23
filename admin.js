const API = window.location.origin;
const THEME_KEY = 'adminTheme';
let token = localStorage.getItem('adminToken');
let currentProjectImages = [];

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}
function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.body.classList.toggle('theme-light', theme === 'light');
  const isDark = theme === 'dark';
  const loginToggle = document.getElementById('themeToggleLogin');
  const adminToggle = document.getElementById('themeToggleAdmin');
  if (loginToggle) loginToggle.checked = isDark;
  if (adminToggle) adminToggle.checked = isDark;
}
function initTheme() {
  setTheme(getTheme());
  document.getElementById('themeToggleLogin')?.addEventListener('change', () => setTheme(document.getElementById('themeToggleLogin').checked ? 'dark' : 'light'));
  document.getElementById('themeToggleAdmin')?.addEventListener('change', () => setTheme(document.getElementById('themeToggleAdmin').checked ? 'dark' : 'light'));
}
setTheme(getTheme());

function getAuthHeaders() {
  return { Authorization: 'Bearer ' + token };
}

function showScreen(id) {
  document.getElementById('loginScreen').classList.toggle('hidden', id !== 'login');
  document.getElementById('adminPanel').classList.toggle('hidden', id !== 'admin');
}

function showTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelector('.tab-btn[data-tab="' + tabId + '"]').classList.add('active');
  if (tabId === 'projects') loadProjects();
  if (tabId === 'settings') loadSettings();
  if (tabId === 'submissions') loadSubmissions();
}
document.addEventListener('DOMContentLoaded', () => initTheme());

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pass = document.getElementById('passwordInput').value;
  try {
    const r = await fetch(API + '/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass }),
    });
    const data = await r.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('adminToken', token);
      showScreen('admin');
      showTab('projects');
      document.getElementById('passwordInput').value = '';
      document.getElementById('loginError').textContent = '';
    } else {
      document.getElementById('loginError').textContent = 'Invalid password';
    }
  } catch {
    document.getElementById('loginError').textContent = 'Connection error';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  token = null;
  localStorage.removeItem('adminToken');
  showScreen('login');
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

async function loadProjects() {
  const list = document.getElementById('projectsList');
  try {
    const r = await fetch(API + '/api/projects/full', { headers: getAuthHeaders() });
    const projects = await r.json();
    if (!projects.length) {
      list.innerHTML = '<p class="empty-state">No projects yet. Click "Add Project" to create one.</p>';
      return;
    }
    list.innerHTML = projects
      .map(
        (p) => `
      <div class="project-card" data-id="${p._id}">
        <img src="${p.coverImage.startsWith('/') ? API + p.coverImage : p.coverImage}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2290%22><rect fill=%22%23ddd%22 width=%22120%22 height=%2290%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No image</text></svg>'">
        <div class="project-card-info">
          <h4>${escapeHtml(p.title)}</h4>
          <p>${escapeHtml((p.description || '').slice(0, 100))}${(p.description || '').length > 100 ? '...' : ''}</p>
          <div class="project-card-actions">
            <button class="btn btn-secondary edit-project-btn">Edit</button>
            <button class="btn btn-danger delete-project-btn">Delete</button>
          </div>
        </div>
      </div>
    `
      )
      .join('');
    list.querySelectorAll('.edit-project-btn').forEach((b) => {
      b.addEventListener('click', () => openProjectModal(b.closest('.project-card').dataset.id));
    });
    list.querySelectorAll('.delete-project-btn').forEach((b) => {
      b.addEventListener('click', () => deleteProject(b.closest('.project-card').dataset.id));
    });
  } catch {
    list.innerHTML = '<p class="empty-state">Failed to load projects.</p>';
  }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

document.getElementById('addProjectBtn').addEventListener('click', () => openProjectModal(null));

function openProjectModal(id) {
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
  const titleEl = document.getElementById('projectModalTitle');
  form.reset();
  document.getElementById('projectId').value = id || '';
  currentProjectImages = [];
  renderProjectImagesList();
  if (id) {
    titleEl.textContent = 'Edit Project';
    fetch(API + '/api/projects/full', { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((projects) => {
        const p = projects.find((x) => x._id === id);
        if (p) {
          document.getElementById('projectTitle').value = p.title;
          document.getElementById('projectDescription').value = p.description || '';
          document.getElementById('projectCover').value = p.coverImage || '';
          currentProjectImages = [...(p.images || [])];
          renderProjectImagesList();
        }
      });
  } else {
    titleEl.textContent = 'Add Project';
  }
  modal.classList.remove('hidden');
}

document.getElementById('closeProjectModal').addEventListener('click', () => {
  document.getElementById('projectModal').classList.add('hidden');
});
document.getElementById('cancelProjectBtn').addEventListener('click', () => {
  document.getElementById('projectModal').classList.add('hidden');
});

document.getElementById('coverUpload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('images', file);
  try {
    const r = await fetch(API + '/api/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (r.ok) {
      const d = await r.json();
      const url = (d.urls && d.urls[0]) ? d.urls[0] : '';
      if (url) document.getElementById('projectCover').value = url;
    } else {
      alert('Cover image upload failed');
    }
  } catch {
    alert('Cover image upload failed');
  }
  e.target.value = '';
});

document.getElementById('addImageUrlBtn').addEventListener('click', () => {
  const url = document.getElementById('newImageUrl').value.trim();
  if (url) {
    currentProjectImages.push(url);
    document.getElementById('newImageUrl').value = '';
    renderProjectImagesList();
  }
});

document.getElementById('imageUpload').addEventListener('change', async (e) => {
  const files = e.target.files;
  if (!files.length) return;
  const projectId = document.getElementById('projectId').value;
  const formData = new FormData();
  for (const f of files) formData.append('images', f);
  try {
    if (projectId) {
      const r = await fetch(API + '/api/projects/' + projectId + '/images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (r.ok) {
        const p = await r.json();
        currentProjectImages = p.images || [];
        renderProjectImagesList();
      }
    } else {
      const r = await fetch(API + '/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (r.ok) {
        const d = await r.json();
        currentProjectImages.push(...(d.urls || []));
        renderProjectImagesList();
      }
    }
  } catch (err) {
    alert('Upload failed');
  }
  e.target.value = '';
});

function renderProjectImagesList() {
  const ul = document.getElementById('projectImagesList');
  ul.innerHTML = currentProjectImages
    .map(
      (url, i) => `
    <li>
      <img src="${url.startsWith('/') ? API + url : url}" alt="" onerror="this.style.background='#ddd'">
      <span>${escapeHtml(url)}</span>
      <button type="button" class="remove-img-btn" data-i="${i}">Remove</button>
    </li>
  `
    )
    .join('');
  ul.querySelectorAll('.remove-img-btn').forEach((b) => {
    b.addEventListener('click', () => {
      currentProjectImages.splice(parseInt(b.dataset.i, 10), 1);
      renderProjectImagesList();
    });
  });
}

document.getElementById('projectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('projectId').value;
  const payload = {
    title: document.getElementById('projectTitle').value.trim(),
    description: document.getElementById('projectDescription').value.trim(),
    coverImage: document.getElementById('projectCover').value.trim(),
    images: currentProjectImages,
  };
  if (!payload.coverImage) {
    alert('Cover image URL is required');
    return;
  }
  try {
    const url = id ? API + '/api/projects/' + id : API + '/api/projects';
    const r = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      document.getElementById('projectModal').classList.add('hidden');
      loadProjects();
    } else {
      const d = await r.json();
      alert(d.error || 'Failed to save');
    }
  } catch {
    alert('Connection error');
  }
});

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    const r = await fetch(API + '/api/projects/' + id, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (r.ok) loadProjects();
  } catch {
    alert('Failed to delete');
  }
}

async function loadSettings() {
  try {
    const r = await fetch(API + '/api/settings', { headers: getAuthHeaders() });
    const s = await r.json();
    document.getElementById('viewMoreEnabled').checked = s.enabled !== false;
  } catch {}
}

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  const enabled = document.getElementById('viewMoreEnabled').checked;
  try {
    await fetch(API + '/api/settings', {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, limit: 6 }),
    });
    alert('Settings saved');
  } catch {
    alert('Failed to save');
  }
});

async function loadSubmissions() {
  const tbody = document.querySelector('#submissionsTable tbody');
  const loadingEl = document.getElementById('submissionsLoading');
  const tableEl = document.getElementById('submissionsTable');
  if (loadingEl) {
    loadingEl.classList.remove('hidden');
    loadingEl.textContent = 'Loading submissions…';
  }
  if (tableEl) tableEl.style.visibility = 'hidden';
  tbody.innerHTML = '';
  try {
    const r = await fetch(API + '/api/submissions', { headers: getAuthHeaders() });
    const rows = await r.json();
    if (loadingEl) loadingEl.classList.add('hidden');
    if (tableEl) tableEl.style.visibility = '';
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No submissions yet.</td></tr>';
      return;
    }
    const cols = ['Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Message'];
    tbody.innerHTML = rows
      .map(
        (row) =>
          '<tr>' +
          cols.map((c) => '<td>' + escapeHtml(String(row[c] || '')) + '</td>').join('') +
          '</tr>'
      )
      .join('');
  } catch {
    if (loadingEl) {
      loadingEl.classList.add('hidden');
      loadingEl.textContent = '';
    }
    if (tableEl) tableEl.style.visibility = '';
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load. Configure GOOGLE_SCRIPT_URL and GOOGLE_SHEET_EXPORT_KEY in .env.</td></tr>';
  }
}

function downloadWithAuth(path, filename) {
  fetch(API + path, { headers: getAuthHeaders() })
    .then((r) => {
      if (!r.ok) return r.text().then((t) => Promise.reject(t));
      return r.blob();
    })
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert('Download failed: ' + err));
}

document.getElementById('downloadCsvBtn').addEventListener('click', (e) => {
  e.preventDefault();
  downloadWithAuth('/api/submissions/csv', 'submissions.csv');
});

document.getElementById('downloadXlsxBtn').addEventListener('click', (e) => {
  e.preventDefault();
  downloadWithAuth('/api/submissions/xlsx', 'submissions.xlsx');
});

if (token) {
  fetch(API + '/api/projects/full', { headers: getAuthHeaders() })
    .then((r) => {
      if (r.ok) showScreen('admin');
      else showScreen('login');
    })
    .catch(() => showScreen('login'));
} else {
  showScreen('login');
}
