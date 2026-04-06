@AGENTS.md

# Ultra-Flow — Claude Context

## Wat is dit project?
Een desktop + mobile-first productiviteitsdashboard voor persoonlijk gebruik.
Kernprobleem: werk-IT blokkeert externe calendar-syncs, dus een lokale PowerShell
script leest Outlook via COM-object en pusht events naar Supabase.

## Volledig plan
`C:\Users\janco\.claude\plans\goofy-crafting-cat.md`

## Mockups (goedgekeurd design)
- Desktop: `C:\Users\janco\Desktop\ultra-flow-mockup.html`
- Mobile:  `C:\Users\janco\Desktop\ultra-flow-mobile.html`

## Design (gelocked, niet herontwerpen)
- Licht: wit surface, `#f5f6fb` bg, Electric Indigo `#4f46e5` primary
- Geen dark mode, geen Atmosphere/Pomodoro
- Slide-over over de Pulse kolom (niet replace)
- Taken zichtbaar in globale lijst ÉN projectpagina — één bron van waarheid
- Projecten: smart filter (standaard) + volledige projectpagina optioneel
- Projectpagina tabs: Taken | Milestones | Notities (geen Team, geen Voortgang)
- Milestones hebben subtaken; milestone klaar = alle subtaken af
- Drag & drop: vrij tussen secties (datum verandert mee) + naar Pulse
- Mobile: bottom nav + FAB + bottom sheet voor quick capture

## Stack
- Next.js (App Router), TypeScript, Tailwind v4
- Supabase (PostgreSQL + Realtime + Edge Functions)
- dnd-kit (drag & drop)
- chrono-node (NLP datumherkenning in `lib/nlp-parser.ts`)
- date-fns, lucide-react

## Folder structuur
```
ultra-flow/
├── supabase/
│   ├── migrations/001_schema.sql   ← DB schema (nog uitvoeren in Supabase dashboard)
│   └── functions/sync-calendar/    ← Edge Function
├── powershell/
│   ├── sync_outlook.ps1            ← Outlook → Supabase bridge
│   ├── sync_config.json            ← vul URL + key in
│   └── setup_scheduler.ps1         ← Task Scheduler (elke 15 min)
├── app/                            ← Next.js App Router
├── components/                     ← UI componenten
├── lib/                            ← nlp-parser, supabase client, etc.
└── hooks/                          ← useActivities, useCalendarEvents
```

## Dev starten
```bash
cd "C:/Users/janco/OneDrive - Hanze/0. Projecten/ultra-flow"
npm run dev    # → http://localhost:3000
```

## Supabase instellen (eerste keer)
1. Maak project op supabase.com
2. Voer `supabase/migrations/001_schema.sql` uit via SQL Editor
3. Maak `.env.local` aan (zie `.env.example`)
4. `supabase functions deploy sync-calendar`

## Architectuurregels
- Server Actions voor formulieren
- Supabase Realtime voor live calendar (geen polling)
- Sectievolgorde taken: Overdue → Vandaag → Morgen → Deze week → Later
- Overdue = due_date < now() AND status = 'open'
- NLP parser hergebruiken voor desktop capture én mobile sheet
- `"use server"` bestanden: geen sync export functions → helpers in `lib/`
