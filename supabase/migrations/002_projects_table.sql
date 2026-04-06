-- Fase 3: projectpagina met drie modes (simpel / handmatig / AI-gegenereerd)

-- Helper functie voor updated_at triggers (indien nog niet aanwezig)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name    TEXT NOT NULL UNIQUE REFERENCES tags(name) ON DELETE CASCADE,
  description TEXT,               -- markdown, handmatig of AI-gegenereerd
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'on-hold', 'completed')),
  metadata    JSONB DEFAULT '{}', -- vrij veld: doelen, risico's, stakeholders, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Trigger voor updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime inschakelen
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
