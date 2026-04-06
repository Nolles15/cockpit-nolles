'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { Plus, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Activity, Milestone, ProjectNote } from '@/lib/supabase'
import TaskRow from './TaskRow'
import QuickCapture from './QuickCapture'
import { addMilestone, deleteMilestone, addNote, deleteNote } from '@/app/actions/projects'

type Tab = 'taken' | 'milestones' | 'notities'

interface Props {
  tag:        string
  tagColor:   string
  activities: Activity[]
  captureRef: React.RefObject<HTMLInputElement | null>
}

export default function ProjectView({ tag, tagColor, activities, captureRef }: Props) {
  const [tab, setTab]             = useState<Tab>('taken')
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [notes, setNotes]         = useState<ProjectNote[]>([])

  useEffect(() => {
    setTab('taken')
    Promise.all([
      supabase.from('milestones').select('*').eq('project_tag', tag).order('position'),
      supabase.from('project_notes').select('*').eq('project_tag', tag).order('updated_at', { ascending: false }),
    ]).then(([{ data: m }, { data: n }]) => {
      setMilestones(m ?? [])
      setNotes(n ?? [])
    })
  }, [tag])

  async function refetchMilestones() {
    const { data } = await supabase.from('milestones').select('*').eq('project_tag', tag).order('position')
    setMilestones(data ?? [])
  }
  async function refetchNotes() {
    const { data } = await supabase.from('project_notes').select('*').eq('project_tag', tag).order('updated_at', { ascending: false })
    setNotes(data ?? [])
  }

  const tagColors = { [tag]: tagColor }
  const open = activities.filter(a => a.status === 'open' || a.status === 'horizon')
  const done = activities.filter(a => a.status === 'completed')

  return (
    <main className="flex-1 overflow-y-auto bg-[#f5f6fb] min-w-0">
      {/* Project header + tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#e8e9f2]">
        <div className="flex items-center gap-[9px] px-[30px] pt-[18px] pb-[3px]">
          <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: tagColor }} />
          <span className="text-[16px] font-bold tracking-[-0.2px] text-[#0f1117]">#{tag}</span>
        </div>
        <div className="flex px-[22px]">
          {(['taken', 'milestones', 'notities'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-[10px] py-[10px] text-[13px] font-medium border-b-2 transition-colors
                ${tab === t ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-[#6b7080] hover:text-[#0f1117]'}`}
            >
              {t === 'taken'
                ? `Taken${open.length > 0 ? ` (${open.length})` : ''}`
                : t === 'milestones'
                  ? `Milestones${milestones.length > 0 ? ` (${milestones.length})` : ''}`
                  : 'Notities'}
            </button>
          ))}
        </div>
      </div>

      {/* Taken */}
      {tab === 'taken' && (
        <div>
          <QuickCapture inputRef={captureRef} defaultProjectTag={tag} />
          <div className="px-[30px] pb-10">
            {open.length === 0 && done.length === 0 && (
              <p className="text-center text-[#b0b5c8] text-[13px] pt-16">
                Geen taken — typ hierboven om te beginnen
              </p>
            )}
            {open.length > 0 && (
              <div className="pt-[22px]">
                <div className="flex items-baseline pb-3 border-b border-[#e8e9f2]">
                  <span className="text-[15px] font-bold text-[#0f1117]">Open ({open.length})</span>
                </div>
                {open.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
              </div>
            )}
            {done.length > 0 && (
              <div className="pt-[22px]">
                <div className="flex items-baseline pb-3 border-b border-[#e8e9f2]">
                  <span className="text-[15px] font-bold text-[#b0b5c8]">Gedaan ({done.length})</span>
                </div>
                {done.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones */}
      {tab === 'milestones' && (
        <div className="px-[30px] py-6 max-w-[640px]">
          <MilestonesTab
            milestones={milestones}
            activities={activities}
            tag={tag}
            tagColors={tagColors}
            onMutate={refetchMilestones}
          />
        </div>
      )}

      {/* Notities */}
      {tab === 'notities' && (
        <div className="px-[30px] py-6 max-w-[640px]">
          <NotitiesTab notes={notes} tag={tag} onMutate={refetchNotes} />
        </div>
      )}
    </main>
  )
}

// ── Milestones ──────────────────────────────────────────────────────────────

function MilestonesTab({ milestones, activities, tag, tagColors, onMutate }: {
  milestones: Milestone[]
  activities: Activity[]
  tag: string
  tagColors: Record<string, string>
  onMutate: () => void
}) {
  const [expanded, setExpanded]    = useState<string | null>(null)
  const [adding, setAdding]        = useState(false)
  const [name, setName]            = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!name.trim()) return
    startTransition(async () => {
      await addMilestone(tag, name.trim())
      setName('')
      setAdding(false)
      onMutate()
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
                  onClick={e => {
                    e.stopPropagation()
                    startTransition(async () => { await deleteMilestone(m.id, tag); onMutate() })
                  }}
                  className="text-[14px] leading-none text-[#b0b5c8] hover:text-[#e53e3e] transition-colors ml-1"
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
                  {subtasks.length === 0
                    ? <p className="text-[12.5px] text-[#b0b5c8] py-2">Geen subtaken — voeg ze toe via de Taken-tab</p>
                    : subtasks.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)
                  }
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
            className="flex-1 border border-[#e8e9f2] focus:border-[#a5b4fc] rounded-[10px] px-4 py-[10px] text-[14px] outline-none bg-white"
            placeholder="Milestone naam…"
          />
          <button onClick={submit} disabled={pending}
            className="bg-[#4f46e5] text-white rounded-[10px] px-4 py-[10px] text-[13px] font-semibold cursor-pointer">
            Toevoegen
          </button>
          <button onClick={() => { setAdding(false); setName('') }}
            className="text-[#b0b5c8] px-3 py-[10px] text-[13px] cursor-pointer">
            Annuleer
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-2 text-[13px] text-[#b0b5c8] hover:text-[#4f46e5] transition-colors cursor-pointer">
          <Plus size={14} /> Milestone toevoegen
        </button>
      )}
    </div>
  )
}

// ── Notities ────────────────────────────────────────────────────────────────

function NotitiesTab({ notes, tag, onMutate }: {
  notes: ProjectNote[]
  tag: string
  onMutate: () => void
}) {
  const [adding, setAdding]        = useState(false)
  const [title, setTitle]          = useState('')
  const [content, setContent]      = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!content.trim()) return
    startTransition(async () => {
      await addNote(tag, content.trim(), title.trim() || undefined)
      setTitle('')
      setContent('')
      setAdding(false)
      onMutate()
    })
  }

  return (
    <div>
      {notes.length === 0 && !adding && (
        <p className="text-[13px] text-[#b0b5c8] py-4">Nog geen notities</p>
      )}

      <div className="space-y-3">
        {notes.map(n => <NoteCard key={n.id} note={n} tag={tag} onMutate={onMutate} />)}
      </div>

      {adding ? (
        <div className="mt-4 bg-white border border-[#a5b4fc] rounded-[12px] p-4 shadow-[0_0_0_3px_rgba(79,70,229,.08)]">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={pending}
            className="w-full text-[14px] font-semibold text-[#0f1117] outline-none mb-2 placeholder:text-[#b0b5c8] placeholder:font-normal"
            placeholder="Titel (optioneel)"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setTitle(''); setContent('') } }}
            disabled={pending}
            className="w-full border-t border-[#f0f1f8] pt-2 text-[13.5px] text-[#0f1117] leading-[1.6] outline-none resize-none h-[100px] bg-transparent placeholder:text-[#b0b5c8]"
            placeholder="Notitie…"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={submit} disabled={pending}
              className="bg-[#4f46e5] text-white rounded-[10px] px-4 py-[8px] text-[13px] font-semibold cursor-pointer">
              Opslaan
            </button>
            <button onClick={() => { setAdding(false); setTitle(''); setContent('') }}
              className="text-[#b0b5c8] px-3 py-[8px] text-[13px] cursor-pointer">
              Annuleer
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-2 text-[13px] text-[#b0b5c8] hover:text-[#4f46e5] transition-colors cursor-pointer">
          <Plus size={14} /> Notitie toevoegen
        </button>
      )}
    </div>
  )
}

