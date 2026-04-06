-- Ultra-Flow Database Schema
-- Uitvoeren via: supabase.com → SQL Editor → New query → Run

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE activity_type   AS ENUM ('task', 'note');
CREATE TYPE activity_status AS ENUM ('open', 'completed', 'archived', 'horizon');
CREATE TYPE priority_level  AS ENUM ('urgent', 'high', 'normal', 'low');

-- ── TAGS ─────────────────────────────────────────────────────
-- Projecten en mensen als aparte entiteit (met kleur)
CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,                           -- "brand-identity", "sophie"
  tag_type   TEXT CHECK (tag_type IN ('project', 'person')) NOT NULL,
  color      TEXT DEFAULT '#4f46e5',                        -- hex kleur voor UI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACTIVITIES (taken + notities) ────────────────────────────
CREATE TABLE activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             activity_type NOT NULL DEFAULT 'task',
  content          TEXT NOT NULL,
  due_date         TIMESTAMPTZ,
  project_tags     TEXT[] DEFAULT '{}',                     -- ["brand-identity", "infra"]
  person_tags      TEXT[] DEFAULT '{}',                     -- ["sophie", "thomas"]
  priority         priority_level DEFAULT 'normal',
  duration_minutes INTEGER DEFAULT 30,                      -- voor time blocking op Pulse
  status           activity_status NOT NULL DEFAULT 'open',
  position         FLOAT,                                   -- fractional index voor volgorde
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── MILESTONES ────────────────────────────────────────────────
CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_tag TEXT NOT NULL,                                -- linkt aan tags.name
  name        TEXT NOT NULL,
  due_date    TIMESTAMPTZ,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── MILESTONE SUBTAKEN ────────────────────────────────────────
-- Subtaken zijn gewone activities met een milestone_id
ALTER TABLE activities ADD COLUMN milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL;

-- ── CALENDAR EVENTS (Outlook + handmatige time blocks) ────────
CREATE TABLE calendar_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlook_id   TEXT UNIQUE,                                 -- NULL voor handmatige blocks
  title        TEXT NOT NULL,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  location     TEXT,
  is_timeblock BOOLEAN DEFAULT FALSE,                       -- TRUE = handmatig gesleept
  activity_id  UUID REFERENCES activities(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROJECT NOTITIES ──────────────────────────────────────────
CREATE TABLE project_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_tag TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_activities_status       ON activities(status);
CREATE INDEX idx_activities_due_date     ON activities(due_date);
CREATE INDEX idx_activities_project_tags ON activities USING GIN(project_tags);
CREATE INDEX idx_activities_person_tags  ON activities USING GIN(person_tags);
CREATE INDEX idx_activities_milestone    ON activities(milestone_id);
CREATE INDEX idx_calendar_start          ON calendar_events(start_time);
CREATE INDEX idx_milestones_project      ON milestones(project_tag);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- Single-user app: alles toegankelijk via anon key
ALTER TABLE activities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes    ENABLE ROW LEVEL SECURITY;

-- Policies: alles toestaan (aanpassen als je auth toevoegt)
CREATE POLICY "allow_all" ON activities      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tags            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON milestones      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON project_notes   FOR ALL USING (true) WITH CHECK (true);

-- ── REALTIME ──────────────────────────────────────────────────
-- Zet Realtime aan voor calendar_events (Pulse auto-refresh na PowerShell sync)
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- ── TRIGGER: updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SEED: voorbeeld tags ─────────────────────────────────────
INSERT INTO tags (name, tag_type, color) VALUES
  ('brand-identity',  'project', '#4f46e5'),
  ('aero-v2',         'project', '#f59e0b'),
  ('research',        'project', '#22c55e'),
  ('infrastructure',  'project', '#3b82f6'),
  ('curriculum',      'project', '#a78bfa'),
  ('sophie',          'person',  '#ec4899'),
  ('thomas',          'person',  '#f59e0b'),
  ('lena',            'person',  '#22c55e');
