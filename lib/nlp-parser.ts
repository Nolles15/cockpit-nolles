// Ultra-Flow — NLP Parser
// Verwerkt raw input string naar een gestructureerde taak
// Gebruikt door: QuickCapture (desktop) + BottomSheet (mobile)

import * as chrono from 'chrono-node'

export type Priority = 'urgent' | 'high' | 'normal' | 'low'
export type ActivityType = 'task' | 'note'

export interface ParsedInput {
  content:         string        // schone tekst (alle tokens gestript)
  due_date:        Date | null
  project_tags:    string[]      // ["brand-identity", "infra"]
  person_tags:     string[]      // ["sophie", "thomas"]
  priority:        Priority
  duration_minutes: number       // voor time blocking op Pulse
  type:            ActivityType
}

export function parseInput(raw: string): ParsedInput {
  let text = raw.trim()

  // ── Type: Note? ──────────────────────────────────────────
  const isNote = /^note:/i.test(text)
  if (isNote) text = text.replace(/^note:\s*/i, '')

  // ── Priority: !! = urgent, ! = high ─────────────────────
  let priority: Priority = 'normal'
  if (text.includes('!!')) {
    priority = 'urgent'
    text = text.replace(/!!/g, '').trim()
  } else if (/(?<!\!)\!(?!\!)/.test(text)) {
    priority = 'high'
    text = text.replace(/(?<!\!)\!(?!\!)/g, '').trim()
  }

  // ── Duration: ~30m of ~2h ────────────────────────────────
  let duration_minutes = 30
  const durMatch = text.match(/~(\d+)(m|h)/i)
  if (durMatch) {
    duration_minutes = durMatch[2].toLowerCase() === 'h'
      ? parseInt(durMatch[1]) * 60
      : parseInt(durMatch[1])
    text = text.replace(durMatch[0], '').trim()
  }

  // ── Project tags: #woord ─────────────────────────────────
  const project_tags: string[] = []
  text = text.replace(/#(\w[\w-]*)/g, (_, tag) => {
    project_tags.push(tag.toLowerCase())
    return ''
  }).trim()

  // ── Person tags: @woord ──────────────────────────────────
  const person_tags: string[] = []
  text = text.replace(/@(\w[\w-]*)/g, (_, person) => {
    person_tags.push(person.toLowerCase())
    return ''
  }).trim()

  // ── Date: chrono-node NLP ────────────────────────────────
  const parsed  = chrono.parse(text, new Date(), { forwardDate: true })
  let due_date: Date | null = null
  if (parsed.length > 0) {
    due_date = parsed[0].date()
    // Strip de datumtekst uit de content
    text = text.slice(0, parsed[0].index) + text.slice(parsed[0].index + parsed[0].text.length)
    text = text.trim()
  }

  // ── Opruimen: meerdere spaties, leestekens ───────────────
  text = text.replace(/\s{2,}/g, ' ').replace(/^[,.\s]+|[,.\s]+$/g, '').trim()

  return {
    content:          text,
    due_date,
    project_tags:     [...new Set(project_tags)],
    person_tags:      [...new Set(person_tags)],
    priority,
    duration_minutes,
    type:             isNote ? 'note' : 'task',
  }
}

// ── Horizon logica ────────────────────────────────────────────
// Taken met due_date > 48u → status 'horizon' (Later sectie)
export function resolveStatus(due_date: Date | null): 'open' | 'horizon' {
  if (!due_date) return 'open'
  const diffMs  = due_date.getTime() - Date.now()
  const diffHrs = diffMs / (1000 * 60 * 60)
  return diffHrs > 48 ? 'horizon' : 'open'
}
