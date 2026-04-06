'use client'

import { Search, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function Topbar() {
  const [syncing, setSyncing] = useState(false)

  function handleSync() {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 1500)
  }

  return (
    <header className="h-[52px] bg-white border-b border-[#e8e9f2] flex items-center px-[22px] gap-[18px] shrink-0 z-50">
      {/* Logo */}
      <div>
        <div className="text-[15px] font-extrabold text-[#4f46e5] tracking-tight leading-none">
          Cockpit Nolles
        </div>
        <span className="text-[9px] font-medium tracking-[.12em] uppercase text-[#b0b5c8] block mt-[-1px]">
          Persoonlijk dashboard
        </span>
      </div>

      {/* Zoekbalk */}
      <div className="flex-1 max-w-[360px] mx-auto flex items-center gap-[7px] bg-[#f5f6fb] border border-[#e8e9f2] rounded-[9px] px-[13px] py-[7px] text-[13px] text-[#b0b5c8]">
        <Search size={14} className="shrink-0" />
        <span>Zoek taken, projecten, mensen…</span>
      </div>

      {/* Rechts */}
      <div className="ml-auto flex items-center gap-2">
        {/* Sync-status */}
        <div className="flex items-center gap-[5px] text-[11.5px] text-[#b0b5c8] font-medium bg-[#f5f6fb] border border-[#e8e9f2] rounded-full px-[10px] py-1">
          <span className="w-[6px] h-[6px] rounded-full bg-[#16a34a] shrink-0" />
          Synced
        </div>

        {/* Sync knop */}
        <button
          onClick={handleSync}
          className="flex items-center gap-[5px] text-[11.5px] text-[#b0b5c8] font-medium bg-[#f5f6fb] border border-[#e8e9f2] rounded-full px-[10px] py-1 hover:text-[#4f46e5] hover:border-[#a5b4fc] transition-colors cursor-pointer"
          title="Synchroniseer nu"
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-[8px] bg-[#4f46e5] text-white flex items-center justify-center text-[12px] font-bold cursor-pointer">
          J
        </div>
      </div>
    </header>
  )
}
