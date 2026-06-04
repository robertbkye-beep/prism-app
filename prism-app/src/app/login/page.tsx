'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handle = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/')
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: email.split('@')[0] } }
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--void)', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        border: '1px solid var(--deep-gold)',
        borderTop: '3px solid var(--gold)',
        padding: 32,
        background: 'var(--surface)',
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 36,
            color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 4
          }}>PRISM</div>
          <div style={{ fontSize: 9, color: 'var(--grey)', letterSpacing: '0.25em' }}>
            PERFORMANCE SYSTEM
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 8, color: 'var(--grey)', marginBottom: 5, letterSpacing: '0.1em' }}>
            EMAIL
          </div>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            onKeyDown={e => e.key === 'Enter' && handle()}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 8, color: 'var(--grey)', marginBottom: 5, letterSpacing: '0.1em' }}>
            PASSWORD
          </div>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handle()}
          />
        </div>

        {error && (
          <div style={{
            background: '#2a0a0a', border: '1px solid var(--red)',
            padding: '8px 12px', fontSize: 11, color: 'var(--red-light)',
            marginBottom: 14, borderRadius: 2,
          }}>{error}</div>
        )}

        {message && (
          <div style={{
            background: '#0a2a0a', border: '1px solid #27ae60',
            padding: '8px 12px', fontSize: 11, color: '#2ecc71',
            marginBottom: 14, borderRadius: 2,
          }}>{message}</div>
        )}

        <button
          onClick={handle} disabled={loading || !email || !password}
          style={{
            width: '100%', background: loading ? 'var(--charcoal)' : 'var(--gold)',
            border: 'none', color: loading ? 'var(--gold)' : 'var(--void)',
            padding: '11px 0', fontSize: 10, letterSpacing: '0.15em', fontWeight: 'bold',
            marginBottom: 14,
          }}
        >
          {loading
            ? <span style={{ animation: 'pulse 1s infinite', display: 'inline-block' }}>
                {mode === 'login' ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}
              </span>
            : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'
          }
        </button>

        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--grey)' }}>
          {mode === 'login' ? (
            <>No account? <button onClick={() => setMode('signup')} style={{
              background: 'none', border: 'none', color: 'var(--gold)',
              fontSize: 10, padding: 0, cursor: 'pointer',
            }}>Sign up</button></>
          ) : (
            <>Have an account? <button onClick={() => setMode('login')} style={{
              background: 'none', border: 'none', color: 'var(--gold)',
              fontSize: 10, padding: 0, cursor: 'pointer',
            }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
