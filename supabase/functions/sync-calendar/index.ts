// Ultra-Flow — Supabase Edge Function
// Ontvangt POST van PowerShell script met Outlook events
// Endpoint: /functions/v1/sync-calendar
//
// Deploy: supabase functions deploy sync-calendar

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OutlookEvent {
  outlook_id: string
  title:      string
  start_time: string  // ISO 8601
  end_time:   string
  location?:  string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let events: OutlookEvent[]
  try {
    events = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!Array.isArray(events) || events.length === 0) {
    return new Response(JSON.stringify({ synced: 0, deleted: 0 }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Upsert events op outlook_id
  const { error: upsertError } = await supabase
    .from('calendar_events')
    .upsert(
      events.map(e => ({
        outlook_id:  e.outlook_id,
        title:       e.title,
        start_time:  e.start_time,
        end_time:    e.end_time,
        location:    e.location ?? null,
        is_timeblock: false,
      })),
      { onConflict: 'outlook_id' }
    )

  if (upsertError) {
    console.error('Upsert error:', upsertError)
    return new Response(JSON.stringify({ error: upsertError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Verwijder oude Outlook events die niet meer in de payload zitten
  // (events van gisteren of eerder die niet opnieuw gestuurd zijn)
  const incomingIds = events.map(e => e.outlook_id)
  const yesterday   = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const { data: deleted } = await supabase
    .from('calendar_events')
    .delete()
    .eq('is_timeblock', false)
    .lt('start_time', yesterday.toISOString())
    .not('outlook_id', 'in', `(${incomingIds.map(id => `"${id}"`).join(',')})`)
    .select('id')

  return new Response(
    JSON.stringify({
      synced:    events.length,
      deleted:   deleted?.length ?? 0,
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
