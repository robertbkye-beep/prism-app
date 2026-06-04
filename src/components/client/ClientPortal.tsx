'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, Program, Session, ProgressionPlan } from '@/types'

const C = {
  void:'#0A0A0A', navy:'#0D1B2A', charcoal:'#1C1C1E', surface:'#141416',
  gold:'#C9A84C', deepGold:'#8B6914', cream:'#F5F0E8',
  grey:'#B0AEA6', teal:'#0B4F4A', red:'#c0392b', redL:'#e74c3c', border:'#2a2a2e',
}
const PILLAR_COLOR: Record<string,string> = { REGULATE:C.teal, REBUILD:C.gold, LEAD:C.cream }

function ytEmbed(id: string) { return `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0` }

export default function ClientPortal({
  client, initialProgram, initialSessions, initialPlan,
}: {
  client: Client
  initialProgram: Program | null
  initialSessions: Session[]
  initialPlan: ProgressionPlan | null
}) {
  const [program, setProgram] = useState(initialProgram)
  const [sessions, setSessions] = useState(initialSessions)
  const [plan, setPlan] = useState(initialPlan)
  const [tab, setTab] = useState<'program'|'sessions'>('program')
  const [expandWeek, setExpandWeek] = useState(0)
  const supabase = createClient()

  // Realtime sync — when practitioner updates program, client sees it instantly
  useEffect(() => {
    const channel = supabase
      .channel('client-sync')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'programs',
        filter: `client_id=eq.${client.id}`,
      }, payload => {
        if (payload.new) setProgram(payload.new as Program)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'progression_plans',
        filter: `client_id=eq.${client.id}`,
      }, payload => {
        if (payload.new) setPlan(payload.new as ProgressionPlan)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [client.id])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const pillarColor = PILLAR_COLOR[client.program] || C.gold

  return (
    <div style={{ minHeight: '100vh', background: C.void, fontFamily: "'DM Mono','Courier New',monospace", color: C.cream }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.deepGold}`, padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: C.gold, letterSpacing: '.1em' }}>PRISM</span>
          <span style={{ fontSize: 9, color: C.grey, letterSpacing: '.2em' }}>MY PROGRAM</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: C.grey }}>{client.name}</span>
          <span className="pill" style={{ background: pillarColor + '22', color: pillarColor, border: `1px solid ${pillarColor}44` }}>
            {client.program}
          </span>
          <button onClick={signOut} style={{ background: 'transparent', border: 'none', color: C.grey, fontSize: 10, padding: 0 }}>SIGN OUT</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${C.border}`, display: 'flex', padding: '0 20px' }}>
        {[['program','MY PROGRAM'],['sessions','SESSION LOG']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as 'program'|'sessions')} style={{
            background: 'transparent', border: 'none', borderBottom: `2px solid ${tab===k?C.gold:'transparent'}`,
            color: tab===k?C.gold:C.grey, padding: '10px 16px', fontSize: 9, letterSpacing: '.15em',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 14px' }}>

        {/* PROGRAM TAB */}
        {tab === 'program' && (
          !program ? (
            <div style={{ textAlign: 'center', marginTop: 60, color: C.grey, fontSize: 12, lineHeight: 2 }}>
              Your program is being built by Robert.<br/>Check back shortly.
            </div>
          ) : (
            <div>
              {program.last_adaptation && (
                <div style={{ background: C.teal+'15', border: `1px solid ${C.teal}`, borderLeft: `3px solid ${C.teal}`, padding: '10px 14px', marginBottom: 14, fontSize: 10, color: C.cream, lineHeight: 1.7 }}>
                  <div style={{ fontSize: 8, color: C.teal, letterSpacing: '.15em', marginBottom: 4 }}>PROGRAM UPDATED</div>
                  {program.last_adaptation.summary}
                </div>
              )}

              <div style={{ background: C.navy, border: `1px solid ${C.deepGold}`, borderLeft: `3px solid ${C.gold}`, padding: '14px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 20, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '.08em', color: C.gold, marginBottom: 4 }}>
                  {program.title}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[`${program.duration_weeks}w`, `${program.sessions_per_week}x/wk`, program.phase_goal, `${program.target_minutes}min`].filter(Boolean).map(v => (
                    <span key={v} className="pill" style={{ background: C.gold+'22', color: C.gold, border: `1px solid ${C.deepGold}` }}>{v}</span>
                  ))}
                </div>
                {program.rationale && <div style={{ fontSize: 11, color: C.grey, lineHeight: 1.7 }}>{program.rationale}</div>}
              </div>

              {program.weeks?.map((wk, wi) => (
                <div key={wi} style={{ marginBottom: 6, border: `1px solid ${C.border}`, borderLeft: `3px solid ${expandWeek===wi?C.gold:C.border}` }}>
                  <div className="hov" onClick={() => setExpandWeek(expandWeek===wi?-1:wi)}
                    style={{ background: C.surface, padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: expandWeek===wi?C.gold:C.grey }}>WEEK {wk.week}</span>
                      <span className="pill" style={{ background: C.teal+'22', color: C.teal, fontSize: 8 }}>{wk.phase}</span>
                      <span style={{ fontSize: 10, color: C.grey }}>{wk.focus}</span>
                    </div>
                    <span style={{ fontSize: 10, color: C.grey }}>{expandWeek===wi?'▲':'▼'}</span>
                  </div>

                  {expandWeek === wi && wk.sessions?.map((ses, si) => {
                    const pc = PILLAR_COLOR[ses.pillar] || C.gold
                    return (
                      <div key={si} style={{ borderTop: `1px solid ${C.border}` }}>
                        <div style={{ padding: '9px 16px', background: C.charcoal, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12 }}>{ses.sessionLabel}</span>
                          <span className="pill" style={{ background: pc+'22', color: pc, fontSize: 8 }}>{ses.pillar}</span>
                          <span className="pill" style={{ background: '#ffffff08', color: C.grey, fontSize: 8 }}>⏱ {ses.estimatedMinutes}min</span>
                        </div>

                        {(ses.openingRitual?.grabovoi || ses.openingRitual?.biogeoSignature) && (
                          <div style={{ padding: '8px 16px', background: '#7c5cbf15', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 8, color: '#9b7ed4', letterSpacing: '.12em', alignSelf: 'center' }}>OPENING RITUAL</span>
                            {ses.openingRitual.grabovoi && <span className="pill" style={{ background: '#7c5cbf22', color: '#9b7ed4', fontSize: 8 }}>{ses.openingRitual.grabovoi}</span>}
                            {ses.openingRitual.biogeoSignature && <span className="pill" style={{ background: '#1abc9c22', color: '#1abc9c', fontSize: 8 }}>{ses.openingRitual.biogeoSignature}</span>}
                            {ses.openingRitual.frequency && <span className="pill" style={{ background: '#ffffff08', color: C.grey, fontSize: 8 }}>{ses.openingRitual.frequency}</span>}
                          </div>
                        )}

                        <div style={{ padding: '10px 16px' }}>
                          {ses.exercises?.map((ex, ei) => (
                            <div key={ei} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '10px 12px', marginBottom: 5 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13 }}>{ex.name}</span>
                                    {ex.pattern && <span className="pill" style={{ background: '#ffffff08', color: C.grey, fontSize: 8 }}>{ex.pattern}</span>}
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                                    {[{l:'SETS',v:ex.sets},{l:'REPS',v:ex.reps},{l:'TEMPO',v:ex.tempo},{l:'REST',v:ex.rest}].map(({l,v}) => (
                                      <div key={l} style={{ background: C.navy, padding: '4px 8px', minWidth: 50 }}>
                                        <div style={{ fontSize: 7, color: C.grey, letterSpacing: '.1em', marginBottom: 1 }}>{l}</div>
                                        <div style={{ fontSize: 13, color: C.gold, fontFamily: "'Bebas Neue',sans-serif" }}>{v}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {ex.coachNote && <div style={{ fontSize: 10, color: C.grey, lineHeight: 1.5, borderLeft: `2px solid ${C.deepGold}44`, paddingLeft: 8 }}>{ex.coachNote}</div>}
                                </div>
                                {ex.videoId && (
                                  <iframe width="140" height="79" src={ytEmbed(ex.videoId)} title={ex.name} allowFullScreen style={{ border: 'none', borderRadius: 2, flexShrink: 0 }} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        )}

        {/* SESSIONS TAB */}
        {tab === 'sessions' && (
          <div>
            {plan && (
              <div style={{ background: C.navy, border: `1px solid ${C.deepGold}`, borderLeft: `3px solid ${C.gold}`, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: C.gold, letterSpacing: '.15em', marginBottom: 8 }}>NEXT SESSION TARGETS</div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {(plan.exercises as Array<{name:string;action?:string;targetReps?:number;targetWeight?:number;targetSets?:number;regressed?:boolean}>).slice(0, 6).map((ex, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                      <span style={{ color: C.cream, minWidth: 160 }}>{ex.name}</span>
                      {ex.regressed
                        ? <span style={{ color: C.redL, fontSize: 9 }}>⚠ Regression required</span>
                        : <span style={{ color: C.grey, fontSize: 10 }}>{ex.targetSets}×{ex.targetReps} @ {ex.targetWeight}kg — <span style={{ color: C.gold }}>{ex.action}</span></span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sessions.length === 0
              ? <div style={{ color: C.grey, fontSize: 12, textAlign: 'center', marginTop: 40 }}>No sessions logged yet.</div>
              : sessions.map(s => {
                  const pc = PILLAR_COLOR[s.pillar] || C.gold
                  return (
                    <div key={s.id} style={{ background: C.charcoal, border: `1px solid ${C.border}`, borderLeft: `3px solid ${pc}`, padding: '12px 16px', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12 }}>{new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span className="pill" style={{ background: pc+'22', color: pc, fontSize: 8 }}>{s.pillar}</span>
                        <span style={{ fontSize: 10, color: C.grey }}>{s.exercises.length} exercises</span>
                      </div>
                      {s.session_notes && <div style={{ fontSize: 10, color: C.grey, lineHeight: 1.6 }}>{s.session_notes}</div>}
                    </div>
                  )
                })
            }
          </div>
        )}
      </div>
    </div>
  )
}
