export const KB_CONDENSED = `PRISM PROTOCOL — Avatar Training (Robert Boakye)
LAYERS: P=Postural/Structural (Voyer SomaTraining, Kapandji, Anatomy Trains, Chek) | R=Root Neurological (AMN 8 Homeostasis Screens: Limbic→Respiratory→GI→Immune→Circadian Vestibular→Circadian Liver→Osmolarity→Structure | Polyvagal | TCM) | I=Identity/Psychological (Evette Rose Metaphysical Anatomy) | S=Somatic Energy (Solfeggio, PEMF, Light, Grabovoi, Biogeometric Signatures) | M=Meridian/Elemental (BaZi, TCM 5 Elements)
VOYER: Joint-centric. Decoaptation principle. ELDOA for spinal joints. SomaTherapy fascial pump.
KAPANDJI: Hip-ILF limits extension/ER. Gluteus medius=pelvic stability. Screw-home mechanism knee. Windlass foot. ATFL first ankle sprain. Pes planus chain=eversion→tibial IR→knee valgus.
CHEK: 6 primal patterns. Joint before muscle. Stability before mobility. Work-in vs work-out (RED=no loading, AMBER=moderate, GREEN=full load).
POLIQUIN: Double progression — rep ceiling all sets→load up+reset to bracket floor. Antagonist pairs always. 2.5% upper/5% lower body increments. Brackets: 1-5 Max Strength, 6-8 Str-Hyp, 8-12 Hyp, 12-15 Hyp-End, 15-20 End.
EVETTE ROSE: Lower back=financial fear/survival. Neck=inflexibility. Shoulders=carrying burden. Hip=fear moving forward/ancestral. Knee=pride/ego. Chest=grief. Throat=unexpressed truth.
AMN SCREENS: Always Limbic first, Structure last. Neo Mesoderm=self-devaluation (bone=severest). Endoderm=nourishment/existence conflicts.
BIOGEOMETRIC: Vesica Piscis=Heart. Double Helix=Lungs. Triangle=Liver. Crescent=Kidney. Hexagon=Stomach. Square=LI. Merkaba=Bladder. Flower of Life=CNS. Caduceus=Spine. Vesica horizontal=Hip.
GRABOVOI: Heart=9187948. Lung=5143248. Kidney=8921435. Liver=1489755. Digestive=9184551. Joint=8245014. Stress=519714. General=1111111.
SOLFEGGIO: 174Hz=pain/ground. 285Hz=tissue regen. 396Hz=fear release. 417Hz=change. 528Hz=DNA/heart. 741Hz=detox. 852Hz=intuition. 963Hz=crown.
PHASE ORDER: REGULATE (nervous system first, ELDOA, breath, AMN, RPE≤6) → REBUILD (Poliquin loading, primal patterns, antagonist balance, RPE 7-8) → LEAD (integration, power, identity, RPE 8-9).
SESSION TIME: tempo_digits×reps×sets + rest×(sets-1) + 30s transition per exercise + 10min warmup/cooldown.`

export const PROGRAM_SCHEMA = `{"programTitle":"string","durationWeeks":number,"sessionsPerWeek":number,"targetMinutesPerSession":number,"phaseGoal":"string max 30 words","trafficLight":"GREEN|AMBER|RED","rationale":"string max 40 words","prismLayerNotes":{"P":"max 15 words","R":"max 15 words","I":"max 15 words","S":"max 15 words","M":"max 15 words"},"progressionProtocol":"max 25 words","weeks":[{"week":number,"phase":"REGULATE|REBUILD|LEAD","focus":"max 8 words","adaptationNote":"max 15 words","sessions":[{"sessionLabel":"string","pillar":"REGULATE|REBUILD|LEAD","estimatedMinutes":number,"openingRitual":{"grabovoi":"sequence or empty","biogeoSignature":"name or empty","frequency":"Hz or empty","duration":"e.g. 3 min or empty"},"exercises":[{"name":"string","pattern":"string","sets":number,"reps":"string","tempo":"string","rest":"string","bracket":"string","coachNote":"max 15 words","prismLayer":"P|R|I|S|M","youtubeSearch":"3-5 words","videoId":"","time_estimate_secs":number}]}]}]}`

export function buildGenerationPrompt(data: {
  clientName: string
  trainingAge: string
  program: string
  goals: string[]
  clientDescription: string
  contraindications: string
  targetMins: number
  trafficLight: string
  postureFindings: Record<string, string>
  movementFindings: Record<string, string>
  prismFindings: Record<string, string>
  freeText: string
  recentSessions: unknown[]
  amendInstructions?: string
  existingProgram?: unknown
}) {
  const system = `${KB_CONDENSED}

You are the PRISM Protocol AI — the intelligence engine of Avatar Training, created by Robert Boakye.

YOUR TASK: Generate a structured training program as compact valid JSON.

CRITICAL RULES:
1. OUTPUT ONLY RAW JSON — no markdown, no code fences, no preamble
2. Be CONCISE — max 20 words per coachNote, max 15 words per prismLayerNote
3. Generate EXACTLY 4 weeks — remaining weeks added via amendment
4. SESSION DURATION: calculate estimatedMinutes from tempo×reps×sets + rest periods + 10min
5. Traffic light: RED=work-in only; AMBER=moderate load; GREEN=full progressive load
6. Apply Chek joint integrity, Poliquin structural balance, ELDOA for spinal findings
7. Include biogeometric movement in openingRitual when organ system flagged
8. Include Grabovoi sequence in openingRitual when energetic work indicated
9. Language: direct, clinical. Zero therapy framing.

JSON SCHEMA:
${PROGRAM_SCHEMA}`

  const user = `Client: ${data.clientName} | Training age: ${data.trainingAge} | Pillar: ${data.program}
Goals: ${data.goals.join(', ') || 'not specified'}
Description: ${data.clientDescription || 'none'}
Contraindications: ${data.contraindications || 'none'}
Target session: ${data.targetMins} minutes
Traffic light: ${data.trafficLight || 'not assessed'}
Posture: ${JSON.stringify(data.postureFindings)}
Movement: ${JSON.stringify(data.movementFindings)}
PRISM flags: ${JSON.stringify(data.prismFindings)}
Notes: ${data.freeText || 'none'}
Recent sessions: ${JSON.stringify(data.recentSessions.slice(0, 3))}${
    data.amendInstructions
      ? `\n\nAMENDMENT: ${data.amendInstructions}\nExisting program: ${JSON.stringify(data.existingProgram)}`
      : ''
  }`

  return { system, user }
}

export function buildAdaptationPrompt(sessionData: unknown, remainingWeeks: unknown) {
  const system = `${KB_CONDENSED}

You are the PRISM adaptive intelligence engine. After each session, review data and update remaining program weeks.
Return ONLY JSON: { "adaptationSummary": "string max 30 words", "updatedWeeks": [...] }
If pain flagged: regress that pattern immediately.
If progressing ahead: advance phase.
Apply Poliquin double progression to update loads.`

  const user = `Completed session: ${JSON.stringify(sessionData)}
Remaining weeks: ${JSON.stringify(remainingWeeks)}`

  return { system, user }
}

export function extractJSON(raw: string): unknown {
  if (!raw) throw new Error('Empty response')
  const trimmed = raw.trim()
  try { return JSON.parse(trimmed) } catch (_) {}
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) { try { return JSON.parse(fenced[1].trim()) } catch (_) {} }
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)) } catch (_) {}
  }
  throw new Error(`Cannot parse JSON. First 300 chars: ${raw.slice(0, 300)}`)
}
