import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildAdaptationPrompt, extractJSON } from '@/lib/ai/knowledge'
import { calculateProgression } from '@/lib/progression'
import type { SessionExercise } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId } = await req.json()

    // Load session and program
    const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const { data: program } = await supabase.from('programs').select('*')
      .eq('client_id', session.client_id).eq('is_active', true).single()

    // 1. Calculate Poliquin progression plan
    const progressionExercises = (session.exercises as SessionExercise[])
      .map(ex => calculateProgression(ex))
      .filter(Boolean)

    // Save progression plan
    await supabase.from('progression_plans').insert({
      client_id: session.client_id,
      session_id: sessionId,
      exercises: progressionExercises,
    })

    // 2. AI adaptive update of remaining program weeks
    if (program) {
      const weekIndex = session.week_index || 0
      const remainingWeeks = (program.weeks as unknown[]).slice(weekIndex + 1)

      if (remainingWeeks.length > 0) {
        const { system, user: userMsg } = buildAdaptationPrompt(session, remainingWeeks)

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system,
          messages: [{ role: 'user', content: userMsg }],
        })

        const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
        const parsed = extractJSON(rawText) as { adaptationSummary: string; updatedWeeks: unknown[] }

        if (parsed.updatedWeeks) {
          const completedWeeks = (program.weeks as unknown[]).slice(0, weekIndex + 1)
          const updatedWeeks = [...completedWeeks, ...parsed.updatedWeeks]

          await supabase.from('programs').update({
            weeks: updatedWeeks,
            last_adaptation: { date: new Date().toISOString(), summary: parsed.adaptationSummary },
            updated_at: new Date().toISOString(),
          }).eq('id', program.id)

          return NextResponse.json({
            progressionPlan: progressionExercises,
            adaptationSummary: parsed.adaptationSummary,
          })
        }
      }
    }

    return NextResponse.json({ progressionPlan: progressionExercises, adaptationSummary: null })
  } catch (err) {
    console.error('Adapt session error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
