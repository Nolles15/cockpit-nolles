'use client'

import { useRef, useState, useTransition } from 'react'
import { startOfDay, endOfDay, addDays, format } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Activity, Tag } from '@/lib/supabase'
import QuickCapture from './QuickCapture'
import TaskRow from './TaskRow'
import SortableTaskRow from './SortableTaskRow'
import ProjectView from './ProjectView'
import { createTask, rescheduleTask, reorderTasks } from '@/app/actions/tasks'
import { Plus } from 'lucide-react'

interface Props {
  activities: Activity[]
  tags: Tag[]
  activeProject: string | null
  captureRef: React.RefObject<HTMLInputElement | null>
}

type SectionKey = 'overdue' | 'today' | 'tomorrow' | 'thisweek' | 'later' | 'completed'

export default function FocusZone({ activities, tags, activeProject, captureRef }: Props) {
  const tagColors = Object.fromEntries(tags.map(t => [t.name, t.color]))
  const [localActivities, setLocalActivities] = useState(activities)
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // Sync prop changes (na server revalidate)
  if (activities !== localActivities && !activeId) {
    setLocalActivities(activities)
  }

  // Project actief → inline project view
  if (activeProject) {
    const tag = tags.find(t => t.name === activeProject)
    const filtered = localActivities.filter(a => a.project_tags.includes(activeProject))
    return (
      <ProjectView
        tag={activeProject}
        tagColor={tag?.color ?? '#4f46e5'}
        activities={filtered}
        captureRef={captureRef}
      />
    )
  }

  const now   = new Date()
  const tod0  = startOfDay(now)
  const tod1  = endOfDay(now)
  const tom0  = startOfDay(addDays(now, 1))
  const tom1  = endOfDay(addDays(now, 1))
  const week1 = endOfDay(addDays(now, 7))

  const open      = localActivities.filter(a => a.status === 'open' || a.status === 'horizon')
  const completed = localActivities.filter(a => a.status === 'completed').slice(0, 5)

  const byDue = (a: Activity) => a.due_date ? new Date(a.due_date).getTime() : Infinity

  const overdue  = open.filter(a => a.due_date && new Date(a.due_date) < tod0).sort((a,b) => byDue(a)-byDue(b))
  const today    = open.filter(a => a.due_date && new Date(a.due_date) >= tod0 && new Date(a.due_date) <= tod1).sort((a,b) => byDue(a)-byDue(b))
  const tomorrow = open.filter(a => a.due_date && new Date(a.due_date) > tod1 && new Date(a.due_date) <= tom1).sort((a,b) => byDue(a)-byDue(b))
  const thisWeek = open.filter(a => a.due_date && new Date(a.due_date) > tom1 && new Date(a.due_date) <= week1).sort((a,b) => byDue(a)-byDue(b))
  const later    = open.filter(a => !a.due_date || new Date(a.due_date) > week1 || a.status === 'horizon')

  const sections: Record<SectionKey, Activity[]> = {
    overdue, today, tomorrow, thisweek: thisWeek, later, completed,
  }

  function findSection(id: string): SectionKey | null {
    for (const [key, items] of Object.entries(sections)) {
      if (items.find(a => a.id === id)) return key as SectionKey
    }
    return null
  }

  // Due date voor een sectie
  function dueDateForSection(section: SectionKey): string | null {
    const d = new Date()
    if (section === 'today')    { d.setHours(23, 59, 0, 0); return d.toISOString() }
    if (section === 'tomorrow') { const t = addDays(d, 1); t.setHours(23, 59, 0, 0); return t.toISOString() }
    if (section === 'thisweek') { const t = addDays(d, 3); t.setHours(23, 59, 0, 0); return t.toISOString() }
    if (section === 'later')    return null
    return null
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const fromSection = findSection(active.id as string)
    const toSection   = findSection(over.id as string)

    if (!fromSection || !toSection) return

    if (fromSection === toSection) {
      // Herordenen binnen sectie
      const items    = sections[fromSection]
      const oldIndex = items.findIndex(a => a.id === active.id)
      const newIndex = items.findIndex(a => a.id === over.id)
      const reordered = arrayMove(items, oldIndex, newIndex)

      // Optimistisch updaten
      setLocalActivities(prev => {
        const others = prev.filter(a => !reordered.find(r => r.id === a.id))
        return [...others, ...reordered]
      })

      // Server: sla posities op
      reorderTasks(reordered.map((a, i) => ({ id: a.id, position: i })))
    } else {
      // Verplaatsen naar andere sectie → due_date aanpassen
      const newDue = dueDateForSection(toSection)
      setLocalActivities(prev =>
        prev.map(a => a.id === active.id ? { ...a, due_date: newDue } : a)
      )
      rescheduleTask(active.id as string, newDue)
    }
  }

  const activeTask = activeId ? localActivities.find(a => a.id === activeId) : null
  const todayStr    = format(now, 'EEEE d MMMM', { locale: nl })
  const tomorrowStr = format(addDays(now, 1), 'EEEE d MMMM', { locale: nl })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main className="flex-1 overflow-y-auto bg-[#f5f6fb] min-w-0">
        <QuickCapture inputRef={captureRef} defaultProjectTag={activeProject ?? undefined} />

        <div className="px-[30px] pb-10">
          {overdue.length > 0 && (
            <Section title="Overdue" titleColor="#e53e3e" sub="te laat" count={overdue.length}>
              <SortableContext items={overdue.map(a => a.id)} strategy={verticalListSortingStrategy}>
                {overdue.map(t => <SortableTaskRow key={t.id} task={t} isOverdue tags={tagColors} />)}
              </SortableContext>
            </Section>
          )}

          <Section title="Vandaag" sub={todayStr} count={today.length}>
            <SortableContext items={today.map(a => a.id)} strategy={verticalListSortingStrategy}>
              {today.map(t => <SortableTaskRow key={t.id} task={t} tags={tagColors} />)}
            </SortableContext>
            <InlineAdd dateHint="vandaag" />
          </Section>

          <Section title="Morgen" sub={tomorrowStr} count={tomorrow.length}>
            <SortableContext items={tomorrow.map(a => a.id)} strategy={verticalListSortingStrategy}>
              {tomorrow.map(t => <SortableTaskRow key={t.id} task={t} tags={tagColors} />)}
            </SortableContext>
            <InlineAdd dateHint="morgen" />
          </Section>

          {thisWeek.length > 0 && (
            <Section title="Deze week" sub="di – zo" count={thisWeek.length}>
              <SortableContext items={thisWeek.map(a => a.id)} strategy={verticalListSortingStrategy}>
                {thisWeek.map(t => <SortableTaskRow key={t.id} task={t} tags={tagColors} />)}
              </SortableContext>
            </Section>
          )}

          {later.length > 0 && (
            <Section title="Later" sub="" count={later.length}>
              <SortableContext items={later.map(a => a.id)} strategy={verticalListSortingStrategy}>
                {later.map(t => <SortableTaskRow key={t.id} task={t} tags={tagColors} />)}
              </SortableContext>
            </Section>
          )}

          {completed.length > 0 && (
            <Section title="Gedaan" sub="" count={completed.length}>
              {completed.map(t => <TaskRow key={t.id} task={t} tags={tagColors} />)}
            </Section>
          )}

          {open.length === 0 && completed.length === 0 && (
            <p className="text-center text-[#b0b5c8] text-[13px] pt-16">
              Geen taken — typ hierboven om te beginnen
            </p>
          )}
        </div>
      </main>

      <DragOverlay>
        {activeTask && (
          <div className="bg-white shadow-xl rounded-[10px] opacity-95 ring-2 ring-[#4f46e5]/20">
            <TaskRow task={activeTask} tags={tagColors} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function Section({ title, titleColor, sub, count, children }: {
  title: string, titleColor?: string, sub: string, count: number, children: React.ReactNode
}) {
  return (
    <div className="pt-[26px]">
      <div className="flex items-baseline gap-[9px] pb-3 border-b border-[#e8e9f2]">
        <span className="text-[16px] font-bold tracking-[-0.2px]" style={{ color: titleColor }}>
          {title}
        </span>
        {sub && <span className="text-[12.5px] text-[#b0b5c8]">{sub}</span>}
        {count > 0 && <span className="ml-auto text-[12px] text-[#b0b5c8]">{count} open</span>}
      </div>
      {children}
    </div>
  )
}

function InlineAdd({ dateHint }: { dateHint: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLInputElement>(null)

  function submit() {
    const val = ref.current?.value.trim()
    if (!val) return
    startTransition(async () => {
      await createTask(`${val} ${dateHint}`)
      if (ref.current) ref.current.value = ''
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => ref.current?.focus(), 50) }}
        className="flex items-center gap-[10px] py-[11px] text-[#b0b5c8] text-[13px] cursor-pointer border-t border-[#f0f1f8] w-full hover:text-[#4f46e5] transition-colors"
      >
        <Plus size={16} className="opacity-50" />
        Taak toevoegen
      </button>
    )
  }

  return (
    <div className="flex items-center gap-[10px] py-[11px] border-t border-[#a5b4fc]">
      <Plus size={16} className="text-[#b0b5c8] opacity-50 shrink-0" />
      <input
        ref={ref}
        autoFocus
        disabled={pending}
        className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-[#0f1117] placeholder:text-[#b0b5c8] caret-[#4f46e5]"
        placeholder="Taaknaam… Enter om op te slaan, Esc om te annuleren"
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        onBlur={() => setOpen(false)}
      />
    </div>
  )
}
