'use client'

import { useRef, useState, useTransition } from 'react'
import { parseInput } from '@/lib/nlp-parser'
import { createTask } from '@/app/actions/tasks'

interface Props {
  inputRef?: React.RefObject<HTMLInputElement | null>
  defaultProjectTag?: string
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#e53e3e',
  high:   '#d97706',
  normal: '#4f46e5',
  low:    '#b0b5c8',
}

export default function QuickCapture({ inputRef, defaultProjectTag }: Props) {
  const localRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? localRef
  const [chips, setChips] = useState<ReturnType<typeof parseInput> | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(val: string) {
    if (val.trim().length < 2) { setChips(null); return }
    setChips(parseInput(val))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const val = ref.current?.value.trim()
      if (!val) return
      const input = defaultProjectTag && !val.includes('#')
        ? `${val} #${defaultProjectTag}`
        : val
      startTransition(async () => {
        await createTask(input)
        if (ref.current) ref.current.value = ''
        setChips(null)
      })
    }
    if (e.key === 'Escape') ref.current?.blur()
  }

  return (
    <div className="sticky top-0 z-10 bg-[#f5f6fb] px-[30px] pt-[18px] pb-2">
      <div className="bg-white border border-[#e8e9f2] rounded-[13px] px-[18px] py-[13px] flex items-center gap-[11px] shadow-[0_1px_4px_rgba(0,0,0,.04)] focus-within:border-[#a5b4fc] focus-within:shadow-[0_0_0_3px_rgba(79,70,229,.08)] transition-all">
        <div className="w-[26px] h-[26px] rounded-[7px] bg-[#eeeeff] text-[#4f46e5] flex items-center justify-center text-[18px] font-light shrink-0 leading-none select-none">
          +
        </div>
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#0f1117] placeholder:text-[#b0b5c8] caret-[#4f46e5]"
          placeholder={`Nieuwe taak… bijv. 'Proposal morgen 10u #project @naam !!'`}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
        />
        {/* Chip preview */}
        {chips && (
          <div className="flex items-center gap-[5px] flex-wrap">
            {chips.priority !== 'normal' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                style={{ color: PRIORITY_COLORS[chips.priority], borderColor: PRIORITY_COLORS[chips.priority] + '44' }}>
                {chips.priority}
              </span>
            )}
            {chips.project_tags.map(t => (
              <span key={t} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eeeeff] text-[#4f46e5]">
                #{t}
              </span>
            ))}
            {chips.person_tags.map(t => (
              <span key={t} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f6fb] text-[#6b7080]">
                @{t}
              </span>
            ))}
            {chips.due_date && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#16a34a]">
                {chips.due_date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
