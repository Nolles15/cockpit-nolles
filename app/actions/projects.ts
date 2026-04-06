'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function revalidate(tag: string) {
  revalidatePath('/', 'layout')
  revalidatePath(`/projects/${encodeURIComponent(tag)}`)
}

export async function addMilestone(projectTag: string, name: string) {
  const { data: last } = await db()
    .from('milestones')
    .select('position')
    .eq('project_tag', projectTag)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  await db().from('milestones').insert({
    project_tag: projectTag,
    name,
    position: (last?.position ?? 0) + 1,
  })
  revalidate(projectTag)
}

export async function deleteMilestone(id: string, projectTag: string) {
  await db().from('milestones').delete().eq('id', id)
  revalidate(projectTag)
}

export async function addNote(projectTag: string, content: string, title?: string) {
  await db().from('project_notes').insert({ project_tag: projectTag, content, title: title || null })
  revalidate(projectTag)
}

export async function deleteNote(id: string, projectTag: string) {
  await db().from('project_notes').delete().eq('id', id)
  revalidate(projectTag)
}
