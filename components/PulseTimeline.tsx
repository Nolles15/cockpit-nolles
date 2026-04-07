'use client'

import { useEffect, useRef, useState } from 'react'
import { startOfDay, endOfDay } from 'date-fns'
import { supabase, CalendarEvent } from '@/lib/supabase'

const START_HOUR = 7
const END_HOUR   = 22
const HOUR_PX    = 64
const TOTAL_PX   = (END_HOUR - START_HOUR) * HOUR_PX  // 960

function minFromStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() - START_HOUR * 60
}

function toPx(minutes: number): number {
  return (minutes / ((END_HOUR - START_HOUR) * 60)) * TOTAL_PX
}

export default function PulseTimeline({ className }: { className?: string }) {
  const [events, setEvents]   = useState<CalendarEvent[]>([])
  const [now, setNow]         = useState(new Date())
  const scrollRef             = useRef<HTMLDivElement>(null)

  async function fetchEvents() {
    const today = new Date()
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', startOfDay(today).toISOString())
      .lte('start_time', endOfDay(today).toISOString())
      .order('start_time')
    setEvents(data ?? [])
  }

  useEffect(() => {
    fetchEvents()

    // Realtime: herteken zodra PowerShell sync iets pusht
    const channel = supabase
      .channel('pulse-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchEvents)
      .subscribe()

    // Klok: elke minuut de huidige-tijdlijn bijwerken
    const timer = setInterval(() => setNow(new Date()), 60_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [])

  // Scroll naar huidige tijd bij eerste render
  useEffect(() => {
    if (!scrollRef.current) return
    const mins = minFromStart(new Date())
    if (mins < 0) return
    const px = toPx(mins) - 100
    scrollRef.current.scrollTop = Math.max(0, px)
  }, [])

  const nowMins    = minFromStart(now)
  const nowVisible = nowMins >= 0 && nowMins <= (END_HOUR - START_HOUR) * 60

  const dateStr = now.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <aside className={className ?? 'w-[264px] shrink-0 border-l border-[#e8e9f2]' + ' bg-white flex flex-col overflow-hidden'}>
      {/* Header */}
      <div className="px-[18px] py-[16px] border-b border-[#e8e9f2] flex items-center shrink-0">
        <span className="text-[14px] font-bold text-[#0f1117]">Pulse</span>
        <div className="ml-auto flex items-center gap-[5px] text-[10px] font-bold text-[#4f46e5] uppercase tracking-[.07em]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#4f46e5] animate-pulse" />
          Live
        </div>
      </div>

      {/* Datum */}
      <div className="px-[18px] py-[9px] border-b border-[#f0f1f8] shrink-0">
        <span className="text-[12px] text-[#6b7080] font-medium capitalize">{dateStr}</span>
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: TOTAL_PX }}>

          {/* Uurlijnen + labels */}
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
            const hour = START_HOUR + i
            return (
              <div key={hour} className="absolute left-0 right-0 flex items-start" style={{ top: i * HOUR_PX }}>
                <span className="w-[38px] shrink-0 text-[10px] text-[#c0c4d4] text-right pr-[8px] leading-none select-none" style={{ marginTop: -6 }}>
                  {String(hour).padStart(2, '0')}
                </span>
                <div className="flex-1 border-t border-[#f0f1f8]" />
              </div>
            )
          })}

          {/* Halfuur-streepjes (subtiel) */}
          {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
            <div key={`h-${i}`} className="absolute left-[38px] right-0 flex items-start border-t border-dashed border-[#f5f6fb]"
              style={{ top: i * HOUR_PX + HOUR_PX / 2 }} />
          ))}

          {/* Huidige tijdlijn */}
          {nowVisible && (
            <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: toPx(nowMins) }}>
              <span className="w-[38px] shrink-0" />
              <div className="w-[7px] h-[7px] rounded-full bg-[#e53e3e] shrink-0 -ml-[3.5px] z-20" />
              <div className="flex-1 border-t-[1.5px] border-[#e53e3e]" />
            </div>
          )}

          {/* Events */}
          {events.map(ev => {
            const start    = new Date(ev.start_time)
            const end      = new Date(ev.end_time)
            const startMin = minFromStart(start)
            const endMin   = minFromStart(end)
            if (endMin < 0 || startMin > (END_HOUR - START_HOUR) * 60) return null

            const topPx    = Math.max(0, toPx(startMin))
            const heightPx = Math.max(20, toPx(endMin) - toPx(startMin))
            const isBlock  = ev.is_timeblock

            return (
              <div
                key={ev.id}
                className={`absolute left-[42px] right-[8px] rounded-[6px] px-[8px] py-[4px] overflow-hidden cursor-default
                  ${isBlock
                    ? 'bg-[#eeeeff] border border-[#a5b4fc]'
                    : 'bg-[#dbeafe] border border-[#93c5fd]'
                  }`}
                style={{ top: topPx, height: heightPx }}
              >
                <p className={`text-[11.5px] font-semibold leading-tight truncate
                  ${isBlock ? 'text-[#4f46e5]' : 'text-[#1d4ed8]'}`}>
                  {ev.title}
                </p>
                {heightPx > 32 && (
                  <p className="text-[10.5px] text-[#6b7080] leading-tight mt-[2px]">
                    {start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {ev.location && heightPx > 52 && (
                  <p className="text-[10px] text-[#b0b5c8] leading-tight mt-[1px] truncate">
                    {ev.location}
                  </p>
                )}
              </div>
            )
          })}

          {/* Lege state */}
          {events.length === 0 && (
            <div className="absolute inset-x-[42px] top-[40px] text-center text-[12px] text-[#c0c4d4] leading-relaxed">
              Geen agenda-items vandaag.
              <br />
              Draai <code className="text-[11px] bg-[#f5f6fb] px-1 rounded">sync_outlook.ps1</code> om Outlook te synchroniseren.
            </div>
          )}

        </div>
      </div>
    </aside>
  )
}
