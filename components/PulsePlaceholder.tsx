// Tijdelijke placeholder — wordt Fase 4 vervangen door echte PulseTimeline

export default function PulsePlaceholder() {
  return (
    <aside className="w-[264px] shrink-0 bg-white border-l border-[#e8e9f2] flex flex-col overflow-hidden">
      <div className="px-[18px] py-[18px] border-b border-[#e8e9f2] flex items-center shrink-0">
        <span className="text-[14px] font-bold">Pulse</span>
        <div className="ml-auto flex items-center gap-[5px] text-[10px] font-bold text-[#4f46e5] uppercase tracking-[.07em]">
          <span className="w-[6px] h-[6px] rounded-full bg-[#4f46e5] animate-pulse" />
          Live
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-[13px] text-[#b0b5c8] text-center px-6">
        Agenda-sync komt in Fase 4
      </div>
    </aside>
  )
}
