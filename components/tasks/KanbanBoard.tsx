'use client'

import { useState, useCallback, useEffect } from 'react'
import { Loader2, AlertCircle, Trash2, LayoutGrid, Plus, List, Columns } from 'lucide-react'
import KanbanColumn from './KanbanColumn'
import TaskListView from './TaskListView'
import EmptyState from '@/components/EmptyState'
import TaskModal from './TaskModal'
import TaskLimitBanner from './TaskLimitBanner'
import ConfirmModal from '@/components/ConfirmModal'
import Toast from '@/components/Toast'
import {
  useTasksByStatus,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useClearCompletedTasks,
  useTaskLimit,
  type Task,
  type TaskStatus,
} from '@/hooks/queries/useTasks'

const COLUMN_TITLES: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

type ViewMode = 'board' | 'list'

export default function KanbanBoard() {
  const { grouped, isLoading, error } = useTasksByStatus()
  const { data: limitData } = useTaskLimit()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const clearCompleted = useClearCompletedTasks()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<TaskStatus>('todo')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('board')

  // Responsive: Auto-switch to list on mobile
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 768) {
        setViewMode('list')
      }
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  const handleAddTask = useCallback((status: TaskStatus) => {
    setModalStatus(status)
    setEditingTask(null)
    setIsModalOpen(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setModalStatus(task.status)
    setIsModalOpen(true)
  }, [])

  const handleDeleteTask = useCallback((taskId: string) => {
    setDeleteTaskId(taskId)
  }, [])

  const handleMoveTask = useCallback((task: Task, newStatus: TaskStatus) => {
    updateTask.mutate(
      { taskId: task.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          setToast({ message: `Moved to ${COLUMN_TITLES[newStatus]}`, type: 'success' })
        },
        onError: () => {
          setToast({ message: 'Failed to move task', type: 'error' })
        },
      }
    )
  }, [updateTask])

  const confirmDelete = useCallback(() => {
    if (deleteTaskId) {
      deleteTask.mutate(deleteTaskId, {
        onSuccess: () => {
          setToast({ message: 'Task deleted', type: 'success' })
          setDeleteTaskId(null)
        },
        onError: () => {
          setToast({ message: 'Failed to delete task', type: 'error' })
        },
      })
    }
  }, [deleteTaskId, deleteTask])

  const handleSaveTask = useCallback(
    async (data: Parameters<typeof createTask.mutate>[0]) => {
      if (editingTask) {
        updateTask.mutate(
          { taskId: editingTask.id, data },
          {
            onSuccess: () => {
              setIsModalOpen(false)
              setEditingTask(null)
              setToast({ message: 'Task updated!', type: 'success' })
            },
            onError: (err) => {
              setToast({ message: err.message || 'Failed to update task', type: 'error' })
            },
          }
        )
      } else {
        createTask.mutate(
          { ...data, status: data.status || modalStatus },
          {
            onSuccess: () => {
              setIsModalOpen(false)
              setToast({ message: 'Task created!', type: 'success' })
            },
            onError: (err) => {
              setToast({ message: err.message || 'Failed to create task', type: 'error' })
            },
          }
        )
      }
    },
    [editingTask, modalStatus, createTask, updateTask]
  )

  const handleClearCompleted = useCallback(() => {
    clearCompleted.mutate(undefined, {
      onSuccess: (count) => {
        setToast({ message: `Cleared ${count} completed task${count !== 1 ? 's' : ''}`, type: 'success' })
      },
      onError: () => {
        setToast({ message: 'Failed to clear tasks', type: 'error' })
      },
    })
  }, [clearCompleted])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-error">
        <AlertCircle size={24} className="mr-2" />
        Failed to load tasks
      </div>
    )
  }

  const totalTasks = grouped.todo.length + grouped.in_progress.length + grouped.done.length
  const isEmpty = totalTasks === 0

  return (
    <div className="space-y-4">
      {/* Toast */}
      <Toast
        isOpen={!!toast}
        onClose={() => setToast(null)}
        message={toast?.message || ''}
        variant={toast?.type}
      />

      {/* Task Limit Banner */}
      {limitData && !limitData.isPremium && (
        <TaskLimitBanner current={limitData.current} limit={limitData.limit} />
      )}

      {/* Global Empty State */}
      {isEmpty && (
        <EmptyState
          icon={LayoutGrid}
          title="No tasks yet"
          description="Create your first task to get started organizing your work"
          action={
            <button
              onClick={() => handleAddTask('todo')}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Create Task
            </button>
          }
        />
      )}

      {/* Header Actions */}
      {!isEmpty && (
        <div className="flex items-center justify-between gap-4">
          {/* View Toggle - Only show on md+ */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-backplate rounded-lg">
            <button
              onClick={() => setViewMode('board')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${viewMode === 'board' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-secondary hover:text-on-surface'}
              `}
            >
              <Columns size={16} />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${viewMode === 'list' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-secondary hover:text-on-surface'}
              `}
            >
              <List size={16} />
              List
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Add Task (Desktop) */}
            <button
              onClick={() => handleAddTask('todo')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Add Task
            </button>

            {/* Clear Completed */}
            {grouped.done.length > 0 && (
              <button
                onClick={handleClearCompleted}
                disabled={clearCompleted.isPending}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-on-surface-secondary hover:bg-backplate transition-colors disabled:opacity-50 text-sm"
              >
                {clearCompleted.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span className="hidden sm:inline">Clear completed</span>
                <span className="sm:hidden">{grouped.done.length}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Board View */}
      {!isEmpty && viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(COLUMN_TITLES) as TaskStatus[]).map((status) => (
            <KanbanColumn
              key={status}
              id={status}
              title={COLUMN_TITLES[status]}
              tasks={grouped[status]}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isEmpty && viewMode === 'list' && (
        <TaskListView
          tasks={grouped}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
        />
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
        defaultStatus={modalStatus}
        onSave={handleSaveTask}
        isLoading={createTask.isPending || updateTask.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteTask.isPending}
      />
    </div>
  )
}
