'use client'

import { useTransition } from 'react'
import { CalendarPlus, Pencil, Trash2, ArrowRight } from 'lucide-react'
import { toggleTask, deleteTask, moveTaskToToday } from '@/app/actions/tasks'
import { Activity } from '@/lib/supabase'
import { format, isToday, isTomorrow, isThisYear } from 'date-fns'
import { nl } from 'date-fns/locale'

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#e53e3e',
  high:   '#d97706',
  normal: 'transparent',
  low:    'transparent',
}

interface Props {
  task: Activity
  isOverdue?: boolean
  tags: Record<string, string> // name → color
}

export default function TaskRow({ task, isOverdue, tags }: Props) {
  const [pending, startTransition] = useTransition()
  const done = task.status === 'completed'

  function formatDue(iso: string) {
    const d = new Date(iso)
    if (isOverdue) return format(d, 'd MMM HH:mm', { locale: nl })
    if (isToday(d)) return format(d, 'HH:mm')
    if (isTomorrow(d)) return 'Morgen'
    if (isThisYear(d)) return format(d, 'EEE d MMM', { locale: nl })
    return format(d, 'd MMM yyyy', { locale: nl })
  }

  return (
    <div className={`group flex items-center gap-3 py-[14px] px-2 border-b border-[#f0f1f8] last:border-none relative transition-colors
      ${isOverdue ? 'bg-[#fff5f5] rounded-[10px] border-none mb-[2px] px-[10px]' : ''}
      ${done ? 'opacity-40' : ''}
      ${pending ? 'opacity-50' : ''}
    `}>
      {/* Drag handle */}
      <span className="text-[14px] text-[#b0b5c8] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 select-none">⠿</span>

      {/* Prioriteitsbalk */}
      <span className="w-[3px] self-stretch rounded-[3px] shrink-0" style={{ background: PRIORITY_COLOR[task.priority] }} />

      {/* Checkbox */}
      <button
        onClick={() => startTransition(() => toggleTask(task.id, task.status))}
        className={`w-[18px] h-[18px] rounded-full border shrink-0 flex items-center justify-center transition-colors cursor-pointer
          ${done ? 'bg-[#4f46e5] border-[#4f46e5] text-white' : isOverdue ? 'border-[#fca5a5]' : 'border-[#e8e9f2] hover:border-[#4f46e5]'}`}
      >
        {done && <span className="text-[10px] font-bold">✓</span>}
      </button>

      {/* Inhoud */}
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] font-medium leading-[1.4] tracking-[-0.05px]
          ${done ? 'line-through text-[#b0b5c8]' : isOverdue ? 'text-[#e53e3e]' : 'text-[#0f1117]'}`}>
          {task.content}
        </div>
        <div className="flex items-center gap-[7px] mt-[3px] flex-wrap">
          {task.project_tags.map(t => (
            <span key={t} className="text-[11.5px] font-medium text-[#4f46e5] flex items-center gap-[3px]">
              <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: tags[t] ?? '#4f46e5' }} />
              #{t}
            </span>
          ))}
          {task.person_tags.map(t => (
            <span key={t} className="text-[11.5px] font-medium text-[#6b7080]">@{t}</span>
          ))}
          {task.type === 'note' && (
            <span className="text-[11px] font-medium text-[#d97706]">📝 Notitie</span>
          )}
        </div>
      </div>

      {/* Rechts */}
      <div className="flex items-center gap-2 shrink-0">
        {task.due_date && (
          <span className={`text-[12.5px] font-medium whitespace-nowrap ${isOverdue ? 'text-[#e53e3e] font-semibold' : 'text-[#b0b5c8]'}`}>
            {formatDue(task.due_date)}
          </span>
        )}
        {task.priority === 'urgent' && !done && (
          <span className="text-[10px] font-bold uppercase tracking-[.04em] text-[#e53e3e]">Urgent</span>
        )}
        {task.priority === 'high' && !done && (
          <span className="text-[10px] font-bold uppercase tracking-[.04em] text-[#d97706]">High</span>
        )}

        {/* Actieknoppen — zichtbaar bij hover */}
        <div className="hidden group-hover:flex items-center gap-[2px]">
          {isOverdue && (
            <ActionBtn title="Verplaats naar vandaag" onClick={() => startTransition(() => moveTaskToToday(task.id))}>
              <ArrowRight size={13} />
            </ActionBtn>
          )}
          <ActionBtn title="Plan in agenda"><CalendarPlus size={13} /></ActionBtn>
          <ActionBtn title="Bewerk"><Pencil size={13} /></ActionBtn>
          <ActionBtn title="Verwijder" onClick={() => startTransition(() => deleteTask(task.id))}>
            <Trash2 size={13} />
          </ActionBtn>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ children, title, onClick }: { children: React.ReactNode, title: string, onClick?: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[#b0b5c8] hover:bg-[#eeeeff] hover:text-[#4f46e5] transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}