function NoteCard({ note, tag, onMutate }: { note: ProjectNote; tag: string; onMutate: () => void }) {
  const isLong = note.content.length > 220 || note.content.split('\n').length > 4
  const [expanded, setExpanded]    = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <div className="bg-white rounded-[12px] border border-[#e8e9f2] p-4">
      {note.title && (
        <p className="text-[13.5px] font-semibold text-[#0f1117] mb-1">{note.title}</p>
      )}
      <p className={`text-[13.5px] text-[#3d404a] leading-[1.6] whitespace-pre-wrap
        ${isLong && !expanded ? 'line-clamp-4' : ''}`}>
        {note.content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(p => !p)}
          className="mt-1 text-[12px] text-[#4f46e5] hover:underline cursor-pointer"
        >
          {expanded ? 'Toon minder ▴' : 'Toon meer ▾'}
        </button>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[11.5px] text-[#b0b5c8]">
          {new Date(note.updated_at).toLocaleDateString('nl-NL', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </span>
        <button
          onClick={() => startTransition(async () => { await deleteNote(note.id, tag); onMutate() })}
          className="text-[12px] text-[#b0b5c8] hover:text-[#e53e3e] transition-colors cursor-pointer"
        >
          Verwijder
        </button>
      </div>
    </div>
  )
}
