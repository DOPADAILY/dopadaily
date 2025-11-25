'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface FocusSession {
  id: number
  user_id: string
  duration_minutes: number
  completed_at: string
  created_at: string
}

export interface Milestone {
  id: number
  title: string
  description: string | null
  session_threshold: number
  badge_icon: string | null
  badge_color: string | null
  is_active: boolean
}

export interface MilestoneProgress {
  milestone: Milestone | null
  progress: number
  progressPercentage: number
  totalSessions: number
  sessionsToGo: number
}

export interface UserAchievementWithMilestone {
  id: number
  unlocked_at: string
  milestones: Milestone | null
}

export interface DailyTip {
  title: string
  content: string
  category: string | null
}

export interface UserProfile {
  username: string | null
  daily_goal: number
}

export interface DashboardStats {
  profile: UserProfile | null
  todaySessions: FocusSession[]
  todaySessionCount: number
  todayTotalMinutes: number
  weekSessions: FocusSession[]
  weekTotalMinutes: number
  weekSessionCount: number
  streak: number
  userPostsCount: number
  totalPostsCount: number
  milestoneProgress: MilestoneProgress
  recentAchievements: UserAchievementWithMilestone[]
  randomTip: DailyTip | null
}

export interface FocusPageStats {
  profile: {
    username: string | null
    daily_goal: number
    default_focus_duration: number
    default_break_duration: number
  } | null
  todaySessionCount: number
  todayTotalMinutes: number
  weekSessionCount: number
  milestoneProgress: MilestoneProgress
}

// Query keys factory
export const focusKeys = {
  all: ['focus'] as const,
  sessions: () => [...focusKeys.all, 'sessions'] as const,
  today: () => [...focusKeys.sessions(), 'today'] as const,
  week: () => [...focusKeys.sessions(), 'week'] as const,
  stats: () => [...focusKeys.all, 'stats'] as const,
  dashboardStats: () => [...focusKeys.all, 'dashboard'] as const,
  focusPageStats: () => [...focusKeys.all, 'focus-page'] as const,
}

// Calculate date ranges
function getDateRanges() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  return { startOfToday, startOfWeek }
}

