'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface Milestone {
  id: number
  title: string
  description: string | null
  session_threshold: number
  badge_icon: string
  badge_color: string
  is_active: boolean
  created_at: string
}

export interface UserAchievement {
  id: number
  user_id: string
  milestone_id: number
  unlocked_at: string
}

export interface AchievementsData {
  milestones: Milestone[]
  unlockedAchievements: UserAchievement[]
  totalSessions: number
  unlockedCount: number
  totalCount: number
  nextMilestone: Milestone | null
}

// Query keys factory
export const achievementKeys = {
  all: ['achievements'] as const,
  data: () => [...achievementKeys.all, 'data'] as const,
}

// Fetch achievements data
async function fetchAchievementsData(): Promise<AchievementsData> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Run all queries in parallel
  const [sessionsResult, milestonesResult, achievementsResult] = await Promise.all([
    supabase.from('focus_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('milestones').select('*').eq('is_active', true).order('session_threshold', { ascending: true }),
    supabase.from('user_achievements').select('*').eq('user_id', user.id)
  ])

  const totalSessions = sessionsResult.count || 0
  const milestones = milestonesResult.data || []
  const unlockedAchievements = achievementsResult.data || []

  // Find next milestone to unlock
  const nextMilestone = milestones.find(m => m.session_threshold > totalSessions) || null

  return {
    milestones,
    unlockedAchievements,
    totalSessions,
    unlockedCount: unlockedAchievements.length,
    totalCount: milestones.length,
    nextMilestone,
  }
}

// Query hooks
export function useAchievements() {
  return useQuery({
    queryKey: achievementKeys.data(),
    queryFn: fetchAchievementsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

