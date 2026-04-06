// Ultra-Flow — Supabase Realtime subscriptions
// Pulse-kolom refresht automatisch als PowerShell sync binnenkomt

import { supabase } from './supabase'

type Callback = () => void

export function subscribeToCalendar(onUpdate: Callback) {
  const channel = supabase
    .channel('calendar-changes')
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'calendar_events',
    }, onUpdate)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToActivities(onUpdate: Callback) {
  const channel = supabase
    .channel('activity-changes')
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'activities',
    }, onUpdate)
    .subscribe()

  return () => supabase.removeChannel(channel)
}
