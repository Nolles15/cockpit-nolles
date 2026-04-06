'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Activity, Milestone, Project, ProjectNote } from '@/lib/supabase'
import TaskRow from './TaskRow'
import QuickCapture from './QuickCapture'
import { addMilestone, deleteMilestone, addNote, deleteNote } from '@/app/actions/projects'

type Tab = 'taken' | 'milestones' | 'notities'

interface Props {
  tag:        string
  tagColor:   string
  project:    Project | null
  activities: Activity[]
  milestones: Milestone[]
  notes:      ProjectNote[]
}

export default function ProjectPage({ tag, tagColor, project, activities, milestones, notes }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('taken')

  const tagColors = { [tag]: tagColor }
  const open = activities.filter(a => a.status === 'open' || a.status === 'horizon')
  const done = activities.filter(a => a.status === 'completed')

  return (
    <div className="min-h-screen bg-[#f5f6fb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e9f2] px-8 pt-5 pb-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[#b0b5c8] hover:text-[#4f46e5] mb-4 transition-colors"
        >
          <ArrowLeft size={13} /> Terug naar overzicht
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: tagColor }} />
          <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[#0f1117]">#{tag}</h1>
          {project?.status && project.status !== 'active' && (
            <span className="text-[11px] font-semibold px-2 py-[2px] rounded-full bg-[#eeeeff] text-[#4f46e5]">
              {project.status}
            </span>
          )}
        </div>

        {project?.description && (
          <p className="text-[13.5px] text-[#6b7080] mb-4 max-w-[520px] leading-[1.5]">
            {project.description}
          </p>
        )}

        {/* Tabs */}
        <div className="flex">
          {(['taken', 'milestones', 'notities'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-[11px] text-[13.5px] font-medium border-b-2 transition-colors
                ${activeTab === tab
                  ? 'border-[#4f46e5] text-[#4f46e5]'
                  : 'border-transparent text-[#6b7080] hover:text-[#0f1117]'}`}
            >
              {tab === 'taken'
                ? `Taken (${open.length})`
                : tab === 'milestones'
                  ? `Milestones (${milestones.length})`
                  : 'Notities'}
            </button>
          ))}
        </div>
      </div>

      {/* Taken tab */}
      {activeTab === 'taken' && (
        <div>
          <QuickCapture defaultProjectTag={tag} />
          <div className="px-8 pb-10">
            {open.length === 0 && done.length === 0 && (
              <p className="text-center text-[#b0b5c8] text-[13px] pt-12">
                Geen taken — typ hierboven om te beginnen
              </p>
            )}
            {open.length > 0 && (
              <Section title={`Open (${open.length})`}>
                {open.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
              </Section>
            )}
            {done.length > 0 && (
              <Section title={`Gedaan (${done.length})`} dim>
                {done.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
              </Section>
            )}
          </div>
        </div>
      )}

      {/* Milestones tab */}
      {activeTab === 'milestones' && (
        <div className="px-8 py-6 max-w-[680px]">
          <MilestonesTab milestones={milestones} activities={activities} tag={tag} tagColors={tagColors} />
        </div>
      )}

      {/* Notities tab */}
      {activeTab === 'notities' && (
        <div className="px-8 py-6 max-w-[680px]">
          <NotitiesTab notes={notes} tag={tag} />
        </div>
      )}
    </div>
  )
}

function Section({ title, dim, children }: { title: string; dim?: boolean; children: React.ReactNode }) {
  return (
    <div className="pt-5">
      <div className="flex items-baseline pb-3 border-b border-[#e8e9f2]">
        <span className={`text-[15px] font-bold ${dim ? 'text-[#b0b5c8]' : 'text-[#0f1117]'}`}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Milestones ──────────────────────────────────────────────────────────────

function MilestonesTab({ milestones, activities, tag, tagColors }: {
  milestones: Milestone[]
  activities: Activity[]
  tag: string
  tagColors: Record<string, string>
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adding, setAdding]     = useState(false)
  const [name, setName]         = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!name.trim()) return
    startTransition(async () => {
      await addMilestone(tag, name.trim())
      setName('')
      setAdding(false)
    })
  }

  return (
    <div>
      {milestones.length === 0 && !adding && (
        <p className="text-[13px] text-[#b0b5c8] py-4">Nog geen milestones</p>
      )}

      <div className="space-y-2">
        {milestones.map(m => {
          const subtasks  = activities.filter(a => a.milestone_id === m.id)
          const doneCount = subtasks.filter(a => a.status === 'completed').length
          const isDone    = subtasks.length > 0 && doneCount === subtasks.length
          const isOpen    = expanded === m.id

          return (
            <div key={m.id} className={`bg-white rounded-[12px] border ${isDone ? 'border-[#bbf7d0]' : 'border-[#e8e9f2]'}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : m.id)}
                className="w-full flex items-center gap-3 px-4 py-[13px] text-left"
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isDone ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#e8e9f2]'}`}>
                  {isDone && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-[14px] font-semibold ${isDone ? 'line-through text-[#b0b5c8]' : 'text-[#0f1117]'}`}>
                  {m.name}
                </span>
                {subtasks.length > 0 && (
                  <span className="text-[12px] text-[#b0b5c8]">{doneCount}/{subtasks.length}</span>
                )}
                {m.due_date && (
                  <span className="text-[12px] text-[#b0b5c8]">
                    {new Date(m.due_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); startTransition(() => deleteMilestone(m.id, tag)) }}
                  className="text-[11.5px] text-[#b0b5c8] hover:text-[#e53e3e] transition-colors ml-1"
                >
                  ×
                </button>
                {isOpen
                  ? <ChevronDown size={14} className="text-[#b0b5c8] shrink-0" />
                  : <ChevronRight size={14} className="text-[#b0b5c8] shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="border-t border-[#f0f1f8] px-4 py-2">
                  {subtasks.length === 0 && (
                    <p className="text-[12.5px] text-[#b0b5c8] py-2">
                      Geen subtaken — voeg ze toe via de Taken-tab
                    </p>
                  )}
                  {subtasks.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {adding ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') { setAdding(false); setName('') }
            }}
            disabled={pending}
            className="flex-1 border border-[#e8e9f2] focus:border-[#a5b4fc] rounded-[10px] px-4 py-[10px] text-[14px] outline-none"
            placeholder="Milestone naam…"
          />
          <button
            onClick={submit}
            disabled={pending}
            className="bg-[#4f46e5] text-white rounded-[10px] px-4 py-[10px] text-[13px] font-semibold cursor-pointer"
          >
            Toevoegen
          </button>
          <button
            onClick={() => { setAdding(false); setName('') }}
            className="text-[#b0b5c8] px-3 py-[10px] text-[13px] cursor-pointer"
          >
            Annuleer
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-2 text-[13px] text-[#b0b5c8] hover:text-[#4f46e5] transition-colors cursor-pointer"
        >
          <Plus size={14} /> Milestone toevoegen
        </button>
      )}
    </div>
  )
}

// ── Notities ────────────────────────────────────────────────────────────────

function NotitiesTab({ notes, tag }: { notes: ProjectNote[]; tag: string }) {
  const [adding, setAdding] = useState(false)
  const [content, setContent] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!content.trim()) return
    startTransition(async () => {
      await addNote(tag, content.trim())
      setContent('')
      setAdding(false)
    })
  }

  return (
    <div>
      {notes.length === 0 && !adding && (
        <p className="text-[13px] text-[#b0b5c8] py-4">Nog geen notities</p>
      )}

      <div className="space-y-3">
        {notes.map(n => (
          <div key={n.id} className="bg-white rounded-[12px] border border-[#e8e9f2] p-4">
            <p className="text-[14px] text-[#0f1117] leading-[1.6] whitespace-pre-wrap">{n.content}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11.5px] text-[#b0b5c8]">
                {new Date(n.updated_at).toLocaleDateString('nl-NL', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </span>
              <button
                onClick={() => startTransition(() => deleteNote(n.id, tag))}
                className="text-[12px] text-[#b0b5c8] hover:text-[#e53e3e] transition-colors cursor-pointer"
              >
                Verwijder
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="mt-4">
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={pending}
            className="w-full border border-[#e8e9f2] focus:border-[#a5b4fc] rounded-[12px] px-4 py-3 text-[14px] outline-none resize-none h-[120px] bg-white"
            placeholder="Notitie…"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={submit}
              disabled={pending}
              className="bg-[#4f46e5] text-white rounded-[10px] px-4 py-[9px] text-[13px] font-semibold cursor-pointer"
            >
              Opslaan
            </button>
            <button
              onClick={() => { setAdding(false); setContent('') }}
              className="text-[#b0b5c8] px-3 py-[9px] text-[13px] cursor-pointer"
            >
              Annuleer
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-2 text-[13px] text-[#b0b5c8] hover:text-[#4f46e5] transition-colors cursor-pointer"
        >
          <Plus size={14} /> Notitie toevoegen
        </button>
      )}
    </div>
  )
}
