'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskRow from './TaskRow'
import { Activity } from '@/lib/supabase'

interface Props {
  task: Activity
  isOverdue?: boolean
  tags: Record<string, string>
}

export default function SortableTaskRow({ task, isOverdue, tags }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex:  isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskRow task={task} isOverdue={isOverdue} tags={tags} />
    </div>
  )
}
