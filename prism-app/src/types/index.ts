// ── DATABASE TYPES ────────────────────────────────────────────────────────────

export type Role = 'practitioner' | 'client'
export type Pillar = 'REGULATE' | 'REBUILD' | 'LEAD'
export type TrafficLight = 'GREEN' | 'AMBER' | 'RED'
export type TrainingAge = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  practitioner_id: string | null
  created_at: string
}

export interface Client {
  id: string
  practitioner_id: string
  profile_id: string | null
  name: string
  email: string | null
  program: Pillar
  training_age: TrainingAge
  created_at: string
  updated_at: string
}

export interface IntakeAssessment {
  id: string
  client_id: string
  goals: string[]
  client_description: string | null
  contraindications: string | null
  session_duration: number
  posture_findings: Record<string, string>
  movement_findings: Record<string, string>
  prism_findings: Record<string, string>
  free_text: string | null
  updated_at: string
}

export interface ChekScore {
  id: string
  client_id: string
  answers: Record<string, number>
  traffic_light: TrafficLight | null
  total_score: number | null
  max_score: number | null
  pct: number | null
  label: string | null
  description: string | null
  assessed_at: string
}

export interface PrismLayerNotes {
  P: string
  R: string
  I: string
  S: string
  M: string
}

export interface OpeningRitual {
  grabovoi: string
  biogeoSignature: string
  frequency: string
  duration: string
}

export interface Exercise {
  name: string
  pattern: string
  sets: number
  reps: string
  tempo: string
  rest: string
  bracket: string
  coachNote: string
  prismLayer: 'P' | 'R' | 'I' | 'S' | 'M'
  youtubeSearch: string
  videoId: string
  time_estimate_secs: number
}

export interface ProgramSession {
  sessionLabel: string
  pillar: Pillar
  estimatedMinutes: number
  openingRitual: OpeningRitual
  exercises: Exercise[]
}

export interface ProgramWeek {
  week: number
  phase: Pillar
  focus: string
  adaptationNote: string
  sessions: ProgramSession[]
}

export interface Program {
  id: string
  client_id: string
  title: string
  duration_weeks: number
  sessions_per_week: number
  target_minutes: number
  phase_goal: string | null
  traffic_light: TrafficLight | null
  rationale: string | null
  prism_layer_notes: PrismLayerNotes | null
  progression_protocol: string | null
  last_adaptation: { date: string; summary: string } | null
  weeks: ProgramWeek[]
  is_active: boolean
  generated_at: string
  updated_at: string
}

export interface SessionSet {
  reps: string
  weight: string
  notes: string
  target: boolean
}

export interface SessionExercise {
  id: string
  name: string
  pattern: string
  tempo: string
  videoId: string
  flag: string
  flagNote: string
  targetNote: string
  sets: SessionSet[]
}

export interface Session {
  id: string
  client_id: string
  program_id: string | null
  pillar: Pillar
  session_notes: string | null
  exercises: SessionExercise[]
  status: 'active' | 'complete'
  week_index: number
  date: string
}

export interface ProgressionExercise {
  name: string
  pattern: string
  tempo: string
  videoId: string
  action?: string
  targetSets?: number
  targetReps?: number
  targetWeight?: number
  bracket?: string
  avgReps?: number
  avgWeight?: number
  rationale?: string
  regressed?: boolean
  flag?: string
  flagNote?: string
}

export interface ProgressionPlan {
  id: string
  client_id: string
  session_id: string | null
  exercises: ProgressionExercise[]
  generated_at: string
}
