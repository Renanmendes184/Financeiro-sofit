/**
 * Sofit - Service Worker
 * Gerencia cache e funcionamento offline da PWA
 */

const CACHE_NAME = 'sofit-v1.0.0';
const STATIC_ASSETS = [
  '/index.html',
  '/style.css',
  '/js/app.js',
  '/js/db.js',
  '/js/ui.js',
  '/js/charts.js',
  '/js/export.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instala o service worker e faz cache dos assets estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto, armazenando assets...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Se algum asset falhar, continua sem bloquear
        console.warn('[SW] Alguns assets não puderam ser cacheados:', err);
      });
    })
  );
  // Força ativação imediata sem esperar tabs antigas fecharem
  self.skipWaiting();
});

// Ativa o service worker e limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Controla todas as tabs imediatamente
  self.clients.claim();
});

// Intercepta requisições: cache-first para estáticos, network-first para dados
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições externas e extensões
  if (!url.origin.includes(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna do cache e atualiza em background
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse;
      }

      // Não está no cache: busca na rede
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Offline e não cacheado: retorna página offline básica
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Sincronização em background quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Sincronizando dados...');
    // Placeholder para futura integração com Firebase/Supabase
  }
});

// Notificações push (preparado para uso futuro)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Atualização do Sofit',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: '/' }
  };
  event.waitUntil(
    self.registration.showNotification('Painel Sofit', options)
  );
});
