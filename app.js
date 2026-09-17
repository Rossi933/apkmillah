const WORKER_URL = 'https://apkmillah.khoirulrosikin4.workers.dev';
let currentUser = null;

// ============ AUTH ============
function handleCredentialResponse(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  currentUser = { email: payload.email, name: payload.name, picture: payload.picture };
  localStorage.setItem('user', JSON.stringify(currentUser));
  initApp();
}

function checkLogin() {
  const saved = localStorage.getItem('user');
  if (saved) {
    currentUser = JSON.parse(saved);
    initApp();
  }
}

function logout() {
  localStorage.removeItem('user');
  currentUser = null;
  showScreen('loginScreen');
}

// ============ NAV ============
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ============ API ============
async function api(action, extra = {}) {
  const params = new URLSearchParams({ action, ...extra });
  const res = await fetch(`${WORKER_URL}/api?${params}`);
  return res.json();
}

async function loadDashboard() {
  const r = await api('getDashboard');
  const el = document.getElementById('dashboardList');
  if (!r.ok) { el.innerHTML = '<p>Gagal memuat</p>'; return; }
  el.innerHTML = r.data.map(d => `
    <div class="item">
      <h3>${escapeHtml(d.judul)}</h3>
      <p>${escapeHtml(d.isi)}</p>
      ${d.gambar ? `<img src="${d.gambar}">` : ''}
      <small>${new Date(d.tanggal).toLocaleString('id-ID')}</small>
    </div>
  `).join('') || '<p>Belum ada data.</p>';
}

async function loadHistory() {
  const r = await api('getHistory');
  const el = document.getElementById('historyList');
  if (!r.ok) { el.innerHTML = '<p>Gagal memuat</p>'; return; }
  el.innerHTML = r.data.map(h => `
    <div class="item">
      <strong>${h.aksi}</strong> — ${escapeHtml(h.judul)}
      <br><small>${new Date(h.waktu).toLocaleString('id-ID')}</small>
    </div>
  `).join('') || '<p>Belum ada history.</p>';
}

async function simpanData() {
  const judul = document.getElementById('inpJudul').value.trim();
  const isi = document.getElementById('inpIsi').value.trim();
  const file = document.getElementById('inpGambar').files[0];
  if (!judul) return alert('Judul wajib diisi');

  let gambarUrl = '';
  if (file) {
    gambarUrl = await uploadKeImgBB(file); // butuh API key imgBB
  }

  const r = await api('addData', { judul, isi, gambar: gambarUrl, email: currentUser.email });
  if (r.ok) {
    document.getElementById('inpJudul').value = '';
    document.getElementById('inpIsi').value = '';
    document.getElementById('inpGambar').value = '';
    showScreen('dashboardScreen');
    loadDashboard();
  } else {
    alert('Gagal: ' + r.error);
  }
}

// Upload gambar ke imgBB (gratis, dapat API key di imgbb.com)
async function uploadKeImgBB(file) {
  const API_KEY = '22bfbb9cb3942eeb5f3bd4f79375a41f';
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, { method: 'POST', body: fd });
  const j = await res.json();
  return j.data?.url || '';
}

// Background
function gantiBackground() {
  document.getElementById('inpBackground').click();
}

async function simpanBackground(file) {
  const reader = new FileReader();
  reader.onload = async e => {
    const dataUrl = e.target.result;
    localStorage.setItem('bg_' + currentUser.email, dataUrl);
    document.body.style.backgroundImage = `url(${dataUrl})`;
    // simpan juga ke sheet
    await api('setBackground', { email: currentUser.email, url: dataUrl.substring(0, 5000) });
  };
  reader.readAsDataURL(file);
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ============ INIT ============
function initApp() {
  showScreen('dashboardScreen');
  loadDashboard();
  const bg = localStorage.getItem('bg_' + currentUser.email);
  if (bg) document.body.style.backgroundImage = `url(${bg})`;
}

// Memperbaiki pembacaan event DOMContentLoaded yang sempat rusak
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  document.getElementById('btnHistory').onclick = () => { showScreen('historyScreen'); loadHistory(); };
  document.getElementById('btnBg').onclick = gantiBackground;
  document.getElementById('btnLogout').onclick = logout;
  document.getElementById('btnAdd').onclick = () => showScreen('formScreen');
  document.getElementById('btnSimpan').onclick = simpanData;
  document.getElementById('inpBackground').onchange = e => e.target.files[0] && simpanBackground(e.target.files[0]);
});

// Mendaftarkan Service Worker dari folder assets
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('assets/sw.js');
}
