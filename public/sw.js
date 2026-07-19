self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: '🐾 Dit kæledyr savner dig', body: 'Kom forbi og log dagen.', url: '/ahdh-journal/' }
  if (event.data) {
    try { payload = { ...payload, ...event.data.json() } } catch { /* brug default */ }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/ahdh-journal/icon-192.png',
      badge: '/ahdh-journal/icon-192.png',
      data: { url: payload.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/ahdh-journal/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/ahdh-journal/') && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
