const CACHE = 'millahabel-v1'; // <-- Naikkan versinya di sini jika Anda update file (v2, v3, dst)
const ASSETS = [
  '/', 
  '/index.html', 
  '/styles.css', 
  '/app.js', 
  '/manifest.json',
  '/icons/icon-millahabel-192.png', 
  '/icons/icon-millahabel-512.png'
];

// 1. Proses Install: Menyimpan asset baru ke dalam cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

// 2. Proses Aktivasi: MENGHAPUS cache versi lama secara otomatis
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Jika nama cache di browser tidak sama dengan versi CACHE aktif saat ini, hapus!
          if (cacheName !== CACHE) {
            console.log('Menghapus cache usang:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Proses Fetch: Mengambil data dari cache dulu, jika tidak ada baru ambil dari internet
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
