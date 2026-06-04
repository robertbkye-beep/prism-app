import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientPortal from '@/components/client/ClientPortal'

export default async function ClientPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find this user's client record
  const { data: clientRecord } = await supabase
    .from('clients').select('*').eq('profile_id', user.id).single()

  if (!clientRecord) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--void)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--grey)', fontSize: 13 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 36,
            color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 12
          }}>PRISM</div>
          <p>Your account is being set up by your practitioner.</p>
          <p style={{ marginTop: 8, fontSize: 11 }}>Check back shortly or contact Robert.</p>
        </div>
      </div>
    )
  }

  // Load program and sessions
  const [programRes, sessionsRes, planRes] = await Promise.all([
    supabase.from('programs').select('*').eq('client_id', clientRecord.id).eq('is_active', true).single(),
    supabase.from('sessions').select('*').eq('client_id', clientRecord.id).order('date', { ascending: false }).limit(20),
    supabase.from('progression_plans').select('*').eq('client_id', clientRecord.id).order('generated_at', { ascending: false }).limit(1).single(),
  ])

  return (
    <ClientPortal
      client={clientRecord}
      initialProgram={programRes.data}
      initialSessions={sessionsRes.data || []}
      initialPlan={planRes.data}
    />
  )
}
