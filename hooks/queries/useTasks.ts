'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import {
  createTask,
  updateTask,
  deleteTask,
  clearCompletedTasks,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type TaskColor
} from '@/app/tasks/actions'

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  list: () => [...taskKeys.all, 'list'] as const,
  usage: () => [...taskKeys.all, 'usage'] as const,
  limit: () => [...taskKeys.all, 'limit'] as const,
}

// Fetch tasks using Supabase client (GET request)
async function fetchTasks(): Promise<Task[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

// Fetch task usage using Supabase client (GET request)
async function fetchTaskUsage(): Promise<{ task_count: number }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('task_usage')
    .select('task_count')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return { task_count: data?.task_count || 0 }
}

// Check task limit using Supabase client (GET request)
async function fetchTaskLimit(): Promise<{ canCreate: boolean; current: number; limit: number; isPremium: boolean }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const FREE_TASK_LIMIT = 20

  // Check if user is premium
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.subscription_status === 'active' ||
    profile?.role === 'admin' ||
    profile?.role === 'super_admin'

  // Get current count
  const { data: usage } = await supabase
    .from('task_usage')
    .select('task_count')
    .eq('user_id', user.id)
    .single()

  const current = usage?.task_count || 0
  const limit = isPremium ? Infinity : FREE_TASK_LIMIT

  return {
    canCreate: current < limit,
    current,
    limit: isPremium ? -1 : FREE_TASK_LIMIT, // -1 means unlimited
    isPremium
  }
}

/**
 * Hook to fetch all tasks
 */
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: fetchTasks,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to get tasks grouped by status (for Kanban board)
 */
export function useTasksByStatus() {
  const query = useTasks()

  const grouped = {
    todo: [] as Task[],
    in_progress: [] as Task[],
    done: [] as Task[],
  }

  if (query.data) {
    for (const task of query.data) {
      grouped[task.status].push(task)
    }
    // Sort by position within each column
    grouped.todo.sort((a, b) => a.position - b.position)
    grouped.in_progress.sort((a, b) => a.position - b.position)
    grouped.done.sort((a, b) => a.position - b.position)
  }

  return {
    ...query,
    grouped,
  }
}

/**
 * Hook to get task usage
 */
export function useTaskUsage() {
  return useQuery({
    queryKey: taskKeys.usage(),
    queryFn: fetchTaskUsage,
  })
}

/**
 * Hook to check task limit
 */
export function useTaskLimit() {
  return useQuery({
    queryKey: taskKeys.limit(),
    queryFn: fetchTaskLimit,
  })
}

/**
 * Hook to create a task with optimistic updates
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list() })

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list())

      // Optimistic task
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        user_id: '',
        title: newTask.title,
        description: newTask.description || null,
        status: newTask.status || 'todo',
        priority: newTask.priority || 'medium',
        due_date: newTask.due_date || null,
        position: 0,
        color: newTask.color || 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Task[]>(taskKeys.list(), (old = []) => [
        optimisticTask,
        ...old,
      ])

      return { previousTasks }
    },
    onError: (_, __, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() })
      queryClient.invalidateQueries({ queryKey: taskKeys.usage() })
      queryClient.invalidateQueries({ queryKey: taskKeys.limit() })
    },
  })
}

/**
 * Hook to update a task with optimistic updates
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Parameters<typeof updateTask>[1] }) =>
      updateTask(taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list() })

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list())

      queryClient.setQueryData<Task[]>(taskKeys.list(), (old = []) =>
        old.map((task) =>
          task.id === taskId
            ? { ...task, ...data, updated_at: new Date().toISOString() }
            : task
        )
      )

      return { previousTasks }
    },
    onError: (_, __, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() })
    },
  })
}

/**
 * Hook to delete a task with optimistic updates
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list() })

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list())

      queryClient.setQueryData<Task[]>(taskKeys.list(), (old = []) =>
        old.filter((task) => task.id !== taskId)
      )

      return { previousTasks }
    },
    onError: (_, __, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() })
      queryClient.invalidateQueries({ queryKey: taskKeys.usage() })
      queryClient.invalidateQueries({ queryKey: taskKeys.limit() })
    },
  })
}

/**
 * Hook to clear all completed tasks
 */
export function useClearCompletedTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearCompletedTasks,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list() })

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list())

      queryClient.setQueryData<Task[]>(taskKeys.list(), (old = []) =>
        old.filter((task) => task.status !== 'done')
      )

      return { previousTasks }
    },
    onError: (_, __, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() })
      queryClient.invalidateQueries({ queryKey: taskKeys.usage() })
      queryClient.invalidateQueries({ queryKey: taskKeys.limit() })
    },
  })
}

// Re-export types
export type { Task, TaskStatus, TaskPriority, TaskColor }
