import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildGenerationPrompt, extractJSON } from '@/lib/ai/knowledge'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { clientId, amendInstructions, weekToAmend } = body

    // Load all client data
    const [clientRes, intakeRes, chekRes, programRes, sessionsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('intake_assessments').select('*').eq('client_id', clientId).single(),
      supabase.from('chek_scores').select('*').eq('client_id', clientId).order('assessed_at', { ascending: false }).limit(1).single(),
      supabase.from('programs').select('*').eq('client_id', clientId).eq('is_active', true).single(),
      supabase.from('sessions').select('*').eq('client_id', clientId).eq('status', 'complete').order('date', { ascending: false }).limit(3),
    ])

    const client = clientRes.data
    const intake = intakeRes.data
    const chek = chekRes.data
    const existingProgram = programRes.data
    const recentSessions = sessionsRes.data || []

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const { system, user: userMsg } = buildGenerationPrompt({
      clientName: client.name,
      trainingAge: client.training_age,
      program: client.program,
      goals: intake?.goals || [],
      clientDescription: intake?.client_description || '',
      contraindications: intake?.contraindications || '',
      targetMins: intake?.session_duration || 60,
      trafficLight: chek?.traffic_light || 'AMBER',
      postureFindings: intake?.posture_findings || {},
      movementFindings: intake?.movement_findings || {},
      prismFindings: intake?.prism_findings || {},
      freeText: intake?.free_text || '',
      recentSessions,
      amendInstructions,
      existingProgram: amendInstructions ? existingProgram : undefined,
    })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      system,
      messages: [{ role: 'user', content: userMsg }],
    })

    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json({ error: 'Response truncated — reduce session duration or weeks' }, { status: 422 })
    }

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = extractJSON(rawText) as Record<string, unknown>

    // Save or update program
    const programData = {
      client_id: clientId,
      title: parsed.programTitle as string,
      duration_weeks: parsed.durationWeeks as number,
      sessions_per_week: parsed.sessionsPerWeek as number,
      target_minutes: parsed.targetMinutesPerSession as number,
      phase_goal: parsed.phaseGoal as string,
      traffic_light: parsed.trafficLight as string,
      rationale: parsed.rationale as string,
      prism_layer_notes: parsed.prismLayerNotes as Record<string, string>,
      progression_protocol: parsed.progressionProtocol as string,
      weeks: parsed.weeks as unknown[],
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    let savedProgram
    if (existingProgram && amendInstructions) {
      const { data } = await supabase.from('programs').update(programData).eq('id', existingProgram.id).select().single()
      savedProgram = data
    } else {
      // Deactivate old programs
      await supabase.from('programs').update({ is_active: false }).eq('client_id', clientId)
      const { data } = await supabase.from('programs').insert(programData).select().single()
      savedProgram = data
    }

    return NextResponse.json({ program: savedProgram })
  } catch (err) {
    console.error('Generate program error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
