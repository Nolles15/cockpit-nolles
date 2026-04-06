'use client'

import { useRef, useState } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import FocusZone from './FocusZone'
import PulsePlaceholder from './PulsePlaceholder'
import { Tag, Activity } from '@/lib/supabase'

interface Props {
  tags: Tag[]
  activities: Activity[]
}

export default function DashboardShell({ tags, activities }: Props) {
  const [activeView, setActiveView]       = useState('main')
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const captureRef = useRef<HTMLInputElement>(null)

  function handleProjectClick(tagName: string) {
    setActiveProject(prev => prev === tagName ? null : tagName)
    setActiveView('main')
  }

  function handleViewChange(view: string) {
    setActiveView(view)
    setActiveProject(null)
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
          onNewTask={() => captureRef.current?.focus()}
        />
        <FocusZone
          activities={activities}
          tags={tags}
          activeProject={activeProject}
          captureRef={captureRef}
        />
        <PulsePlaceholder />
      </div>
    </div>
  )
}
