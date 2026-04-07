'use client'

import { useRef, useState, useTransition } from 'react'
import { LayoutGrid, Calendar, Plus, X } from 'lucide-react'
import { Tag } from '@/lib/supabase'
import { createTag, deleteTag } from '@/app/actions/projects'

interface Props {
  tags: Tag[]
  activeView: string
  activeProject: string | null
  activePerson: string | null
  onViewChange: (view: string) => void
  onProjectClick: (tagName: string) => void
  onPersonClick: (name: string) => void
  onNewTask: () => void
}

export default function Sidebar({ tags, activeView, activeProject, activePerson, onViewChange, onProjectClick, onPersonClick, onNewTask }: Props) {
  const projects = tags.filter(t => t.tag_type === 'project')
  const people   = tags.filter(t => t.tag_type === 'person')

  function initials(name: string) {
    return name.split(/[\s-]/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className="w-[208px] shrink-0 bg-white border-r border-[#e8e9f2] flex flex-col z-20 pt-[18px] overflow-y-auto">

      {/* Navigatie */}
      <div className="mb-6">
        <NavItem
          icon={<LayoutGrid size={14} />}
          label="Overzicht"
          active={activeView === 'main' && !activeProject && !activePerson}
          onClick={() => onViewChange('main')}
        />
        <NavItem
          icon={<Calendar size={14} />}
          label="Chronos"
          active={activeView === 'chronos'}
          onClick={() => onViewChange('chronos')}
        />
      </div>

      {/* Projecten */}
      <TagSection
        label="Projecten"
        type="project"
        onAdded={() => {}}
      >
        {projects.map(p => (
          <TagItem
            key={p.id}
            isActive={activeProject === p.name}
            onClick={() => onProjectClick(p.name)}
            onDelete={() => deleteTag(p.name)}
            left={<span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: p.color }} />}
            label={p.name}
          />
        ))}
      </TagSection>

      {/* Mensen */}
      <TagSection
        label="Mensen"
        type="person"
        onAdded={() => {}}
      >
        {people.map(p => (
          <TagItem
            key={p.id}
            isActive={activePerson === p.name}
            onClick={() => onPersonClick(p.name)}
            onDelete={() => deleteTag(p.name)}
            left={
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: p.color + '33', color: p.color }}
              >
                {initials(p.name)}
              </span>
            }
            label={p.name}
          />
        ))}
      </TagSection>

      <div className="flex-1" />

      {/* CTA */}
      <div className="mx-[13px] mb-4">
        <button
          onClick={onNewTask}
          className="w-full bg-[#4f46e5] hover:brightness-110 text-white rounded-[10px] py-[10px] text-[13px] font-semibold cursor-pointer shadow-[0_2px_12px_rgba(79,70,229,.22)] transition-all"
        >
          + Nieuwe taak
        </button>
      </div>
    </aside>
  )
}

// ── TagSection ────────────────────────────────────────────────
function TagSection({ label, type, children, onAdded }: {
  label: string
  type: 'project' | 'person'
  children: React.ReactNode
  onAdded: () => void
}) {
  const [adding, setAdding]       = useState(false)
  const [value, setValue]         = useState('')
  const [isPending, startTrans]   = useTransition()
  const inputRef                  = useRef<HTMLInputElement>(null)

  function handleAdd() {
    if (!value.trim()) { setAdding(false); return }
    startTrans(async () => {
      await createTag(value.trim(), type)
      setValue('')
      setAdding(false)
      onAdded()
    })
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-[9.5px] font-bold tracking-[.1em] uppercase text-[#b0b5c8] px-4 pb-[5px]">
        {label}
        <button
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="opacity-45 hover:opacity-100 hover:text-[#4f46e5] transition-opacity cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </div>

      {children}

      {/* Inline add */}
      {adding && (
        <div className="flex items-center gap-2 px-4 py-[6px]">
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={isPending}
            placeholder={type === 'project' ? 'Projectnaam…' : 'Naam…'}
            className="flex-1 min-w-0 bg-[#f5f6fb] border border-[#e8e9f2] rounded-[7px] px-2 py-1 text-[12.5px] outline-none focus:border-[#4f46e5]"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setValue('') } }}
            onBlur={() => { if (!value.trim()) setAdding(false) }}
          />
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="text-[#4f46e5] text-[11px] font-semibold shrink-0 disabled:opacity-40"
          >
            {isPending ? '…' : 'OK'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── TagItem ───────────────────────────────────────────────────
function TagItem({ isActive, onClick, onDelete, left, label }: {
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  left: React.ReactNode
  label: string
}) {
  const [isPending, startTrans] = useTransition()

  return (
    <div className={`group relative flex items-center gap-[9px] px-4 py-[7px] text-[13.5px] font-medium transition-colors cursor-pointer
      ${isActive
        ? 'text-[#4f46e5] bg-[#eeeeff] font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2.5px] before:bg-[#4f46e5] before:rounded-r'
        : 'text-[#6b7080] hover:bg-[#eeeeff] hover:text-[#4f46e5]'
      }`}
      onClick={onClick}
    >
      {left}
      <span className="flex-1 truncate capitalize">{label}</span>
      <button
        onClick={e => { e.stopPropagation(); startTrans(() => onDelete()) }}
        disabled={isPending}
        className="opacity-0 group-hover:opacity-100 text-[#b0b5c8] hover:text-[#e53e3e] transition-all shrink-0 disabled:opacity-40"
        title="Verwijder"
      >
        <X size={13} />
      </button>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-[9px] px-4 py-[7px] text-[13.5px] font-medium transition-colors relative text-left
        ${active
          ? 'text-[#4f46e5] bg-[#eeeeff] font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2.5px] before:bg-[#4f46e5] before:rounded-r'
          : 'text-[#6b7080] hover:bg-[#eeeeff] hover:text-[#4f46e5]'
        }`}
    >
      <span className="w-4 text-center shrink-0">{icon}</span>
      {label}
    </button>
  )
}
