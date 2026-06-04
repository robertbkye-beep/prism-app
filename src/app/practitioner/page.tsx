import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PractitionerApp from '@/components/practitioner/PractitionerApp'

export default async function PractitionerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'practitioner') redirect('/client')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('practitioner_id', user.id)
    .order('created_at', { ascending: false })

  return <PractitionerApp initialClients={clients || []} practitionerId={user.id} />
}
