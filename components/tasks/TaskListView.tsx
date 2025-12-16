'use client'

import { useState } from 'react'
import { format, isPast, isToday } from 'date-fns'
import {
  Circle,
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  ChevronRight
} from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/hooks/queries/useTasks'

interface TaskListViewProps {
  tasks: Record<TaskStatus, Task[]>
  onAddTask: (status: TaskStatus) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onMoveTask: (task: Task, newStatus: TaskStatus) => void
}

const statusConfig: Record<TaskStatus, {
  label: string
  icon: React.ReactNode
  bgClass: string
  textClass: string
  borderClass: string
}> = {
  todo: {
    label: 'To Do',
    icon: <Circle size={16} />,
    bgClass: 'bg-on-surface-secondary/10',
    textClass: 'text-on-surface-secondary',
    borderClass: 'border-on-surface-secondary/30',
  },
  in_progress: {
    label: 'In Progress',
    icon: <Loader2 size={16} className="animate-spin" />,
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    borderClass: 'border-primary/30',
  },
  done: {
    label: 'Done',
    icon: <CheckCircle size={16} />,
    bgClass: 'bg-success/10',
    textClass: 'text-success',
    borderClass: 'border-success/30',
  },
}

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  low: { label: 'Low', class: 'bg-on-surface-secondary/10 text-on-surface-secondary' },
  medium: { label: 'Medium', class: 'bg-warning/10 text-warning' },
  high: { label: 'High', class: 'bg-error/10 text-error' },
}

function TaskListItem({
  task,
  onEdit,
  onDelete,
  onMove
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onMove: (task: Task, status: TaskStatus) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
  const isDueToday = task.due_date && isToday(new Date(task.due_date))

  const nextStatus: TaskStatus = task.status === 'todo'
    ? 'in_progress'
    : task.status === 'in_progress'
      ? 'done'
      : 'todo'

  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Quick status toggle */}
        <button
          onClick={() => onMove(task, nextStatus)}
          className={`mt-0.5 flex-shrink-0 ${statusConfig[task.status].textClass}`}
        >
          {task.status === 'done' ? (
            <CheckCircle size={20} className="fill-current" />
          ) : task.status === 'in_progress' ? (
            <Circle size={20} className="fill-primary/20" />
          ) : (
            <Circle size={20} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium text-sm text-on-surface ${task.status === 'done' ? 'line-through text-on-surface-secondary' : ''}`}>
              {task.title}
            </h4>

            {/* Actions Menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-backplate transition-colors"
              >
                <MoreVertical size={16} className="text-on-surface-secondary" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => {
                      setShowMenu(false)
                      setShowMoveMenu(false)
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-20">
                    <button
                      onClick={() => {
                        onEdit(task)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-backplate transition-colors"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMoveMenu(!showMoveMenu)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-on-surface hover:bg-backplate transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronRight size={14} />
                          Move to
                        </span>
                        <ChevronRight size={12} className="text-on-surface-secondary" />
                      </button>
                      {showMoveMenu && (
                        <div className="absolute left-full top-0 ml-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                          {(Object.keys(statusConfig) as TaskStatus[])
                            .filter(s => s !== task.status)
                            .map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  onMove(task, status)
                                  setShowMenu(false)
                                  setShowMoveMenu(false)
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-backplate transition-colors ${statusConfig[status].textClass}`}
                              >
                                {statusConfig[status].icon}
                                {statusConfig[status].label}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => {
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
            <p className="text-xs text-on-surface-secondary mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[task.priority].class}`}>
              {priorityConfig[task.priority].label}
            </span>

            {task.due_date && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1
                ${isOverdue ? 'bg-error/10 text-error' : isDueToday ? 'bg-warning/10 text-warning' : 'bg-on-surface-secondary/10 text-on-surface-secondary'}
              `}>
                {isOverdue ? <Clock size={12} /> : <Calendar size={12} />}
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TaskListView({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveTask
}: TaskListViewProps) {
  const [activeTab, setActiveTab] = useState<TaskStatus>('todo')
  const currentTasks = tasks[activeTab]

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-backplate rounded-xl">
        {(Object.keys(statusConfig) as TaskStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all
              ${activeTab === status
                ? `bg-surface shadow-sm ${statusConfig[status].textClass}`
                : 'text-on-surface-secondary hover:text-on-surface'
              }
            `}
          >
            {statusConfig[status].icon}
            <span className="hidden xs:inline">{statusConfig[status].label}</span>
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full font-medium
              ${activeTab === status ? statusConfig[status].bgClass : 'bg-on-surface-secondary/10'}
            `}>
              {tasks[status].length}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {currentTasks.length === 0 ? (
          <div className="text-center py-12 text-on-surface-secondary">
            <div className={`w-12 h-12 rounded-full ${statusConfig[activeTab].bgClass} flex items-center justify-center mx-auto mb-3`}>
              {statusConfig[activeTab].icon}
            </div>
            <p className="text-sm mb-4">No {statusConfig[activeTab].label.toLowerCase()} tasks</p>
            <button
              onClick={() => onAddTask(activeTab)}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus size={16} />
              Add task
            </button>
          </div>
        ) : (
          currentTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMove={onMoveTask}
            />
          ))
        )}
      </div>

      {/* Bottom spacer for floating button */}
      <div className="h-20 md:hidden" />

      {/* Floating Add Button */}
      <button
        onClick={() => onAddTask(activeTab)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center md:hidden z-30"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}