// Calculate streak from sessions
function calculateStreak(sessions: { completed_at: string }[]): number {
  if (!sessions || sessions.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sessionDates = new Set(
    sessions.map(s => {
      const date = new Date(s.completed_at)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
  )

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let streak = 0
  let currentDate: Date

  if (sessionDates.has(today.getTime())) {
    currentDate = new Date(today)
    streak = 1
  } else if (sessionDates.has(yesterday.getTime())) {
    currentDate = new Date(yesterday)
    streak = 1
  } else {
    return 0
  }

  currentDate.setDate(currentDate.getDate() - 1)
  while (sessionDates.has(currentDate.getTime())) {
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

// Fetch milestone progress for a user
async function fetchMilestoneProgress(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  sessionCount: number
): Promise<MilestoneProgress> {
  // Get user's unlocked achievements
  const { data: unlockedAchievements } = await supabase
    .from('user_achievements')
    .select('milestone_id')
    .eq('user_id', userId)

  const unlockedIds = new Set(unlockedAchievements?.map(a => a.milestone_id) || [])

  // Get all milestones
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('is_active', true)
    .order('session_threshold', { ascending: true })

  // Find first milestone not yet unlocked
  const nextMilestone = milestones?.find(m => !unlockedIds.has(m.id)) || null

  if (!nextMilestone) {
    return {
      milestone: null,
      progress: 0,
      progressPercentage: 100,
      totalSessions: sessionCount,
      sessionsToGo: 0,
    }
  }

  // Calculate progress toward next milestone
  const previousMilestone = milestones
    ?.filter(m => m.session_threshold < nextMilestone.session_threshold)
    ?.sort((a, b) => b.session_threshold - a.session_threshold)[0]

  const startingPoint = previousMilestone?.session_threshold || 0
  const progressRange = nextMilestone.session_threshold - startingPoint
  const currentProgress = sessionCount - startingPoint
  const progressPercentage = Math.min(100, Math.max(0, (currentProgress / progressRange) * 100))
  const sessionsToGo = Math.max(0, nextMilestone.session_threshold - sessionCount)

  return {
    milestone: nextMilestone,
    progress: currentProgress,
    progressPercentage,
    totalSessions: sessionCount,
    sessionsToGo,
  }
}

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { startOfToday, startOfWeek } = getDateRanges()

  // Fetch all data in parallel
  const [
    profileResult,
    todaySessionsResult,
    weekSessionsResult,
    allSessionsResult,
    userPostsResult,
    totalPostsResult,
    recentAchievementsResult,
    tipsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, daily_goal')
      .eq('id', user.id)
      .single(),
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', startOfToday.toISOString())
      .order('completed_at', { ascending: false }),
    supabase
      .from('focus_sessions')
      .select('duration_minutes', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('completed_at', startOfWeek.toISOString()),
    supabase
      .from('focus_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
    supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('user_achievements')
      .select(`
        id,
        unlocked_at,
        milestones (
          id,
          title,
          description,
          badge_icon,
          badge_color,
          session_threshold
        )
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
      .limit(3),
    supabase
      .from('daily_tips')
      .select('title, content, category')
      .eq('is_active', true),
  ])

  const profile = profileResult.data
  const todaySessions = todaySessionsResult.data || []
  const weekSessions = weekSessionsResult.data || []
  const allSessions = allSessionsResult.data || []
  const recentAchievements = recentAchievementsResult.data || []
  const allTips = tipsResult.data || []

  const todayTotalMinutes = todaySessions.reduce(
    (sum, session) => sum + session.duration_minutes, 0
  )

  const weekTotalMinutes = weekSessions.reduce(
    (sum, session) => sum + session.duration_minutes, 0
  )

  // Get total session count for milestone progress
  const { count: totalSessionCount } = await supabase
    .from('focus_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const milestoneProgress = await fetchMilestoneProgress(supabase, user.id, totalSessionCount || 0)

  // Select a random tip
  const randomTip = allTips.length > 0
    ? allTips[Math.floor(Math.random() * allTips.length)]
    : null

  return {
    profile,
    todaySessions,
    todaySessionCount: todaySessions.length,
    todayTotalMinutes,
    weekSessions: weekSessions as FocusSession[],
    weekTotalMinutes,
    weekSessionCount: weekSessionsResult.count || 0,
    streak: calculateStreak(allSessions),
    userPostsCount: userPostsResult.count || 0,
    totalPostsCount: totalPostsResult.count || 0,
    milestoneProgress,
    recentAchievements: recentAchievements.map((a: any) => ({
      ...a,
      milestones: Array.isArray(a.milestones) ? (a.milestones[0] || null) : a.milestones
    })) as UserAchievementWithMilestone[],
    randomTip,
  }
}

// Fetch focus page stats
async function fetchFocusPageStats(): Promise<FocusPageStats> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { startOfToday, startOfWeek } = getDateRanges()

  // Fetch all data in parallel
  const [profileResult, todayResult, weekResult, totalResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, daily_goal, default_focus_duration, default_break_duration')
      .eq('id', user.id)
      .single(),
    supabase
      .from('focus_sessions')
      .select('duration_minutes', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('completed_at', startOfToday.toISOString()),
    supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('completed_at', startOfWeek.toISOString()),
    supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const todaySessions = todayResult.data || []
  const todayTotalMinutes = todaySessions.reduce(
    (sum, session) => sum + session.duration_minutes, 0
  )

  const milestoneProgress = await fetchMilestoneProgress(supabase, user.id, totalResult.count || 0)

  return {
    profile: profileResult.data,
    todaySessionCount: todayResult.count || 0,
    todayTotalMinutes,
    weekSessionCount: weekResult.count || 0,
    milestoneProgress,
  }
}

// Create focus session
interface CreateSessionInput {
  duration_minutes: number
}

async function createSessionApi(input: CreateSessionInput): Promise<FocusSession> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: user.id,
      duration_minutes: input.duration_minutes,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Query hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: focusKeys.dashboardStats(),
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
    refetchOnWindowFocus: true,
  })
}

export function useFocusPageStats() {
  return useQuery({
    queryKey: focusKeys.focusPageStats(),
    queryFn: fetchFocusPageStats,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// Mutation hooks with optimistic updates
export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSessionApi,
    onMutate: async (newSession) => {
      await queryClient.cancelQueries({ queryKey: focusKeys.dashboardStats() })

      const previousStats = queryClient.getQueryData<DashboardStats>(focusKeys.dashboardStats())

      if (previousStats) {
        // Optimistically update stats
        const optimisticSession: FocusSession = {
          id: Date.now(),
          user_id: 'temp',
          duration_minutes: newSession.duration_minutes,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }

        queryClient.setQueryData<DashboardStats>(focusKeys.dashboardStats(), {
          ...previousStats,
          todaySessions: [optimisticSession, ...previousStats.todaySessions],
          todaySessionCount: previousStats.todaySessionCount + 1,
          todayTotalMinutes: previousStats.todayTotalMinutes + newSession.duration_minutes,
          weekTotalMinutes: previousStats.weekTotalMinutes + newSession.duration_minutes,
        })
      }

      return { previousStats }
    },
    onError: (_err, _newSession, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(focusKeys.dashboardStats(), context.previousStats)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: focusKeys.dashboardStats() })
    },
  })
}


