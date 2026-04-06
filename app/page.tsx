import { createClient } from '@supabase/supabase-js'
import DashboardShell from '@/components/DashboardShell'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function Home() {
  const [{ data: tags }, { data: activities }] = await Promise.all([
    db().from('tags').select('*').order('name'),
    db().from('activities').select('*').order('position').order('created_at'),
  ])

  return <DashboardShell tags={tags ?? []} activities={activities ?? []} />
}
