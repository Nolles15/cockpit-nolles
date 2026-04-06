// Ultra-Flow — Supabase client
// Browser-side client (met anon key)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Types (afgeleid van schema) ───────────────────────────────

export type ActivityType   = 'task' | 'note'
export type ActivityStatus = 'open' | 'completed' | 'archived' | 'horizon'
export type Priority       = 'urgent' | 'high' | 'normal' | 'low'

export interface Activity {
  id:               string
  type:             ActivityType
  content:          string
  due_date:         string | null  // ISO
  project_tags:     string[]
  person_tags:      string[]
  priority:         Priority
  duration_minutes: number
  status:           ActivityStatus
  position:         number | null
  milestone_id:     string | null
  created_at:       string
  updated_at:       string
}

export interface CalendarEvent {
  id:           string
  outlook_id:   string | null
  title:        string
  start_time:   string  // ISO
  end_time:     string
  location:     string | null
  is_timeblock: boolean
  activity_id:  string | null
  created_at:   string
}

export interface Tag {
  id:         string
  name:       string
  tag_type:   'project' | 'person'
  color:      string
  created_at: string
}

export interface Milestone {
  id:          string
  project_tag: string
  name:        string
  due_date:    string | null
  position:    number
  created_at:  string
}

export interface ProjectNote {
  id:          string
  project_tag: string
  content:     string
  updated_at:  string
}

export interface Project {
  id:          string
  tag_name:    string
  description: string | null
  status:      'active' | 'on-hold' | 'completed'
  metadata:    Record<string, unknown>
  created_at:  string
  updated_at:  string
}
