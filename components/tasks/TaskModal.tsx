'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Loader2, X, Circle, Loader2 as LoaderIcon, CheckCircle } from 'lucide-react'
import Modal from '@/components/Modal'
import Select from '@/components/Select'
import type { Task, TaskPriority, TaskColor, TaskStatus } from '@/hooks/queries/useTasks'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  defaultStatus?: TaskStatus
  onSave: (data: {
    title: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    due_date?: string | null
    color?: TaskColor
  }) => Promise<void>
  isLoading?: boolean
}

const statusOptions = [
  { value: 'todo', label: 'To Do', icon: Circle },
  { value: 'in_progress', label: 'In Progress', icon: LoaderIcon },
  { value: 'done', label: 'Done', icon: CheckCircle },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const colorOptions: { value: TaskColor; label: string; class: string }[] = [
  { value: 'default', label: 'Default', class: 'bg-border' },
  { value: 'red', label: 'Red', class: 'bg-error' },
  { value: 'orange', label: 'Orange', class: 'bg-warning' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'green', label: 'Green', class: 'bg-success' },
  { value: 'blue', label: 'Blue', class: 'bg-primary' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
]

export default function TaskModal({
  isOpen,
  onClose,
  task,
  defaultStatus = 'todo',
  onSave,
  isLoading,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [color, setColor] = useState<TaskColor>('default')
  const [error, setError] = useState('')

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setPriority(task.priority)
      setDueDate(task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '')
      setColor(task.color)
    } else {
      setTitle('')
      setDescription('')
      setStatus(defaultStatus)
      setPriority('medium')
      setDueDate('')
      setColor('default')
    }
    setError('')
  }, [task, isOpen, defaultStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        color,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Create Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface placeholder:text-on-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface placeholder:text-on-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Status
          </label>
          <div className="flex gap-2">
            {statusOptions.map((opt) => {
              const Icon = opt.icon
              const isSelected = status === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value as TaskStatus)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                    ${isSelected
                      ? opt.value === 'todo'
                        ? 'bg-on-surface-secondary/10 border-on-surface-secondary/30 text-on-surface'
                        : opt.value === 'in_progress'
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-success/10 border-success/30 text-success'
                      : 'border-border text-on-surface-secondary hover:bg-backplate'
                    }
                  `}
                >
                  <Icon size={16} className={opt.value === 'in_progress' && isSelected ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(value) => setPriority(value as TaskPriority)}
              options={priorityOptions}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-backplate"
                >
                  <X size={14} className="text-on-surface-secondary" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Color Label
          </label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setColor(opt.value)}
                className={`
                  w-8 h-8 rounded-full transition-all ${opt.class}
                  ${color === opt.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}
                `}
                title={opt.label}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-surface-elevated text-on-surface font-medium hover:bg-backplate transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
