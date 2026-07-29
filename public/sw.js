/**
 * Service worker mínimo.
 *
 * Objetivo principal: permitir instalar o app na tela inicial (abre em tela
 * cheia, sem barra do navegador). O cache é conservador de propósito — os
 * dados vêm da rede/Supabase, então servir versão velha causaria mais
 * confusão do que ajuda.
 */

const CACHE = 'wf-lava-car-v1'
const ESSENCIAIS = ['/', '/icone.svg', '/manifest.webmanifest']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ESSENCIAIS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento

  if (request.method !== 'GET') return

  // Navegação: tenta a rede e cai no cache quando estiver offline
  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request).catch(() => caches.match('/').then((r) => r ?? Response.error()))
    )
    return
  }

  // Assets com hash no nome: cache primeiro, já que nunca mudam de conteúdo
  const url = new URL(request.url)
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    evento.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ??
          fetch(request).then((resposta) => {
            const copia = resposta.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copia))
            return resposta
          })
      )
    )
  }
})
