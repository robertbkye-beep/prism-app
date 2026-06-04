import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { clientId, email } = await req.json()

    // Verify practitioner owns this client
    const { data: client } = await supabase.from('clients')
      .select('*').eq('id', clientId).eq('practitioner_id', user.id).single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex')
    const serviceClient = createServiceClient()

    await serviceClient.from('client_invites').insert({
      client_id: clientId,
      token,
      email,
    })

    // Update client email
    await serviceClient.from('clients').update({ email }).eq('id', clientId)

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

    // In production: send email via Resend/SendGrid
    // For now: return the invite URL
    return NextResponse.json({ inviteUrl, token })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
