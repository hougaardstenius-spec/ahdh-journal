import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const HAPPINESS_THRESHOLD = 50

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

webpush.setVapidDetails(
  'mailto:hougaardstenius@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const { data: pets, error: petsError } = await supabase
  .from('pets')
  .select('user_id, name, happiness')
  .lt('happiness', HAPPINESS_THRESHOLD)

if (petsError) {
  console.error('Kunne ikke hente kæledyr:', petsError.message)
  process.exit(1)
}

if (!pets?.length) {
  console.log('Ingen kæledyr under lykke-tærsklen — ingen notifikationer at sende.')
  process.exit(0)
}

const petByUser = new Map(pets.map(p => [p.user_id, p]))

const { data: subs, error: subsError } = await supabase
  .from('push_subscriptions')
  .select('*')
  .in('user_id', pets.map(p => p.user_id))

if (subsError) {
  console.error('Kunne ikke hente push-abonnementer:', subsError.message)
  process.exit(1)
}

let sent = 0
let failed = 0

for (const sub of subs || []) {
  const pet = petByUser.get(sub.user_id)
  const payload = JSON.stringify({
    title: `🐾 ${pet.name} savner dig`,
    body: 'Log dagen eller send en tur, så har jeres dag det bedre.',
    url: 'https://hougaardstenius-spec.github.io/ahdh-journal/',
  })

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    )
    sent++
  } catch (err) {
    failed++
    if (err.statusCode === 404 || err.statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      console.log(`Fjernede udløbet abonnement ${sub.id}`)
    } else {
      console.error(`Kunne ikke sende til abonnement ${sub.id}:`, err.message)
    }
  }
}

console.log(`Sendt ${sent}/${(subs || []).length} notifikationer (${failed} fejlede).`)
