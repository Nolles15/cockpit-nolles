'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckSquare, FolderOpen, Activity, Plus, ChevronLeft } from 'lucide-react'
import { startOfDay, endOfDay, addDays, format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Activity as ActivityType, Tag } from '@/lib/supabase'
import { createTask } from '@/app/actions/tasks'
import { parseInput } from '@/lib/nlp-parser'
import TaskRow from './TaskRow'
import PulseTimeline from './PulseTimeline'

interface Props {
  tags: Tag[]
  activities: ActivityType[]
}

type Tab = 'taken' | 'projecten' | 'pulse'

export default function MobileShell({ tags, activities }: Props) {
  const [activeTab, setActiveTab]         = useState<Tab>('taken')
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [showSheet, setShowSheet]         = useState(false)
  const [input, setInput]                 = useState('')
  const [isPending, startTransition]      = useTransition()
  const inputRef                          = useRef<HTMLInputElement>(null)

  function openSheet() {
    setShowSheet(true)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const raw = input
    startTransition(async () => {
      await createTask(raw)
      setInput('')
      setShowSheet(false)
    })
  }

  // ── Taak-secties ────────────────────────────────────────────
  const now    = new Date()
  const tod0   = startOfDay(now)
  const tod1   = endOfDay(now)
  const tom1   = endOfDay(addDays(now, 1))
  const week1  = endOfDay(addDays(now, 7))
  const byDue  = (a: ActivityType) => a.due_date ? new Date(a.due_date).getTime() : Infinity

  const open      = activities.filter(a => a.status === 'open' || a.status === 'horizon')
  const overdue   = open.filter(a => a.due_date && new Date(a.due_date) < tod0).sort((a,b) => byDue(a)-byDue(b))
  const today     = open.filter(a => a.due_date && new Date(a.due_date) >= tod0 && new Date(a.due_date) <= tod1).sort((a,b) => byDue(a)-byDue(b))
  const tomorrow  = open.filter(a => a.due_date && new Date(a.due_date) > tod1 && new Date(a.due_date) <= tom1).sort((a,b) => byDue(a)-byDue(b))
  const thisWeek  = open.filter(a => a.due_date && new Date(a.due_date) > tom1 && new Date(a.due_date) <= week1).sort((a,b) => byDue(a)-byDue(b))
  const later     = open.filter(a => !a.due_date || new Date(a.due_date) > week1 || a.status === 'horizon')

  const tagColors  = Object.fromEntries(tags.map(t => [t.name, t.color]))
  const projects   = tags.filter(t => t.tag_type === 'project')
  const people     = tags.filter(t => t.tag_type === 'person')

  function initials(name: string) {
    return name.split(/[\s-]/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const headerTitle = activeProject && activeTab === 'projecten'
    ? (activeProject.startsWith('@') ? activeProject.slice(1) : activeProject)
    : activeTab === 'taken' ? 'Taken'
    : activeTab === 'projecten' ? 'Projecten'
    : 'Pulse'

  return (
    <div className="flex flex-col h-screen bg-[#f5f6fb] overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e9f2] px-4 flex items-center h-[52px] shrink-0">
        {activeProject && activeTab === 'projecten' && (
          <button
            onClick={() => setActiveProject(null)}
            className="mr-2 text-[#4f46e5] -ml-1 p-1"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <span className="text-[15px] font-bold text-[#0f1117]">{headerTitle}</span>
        <span className="ml-auto text-[12px] text-[#b0b5c8] capitalize">
          {format(now, 'EEEE d MMM', { locale: nl })}
        </span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Taken ─────────────────────────────────────────── */}
        {activeTab === 'taken' && (
          <div className="px-4 py-3 space-y-5 pb-24">
            {overdue.length > 0 && (
              <MobileSection label="Overdue" color="#e53e3e">
                {overdue.map(t => <TaskRow key={t.id} task={t} isOverdue tags={tagColors} />)}
              </MobileSection>
            )}
            <MobileSection label={`Vandaag · ${format(now, 'EEEE d MMMM', { locale: nl })}`}>
              {today.length > 0
                ? today.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)
                : <p className="text-[13px] text-[#c0c4d4] py-1">Niets gepland vandaag</p>}
            </MobileSection>
            {tomorrow.length > 0 && (
              <MobileSection label={`Morgen · ${format(addDays(now,1), 'EEEE d MMMM', { locale: nl })}`}>
                {tomorrow.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
              </MobileSection>
            )}
            {thisWeek.length > 0 && (
              <MobileSection label="Deze week">
                {thisWeek.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
              </MobileSection>
            )}
            {later.length > 0 && (
              <MobileSection label="Later">
                {later.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
              </MobileSection>
            )}
          </div>
        )}

        {/* ── Projecten + Mensen lijst ─────────────────────── */}
        {activeTab === 'projecten' && !activeProject && (
          <div className="px-4 py-3 space-y-2 pb-24">
            {projects.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#b0b5c8] px-1 pt-1">Projecten</p>
            )}
            {projects.map(p => {
              const count = open.filter(a => a.project_tags.includes(p.name)).length
              return (
                <button
                  key={p.name}
                  onClick={() => setActiveProject(p.name)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] bg-white border border-[#e8e9f2] text-left active:bg-[#f5f6fb]"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-[14px] font-medium flex-1 capitalize">{p.name}</span>
                  {count > 0 && (
                    <span className="text-[12px] text-[#b0b5c8] bg-[#f5f6fb] rounded-full px-2 py-0.5">{count}</span>
                  )}
                </button>
              )
            })}
            {people.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#b0b5c8] px-1 pt-3">Mensen</p>
            )}
            {people.map(p => {
              const count = open.filter(a => a.person_tags.includes(p.name)).length
              return (
                <button
                  key={p.name}
                  onClick={() => setActiveProject(`@${p.name}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] bg-white border border-[#e8e9f2] text-left active:bg-[#f5f6fb]"
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: p.color + '33', color: p.color }}
                  >
                    {initials(p.name)}
                  </span>
                  <span className="text-[14px] font-medium flex-1 capitalize">{p.name}</span>
                  {count > 0 && (
                    <span className="text-[12px] text-[#b0b5c8] bg-[#f5f6fb] rounded-full px-2 py-0.5">{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Project / persoon detail ─────────────────────── */}
        {activeTab === 'projecten' && activeProject && (
          <div className="px-4 py-3 space-y-1 pb-24">
            {(() => {
              const isPerson = activeProject.startsWith('@')
              const key = isPerson ? activeProject.slice(1) : activeProject
              const filtered = isPerson
                ? open.filter(a => a.person_tags.includes(key))
                : open.filter(a => a.project_tags.includes(key))
              return filtered.length > 0
                ? filtered.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)
                : <p className="text-[13px] text-[#c0c4d4] py-4 text-center">Geen open taken</p>
            })()}
          </div>
        )}

        {/* ── Pulse ─────────────────────────────────────────── */}
        {activeTab === 'pulse' && (
          <PulseTimeline className="w-full flex flex-col overflow-hidden bg-white" />
        )}

      </div>

      {/* FAB */}
      <button
        onClick={openSheet}
        className="fixed bottom-[72px] right-4 w-[52px] h-[52px] rounded-full bg-[#4f46e5] text-white shadow-lg shadow-indigo-200 flex items-center justify-center z-30 active:scale-95 transition-transform"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-[#e8e9f2] flex shrink-0">
        {([
          { tab: 'taken',     label: 'Taken',      Icon: CheckSquare },
          { tab: 'projecten', label: 'Projecten',   Icon: FolderOpen  },
          { tab: 'pulse',     label: 'Pulse',       Icon: Activity    },
        ] as const).map(({ tab, label, Icon }) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setActiveProject(null) }}
            className={`flex-1 flex flex-col items-center gap-[3px] py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-[10px] font-medium transition-colors
              ${activeTab === tab ? 'text-[#4f46e5]' : 'text-[#b0b5c8]'}`}
          >
            <Icon size={20} strokeWidth={activeTab === tab ? 2.5 : 1.75} />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom sheet — quick capture */}
      {showSheet && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSheet(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-[20px] px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="w-10 h-1 bg-[#e8e9f2] rounded-full mx-auto mb-4" />
            <p className="text-[13px] font-semibold text-[#0f1117] mb-2.5">Nieuwe taak</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Bijv. rapport afmaken morgen #aero-v2"
                className="flex-1 bg-[#f5f6fb] border border-[#e8e9f2] rounded-[10px] px-3 py-2.5 text-[14px] outline-none focus:border-[#4f46e5] transition-colors"
              />
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="bg-[#4f46e5] text-white rounded-[10px] px-4 py-2.5 text-[13px] font-semibold disabled:opacity-40 transition-opacity"
              >
                {isPending ? '…' : 'Voeg toe'}
              </button>
            </form>
            <p className="text-[11px] text-[#c0c4d4] mt-2">
              Gebruik #project, @persoon, ! voor prioriteit, ~30m voor duur
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function MobileSection({ label, color, children }: {
  label: string
  color?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[.08em] mb-2" style={{ color: color ?? '#6b7080' }}>
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}
