import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ProjectPage from '@/components/ProjectPage'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function ProjectRoute({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag)

  const [
    { data: tagData },
    { data: project },
    { data: activities },
    { data: milestones },
    { data: notes },
  ] = await Promise.all([
    db().from('tags').select('*').eq('name', tag).maybeSingle(),
    db().from('projects').select('*').eq('tag_name', tag).maybeSingle(),
    db().from('activities').select('*').contains('project_tags', [tag]).order('position').order('created_at'),
    db().from('milestones').select('*').eq('project_tag', tag).order('position'),
    db().from('project_notes').select('*').eq('project_tag', tag).order('updated_at', { ascending: false }),
  ])

  if (!tagData) notFound()

  return (
    <ProjectPage
      tag={tag}
      tagColor={tagData.color}
      project={project}
      activities={activities ?? []}
      milestones={milestones ?? []}
      notes={notes ?? []}
    />
  )
}
