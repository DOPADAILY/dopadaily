'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  position: number
  color: TaskColor
  created_at: string
  updated_at: string
}

export interface TaskUsage {
  task_count: number
}

// Premium limits
const FREE_TASK_LIMIT = 20
const PREMIUM_TASK_LIMIT = Infinity

/**
 * Get all tasks for the current user
 */
export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Get task usage/count for premium limits
 */
export async function getTaskUsage(): Promise<TaskUsage> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

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

/**
 * Check if user can create more tasks (premium limit check)
 */
export async function checkTaskLimit(): Promise<{ canCreate: boolean; current: number; limit: number; isPremium: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is premium
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.subscription_status === 'active' ||
    profile?.role === 'admin' ||
    profile?.role === 'super_admin'

  const limit = isPremium ? PREMIUM_TASK_LIMIT : FREE_TASK_LIMIT

  // Get current count
  const { data: usage } = await supabase
    .from('task_usage')
    .select('task_count')
    .eq('user_id', user.id)
    .single()

  const current = usage?.task_count || 0

  return {
    canCreate: current < limit,
    current,
    limit: isPremium ? -1 : FREE_TASK_LIMIT, // -1 means unlimited
    isPremium
  }
}

/**
 * Create a new task
 */
export async function createTask(data: {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
  color?: TaskColor
}): Promise<Task> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check task limit
  const limitCheck = await checkTaskLimit()
  if (!limitCheck.canCreate) {
    throw new Error(`Task limit reached (${limitCheck.limit}). Upgrade to premium for unlimited tasks.`)
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      due_date: data.due_date || null,
      color: data.color || 'default'
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/tasks')
  return task
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    due_date: string | null
    color: TaskColor
    position: number
  }>
): Promise<Task> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const updateData: Record<string, unknown> = {}

  if (data.title !== undefined) updateData.title = data.title.trim()
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.status !== undefined) updateData.status = data.status
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.due_date !== undefined) updateData.due_date = data.due_date
  if (data.color !== undefined) updateData.color = data.color
  if (data.position !== undefined) updateData.position = data.position

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/tasks')
  return task
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/tasks')
}

/**
 * Bulk delete completed tasks
 */
export async function clearCompletedTasks(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', user.id)
    .eq('status', 'done')
    .select('id')

  if (error) throw error

  revalidatePath('/tasks')
  return data?.length || 0
}

