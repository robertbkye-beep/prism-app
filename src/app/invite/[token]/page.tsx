'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const { token } = useParams() as { token: string }
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<{ email: string; client_id: string } | null>(null)

  useEffect(() => {
    supabase.from('client_invites')
      .select('email, client_id, accepted, expires_at')
      .eq('token', token).single()
      .then(({ data }) => {
        if (!data) { setError('Invalid or expired invite link.'); return }
        if (data.accepted) { setError('This invite has already been used.'); return }
        if (new Date(data.expires_at) < new Date()) { setError('This invite has expired.'); return }
        setInvite(data)
        setEmail(data.email)
      })
  }, [token])

  const handleAccept = async () => {
    if (!invite) return
    setLoading(true); setError('')

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: 'client' } }
    })

    if (signupError) { setError(signupError.message); setLoading(false); return }

    // Link profile to client record and mark invite accepted
    if (signupData.user) {
      await supabase.from('clients').update({ profile_id: signupData.user.id }).eq('id', invite.client_id)
      await supabase.from('client_invites').update({ accepted: true }).eq('token', token)
    }

    router.push('/client')
    setLoading(false)
  }

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--void)' }}>
      <div style={{ color: 'var(--red-light)', textAlign: 'center', fontSize: 13 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--gold)', marginBottom: 12 }}>PRISM</div>
        {error}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--void)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, border: '1px solid var(--deep-gold)', borderTop: '3px solid var(--gold)', padding: 32, background: 'var(--surface)' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 4 }}>PRISM</div>
          <div style={{ fontSize: 9, color: 'var(--grey)', letterSpacing: '0.2em', marginBottom: 12 }}>YOU HAVE BEEN INVITED</div>
          <div style={{ fontSize: 11, color: 'var(--cream)', lineHeight: 1.6 }}>
            Your practitioner has set up your PRISM Performance account. Create your login below.
          </div>
        </div>

        {[
          { label: 'FULL NAME', value: name, setter: setName, placeholder: 'Your full name', type: 'text' },
          { label: 'EMAIL', value: email, setter: setEmail, placeholder: 'your@email.com', type: 'email' },
          { label: 'CREATE PASSWORD', value: password, setter: setPassword, placeholder: '8+ characters', type: 'password' },
        ].map(({ label, value, setter, placeholder, type }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 8, color: 'var(--grey)', marginBottom: 4, letterSpacing: '0.1em' }}>{label}</div>
            <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} />
          </div>
        ))}

        <button onClick={handleAccept} disabled={loading || !name || !password}
          style={{ width: '100%', background: 'var(--gold)', border: 'none', color: 'var(--void)', padding: '11px 0', fontSize: 10, letterSpacing: '0.15em', fontWeight: 'bold', marginTop: 6 }}>
          {loading ? 'SETTING UP...' : 'ACCESS MY PROGRAM →'}
        </button>
      </div>
    </div>
  )
}
