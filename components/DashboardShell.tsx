'use client'

import { useState, useRef } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import PulsePlaceholder from './PulsePlaceholder'
import { Tag } from '@/lib/supabase'

interface Props {
  tags: Tag[]
}

export default function DashboardShell({ tags }: Props) {
  const [activeView, setActiveView]       = useState('main')
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const captureRef = useRef<HTMLInputElement>(null)

  function handleProjectClick(tagName: string) {
    setActiveProject(tagName)
    setActiveView('main')
  }

  function handleViewChange(view: string) {
    setActiveView(view)
    setActiveProject(null)
  }

  function focusCapture() {
    captureRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tags={tags}
          activeView={activeView}
          activeProject={activeProject}
          onViewChange={handleViewChange}
          onProjectClick={handleProjectClick}
          onNewTask={focusCapture}
        />

        {/* FocusZone — placeholder voor Fase 2 */}
        <main className="flex-1 overflow-y-auto bg-[#f5f6fb] min-w-0">
          <div className="sticky top-0 z-5 bg-[#f5f6fb] px-[30px] pt-[18px]">
            <div className="bg-white border border-[#e8e9f2] rounded-[13px] px-[18px] py-[13px] flex items-center gap-[11px] shadow-[0_1px_4px_rgba(0,0,0,.04)] focus-within:border-[#a5b4fc] focus-within:shadow-[0_0_0_3px_rgba(79,70,229,.08),0_2px_8px_rgba(0,0,0,.06)] transition-all">
              <div className="w-[26px] h-[26px] rounded-[7px] bg-[#eeeeff] text-[#4f46e5] flex items-center justify-center text-[18px] font-light shrink-0 leading-none">
                +
              </div>
              <input
                ref={captureRef}
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#0f1117] placeholder:text-[#b0b5c8] caret-[#4f46e5]"
                placeholder="Nieuwe taak… bijv. 'Proposal afmaken morgen 10u #project @naam !!'"
              />
            </div>
          </div>

          <div className="px-[30px] pt-[60px] pb-10 text-[13px] text-[#b0b5c8] text-center">
            Taken komen in Fase 2
          </div>
        </main>

        <PulsePlaceholder />
      </div>
    </div>
  )
}
