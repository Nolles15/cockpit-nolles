'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { parseInput, resolveStatus } from '@/lib/nlp-parser'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function createTask(rawInput: string) {
  const parsed = parseInput(rawInput)
  if (!parsed.content) return

  const status = resolveStatus(parsed.due_date)

  await db().from('activities').insert({
    type:             parsed.type,
    content:          parsed.content,
    due_date:         parsed.due_date?.toISOString() ?? null,
    project_tags:     parsed.project_tags,
    person_tags:      parsed.person_tags,
    priority:         parsed.priority,
    duration_minutes: parsed.duration_minutes,
    status,
  })

  revalidatePath('/', 'layout')
}

export async function toggleTask(id: string, currentStatus: string) {
  const newStatus = currentStatus === 'completed' ? 'open' : 'completed'
  await db().from('activities').update({ status: newStatus }).eq('id', id)
  revalidatePath('/', 'layout')
}

export async function deleteTask(id: string) {
  await db().from('activities').delete().eq('id', id)
  revalidatePath('/', 'layout')
}

export async function moveTaskToToday(id: string) {
  const today = new Date()
  today.setHours(23, 59, 0, 0)
  await db().from('activities').update({ due_date: today.toISOString(), status: 'open' }).eq('id', id)
  revalidatePath('/', 'layout')
}

export async function updateTask(id: string, rawInput: string) {
  const parsed = parseInput(rawInput)
  if (!parsed.content) return
  const status = resolveStatus(parsed.due_date)
  await db().from('activities').update({
    content:      parsed.content,
    due_date:     parsed.due_date?.toISOString() ?? null,
    project_tags: parsed.project_tags,
    person_tags:  parsed.person_tags,
    priority:     parsed.priority,
    status,
  }).eq('id', id)
  revalidatePath('/', 'layout')
}

export async function rescheduleTask(id: string, due_date: string | null) {
  await db().from('activities').update({ due_date, status: 'open' }).eq('id', id)
  revalidatePath('/', 'layout')
}

export async function reorderTasks(updates: { id: string; position: number }[]) {
  await Promise.all(
    updates.map(({ id, position }) =>
      db().from('activities').update({ position }).eq('id', id)
    )
  )
  revalidatePath('/', 'layout')
}
