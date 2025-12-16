'use client'

import { format, isPast, isToday } from 'date-fns'
import { Calendar, MoreVertical, Trash2, Edit2, Clock } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Task, TaskPriority, TaskColor } from '@/hooks/queries/useTasks'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  low: { label: 'Low', class: 'bg-on-surface-secondary/10 text-on-surface-secondary' },
  medium: { label: 'Medium', class: 'bg-warning/10 text-warning' },
  high: { label: 'High', class: 'bg-error/10 text-error' },
}

const colorConfig: Record<TaskColor, string> = {
  default: 'border-l-border',
  red: 'border-l-error',
  orange: 'border-l-warning',
  yellow: 'border-l-yellow-500',
  green: 'border-l-success',
  blue: 'border-l-primary',
  purple: 'border-l-purple-500',
  pink: 'border-l-pink-500',
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
  const isDueToday = task.due_date && isToday(new Date(task.due_date))

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  return (
    <div
      onClick={() => onEdit(task)}
      className={`
        group relative bg-surface border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer
        border-l-4 ${colorConfig[task.color]}
      `}
    >
      {/* Content */}
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={`font-medium text-sm leading-snug text-on-surface ${task.status === 'done' ? 'line-through text-on-surface-secondary' : ''}`}>
            {task.title}
          </h4>

          {/* Menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-backplate transition-all"
            >
              <MoreVertical size={16} className="text-on-surface-secondary" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(task)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-backplate transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(task.id)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-on-surface-secondary mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityConfig[task.priority].class}`}>
            {priorityConfig[task.priority].label}
          </span>

          {/* Due Date */}
          {task.due_date && (
            <span className={`
              text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5
              ${isOverdue ? 'bg-error/10 text-error' : isDueToday ? 'bg-warning/10 text-warning' : 'bg-on-surface-secondary/10 text-on-surface-secondary'}
            `}>
              {isOverdue ? <Clock size={10} /> : <Calendar size={10} />}
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
