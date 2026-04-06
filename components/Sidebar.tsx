'use client'

import Link from 'next/link'
import { LayoutGrid, Calendar, Plus, ArrowUpRight } from 'lucide-react'
import { Tag } from '@/lib/supabase'

interface Props {
  tags: Tag[]
  activeView: string
  activeProject: string | null
  onViewChange: (view: string) => void
  onProjectClick: (tagName: string) => void
  onNewTask: () => void
}

export default function Sidebar({ tags, activeView, activeProject, onViewChange, onProjectClick, onNewTask }: Props) {
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
          active={activeView === 'main' && !activeProject}
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
      <div className="mb-6">
        <div className="flex items-center justify-between text-[9.5px] font-bold tracking-[.1em] uppercase text-[#b0b5c8] px-4 pb-[5px]">
          Projecten
          <button className="opacity-45 hover:opacity-100 hover:text-[#4f46e5] transition-opacity cursor-pointer">
            <Plus size={14} />
          </button>
        </div>
        {projects.map(p => (
          <div key={p.id}>
            <button
              onClick={() => onProjectClick(p.name)}
              className={`w-full flex items-center gap-[9px] px-4 py-[7px] text-[13.5px] font-medium transition-colors text-left
                ${activeProject === p.name
                  ? 'text-[#4f46e5] bg-[#eeeeff] font-semibold relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2.5px] before:bg-[#4f46e5] before:rounded-r'
                  : 'text-[#6b7080] hover:bg-[#eeeeff] hover:text-[#4f46e5]'
                }`}
            >
              <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: p.color }} />
              <span className="flex-1 truncate">{p.name}</span>
            </button>
            {activeProject === p.name && (
              <Link
                href={`/projects/${encodeURIComponent(p.name)}`}
                className="flex items-center gap-[5px] ml-[28px] mr-4 mb-[3px] text-[11.5px] text-[#4f46e5] opacity-60 hover:opacity-100 transition-opacity"
              >
                <ArrowUpRight size={11} /> Open projectpagina
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Mensen */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[9.5px] font-bold tracking-[.1em] uppercase text-[#b0b5c8] px-4 pb-[5px]">
          Mensen
          <button className="opacity-45 hover:opacity-100 hover:text-[#4f46e5] transition-opacity cursor-pointer">
            <Plus size={14} />
          </button>
        </div>
        {people.map(p => (
          <div key={p.id} className="flex items-center gap-[9px] px-4 py-[5px] text-[13px] font-medium text-[#6b7080] hover:text-[#0f1117] cursor-pointer">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: p.color + '33', color: p.color }}
            >
              {initials(p.name)}
            </span>
            {p.name}
          </div>
        ))}
      </div>

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
