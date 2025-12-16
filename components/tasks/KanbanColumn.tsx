'use client'

import { Plus, Circle, Loader2, CheckCircle } from 'lucide-react'
import TaskCard from './TaskCard'
import type { Task, TaskStatus } from '@/hooks/queries/useTasks'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onAddTask: (status: TaskStatus) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

const columnConfig: Record<TaskStatus, {
  icon: React.ReactNode
  headerClass: string
  countClass: string
}> = {
  todo: {
    icon: <Circle size={16} />,
    headerClass: 'text-on-surface-secondary',
    countClass: 'bg-on-surface-secondary/10 text-on-surface-secondary',
  },
  in_progress: {
    icon: <Loader2 size={16} className="animate-spin" />,
    headerClass: 'text-primary',
    countClass: 'bg-primary/10 text-primary',
  },
  done: {
    icon: <CheckCircle size={16} />,
    headerClass: 'text-success',
    countClass: 'bg-success/10 text-success',
  },
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const config = columnConfig[id]

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className={`flex items-center gap-2 ${config.headerClass}`}>
          {config.icon}
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.countClass}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(id)}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors text-on-surface-secondary hover:text-on-surface"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Column Content */}
      <div className="flex-1 bg-backplate/50 rounded-xl p-3 min-h-[300px]">
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-on-surface-secondary/40">
            <div className={`w-10 h-10 rounded-full ${config.countClass} flex items-center justify-center mb-2 opacity-50`}>
              {config.icon}
            </div>
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}
