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

// Kleuren voor nieuwe tags (cyclisch)
const TAG_COLORS = ['#4f46e5','#f59e0b','#22c55e','#3b82f6','#a78bfa','#ec4899','#f97316','#14b8a6']

export async function createTag(name: string, type: 'project' | 'person') {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-')
  if (!slug) return
  // Pak een willekeurige kleur die nog niet in gebruik is
  const { data: existing } = await db().from('tags').select('color')
  const usedColors = new Set((existing ?? []).map((t: { color: string }) => t.color))
  const color = TAG_COLORS.find(c => !usedColors.has(c)) ?? TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
  await db().from('tags').insert({ name: slug, tag_type: type, color })
  revalidatePath('/', 'layout')
}

export async function deleteTag(name: string) {
  await db().from('tags').delete().eq('name', name)
  revalidatePath('/', 'layout')
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
  // Titel wordt als eerste regel opgeslagen, gescheiden door \n\n
  const stored = title ? `${title}\n\n${content}` : content
  await db().from('project_notes').insert({ project_tag: projectTag, content: stored })
  revalidate(projectTag)
}

export async function deleteNote(id: string, projectTag: string) {
  await db().from('project_notes').delete().eq('id', id)
  revalidate(projectTag)
}
