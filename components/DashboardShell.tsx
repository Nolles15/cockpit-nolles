'use client'

import { useRef, useState } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import FocusZone from './FocusZone'
import PulseTimeline from './PulseTimeline'
import MobileShell from './MobileShell'
import { Tag, Activity } from '@/lib/supabase'

interface Props {
  tags: Tag[]
  activities: Activity[]
}

export default function DashboardShell({ tags, activities }: Props) {
  const [activeView, setActiveView]       = useState('main')
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [activePerson, setActivePerson]   = useState<string | null>(null)
  const captureRef = useRef<HTMLInputElement>(null)

  function handleProjectClick(tagName: string) {
    setActiveProject(prev => prev === tagName ? null : tagName)
    setActivePerson(null)
    setActiveView('main')
  }

  function handlePersonClick(name: string) {
    setActivePerson(prev => prev === name ? null : name)
    setActiveProject(null)
    setActiveView('main')
  }

  function handleViewChange(view: string) {
    setActiveView(view)
    setActiveProject(null)
    setActivePerson(null)
  }

  return (
    <>
      {/* ── Mobile (< md) ─────────────────────────────────── */}
      <div className="md:hidden h-screen">
        <MobileShell tags={tags} activities={activities} />
      </div>

      {/* ── Desktop (≥ md) ────────────────────────────────── */}
      <div className="hidden md:flex flex-col h-screen overflow-hidden">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            tags={tags}
            activeView={activeView}
            activeProject={activeProject}
            activePerson={activePerson}
            onViewChange={handleViewChange}
            onProjectClick={handleProjectClick}
            onPersonClick={handlePersonClick}
            onNewTask={() => captureRef.current?.focus()}
          />
          <FocusZone
            activities={activities}
            tags={tags}
            activeProject={activeProject}
            activePerson={activePerson}
            captureRef={captureRef}
          />
          <PulseTimeline />
        </div>
      </div>
    </>
  )
}
