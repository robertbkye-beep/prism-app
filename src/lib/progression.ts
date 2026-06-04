import type { SessionExercise, ProgressionExercise } from '@/types'

const REP_BRACKETS = [
  { min: 1,  max: 5,  goal: 'Max Strength',           uP: 0.025, lP: 0.025 },
  { min: 6,  max: 8,  goal: 'Strength–Hypertrophy',    uP: 0.025, lP: 0.025 },
  { min: 8,  max: 12, goal: 'Hypertrophy',              uP: 0.025, lP: 0.05  },
  { min: 12, max: 15, goal: 'Hypertrophy–Endurance',    uP: 0.025, lP: 0.05  },
  { min: 15, max: 20, goal: 'Muscular Endurance',       uP: 0.05,  lP: 0.05  },
]

const LOWER_PATTERNS = ['Squat', 'Hip Hinge', 'Gait / Locomotion']

export function calculateProgression(ex: SessionExercise): ProgressionExercise | null {
  if (!ex?.sets?.length) return null

  if (ex.flag) {
    return {
      name: ex.name, pattern: ex.pattern, tempo: ex.tempo, videoId: ex.videoId,
      regressed: true, flag: ex.flag, flagNote: ex.flagNote,
    }
  }

  const done = ex.sets.filter(s =>
    s.reps && s.weight && !isNaN(parseFloat(s.weight)) && parseInt(s.reps) > 0
  )
  if (!done.length) return null

  const avgR = done.reduce((a, s) => a + parseInt(s.reps), 0) / done.length
  const avgW = done.reduce((a, s) => a + parseFloat(s.weight), 0) / done.length
  const n = done.length

  const bk = REP_BRACKETS.find(b => avgR >= b.min && avgR <= b.max) || REP_BRACKETS[REP_BRACKETS.length - 1]
  const isLo = ex.pattern && LOWER_PATTERNS.includes(ex.pattern)
  const pct = isLo ? bk.lP : bk.uP

  let action: string, tW: number, tR: number, tS: number, rationale: string

  if (n < 3) {
    action = 'ADD VOLUME'; tS = n + 1; tR = Math.ceil(avgR); tW = Math.round(avgW * 2) / 2
    rationale = `${n} set${n > 1 ? 's' : ''} logged. Add 1 set — Chek volume accumulation.`
  } else if (done.every(s => parseInt(s.reps) >= bk.max)) {
    action = 'LOAD UP'; tW = Math.round(avgW * (1 + pct) * 2) / 2; tR = bk.min; tS = n
    rationale = `Rep ceiling (${bk.max}) hit. +${(pct * 100).toFixed(1)}% load. Reset to ${bk.min}.`
  } else if (done.every(s => parseInt(s.reps) <= bk.min)) {
    action = 'ADD REPS'; tR = Math.min(Math.ceil(avgR) + 1, bk.max); tW = Math.round(avgW * 2) / 2; tS = n
    rationale = `All sets at rep floor. Hold load. Drive reps to ${tR}.`
  } else {
    action = 'CONSOLIDATE'; tR = Math.ceil(avgR); tW = Math.round(avgW * 2) / 2; tS = n
    rationale = `Rep variance across sets. Standardise to ${tR} reps before progressing.`
  }

  return {
    name: ex.name, pattern: ex.pattern, tempo: ex.tempo, videoId: ex.videoId,
    action, targetSets: tS!, targetReps: tR!, targetWeight: tW!,
    bracket: bk.goal, avgReps: Math.round(avgR * 10) / 10,
    avgWeight: Math.round(avgW * 10) / 10, rationale,
  }
}

export function parseTempo(t: string): number {
  if (!t || t === 'breath') return 4
  const parts = t.split('-').map(Number)
  return parts.reduce((a, v) => a + (isNaN(v) ? 0 : v), 0) || 4
}

export function parseRestToSecs(r: string): number {
  if (!r) return 90
  const m = r.match(/(\d+)/)
  const n = m ? parseInt(m[1]) : 90
  return r.includes('min') ? n * 60 : n
}

export function calcSessionDuration(exercises: Array<{
  tempo?: string; reps?: string; sets?: number; rest?: string
}>): number {
  let t = 0
  for (const ex of exercises) {
    const tp = parseTempo(ex.tempo || '3-0-1-0')
    const reps = parseInt(ex.reps || '10') || 10
    const sets = ex.sets || 3
    const rest = parseRestToSecs(ex.rest || '90s')
    t += (tp * reps * sets) + (rest * (sets - 1)) + 30
  }
  return Math.ceil((t + 600) / 60)
}
