import { supabase } from '@/lib/supabase'
import DashboardShell from '@/components/DashboardShell'

export default async function Home() {
  const { data: tags } = await supabase.from('tags').select('*').order('name')

  return <DashboardShell tags={tags ?? []} />
}
