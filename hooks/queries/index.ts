// Notes hooks
export {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTogglePin,
  noteKeys,
} from './useNotes'
export type { Note, NoteCategory, NoteColor } from '@/app/notes/actions'

// Reminders hooks
export {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
  reminderKeys,
} from './useReminders'
export type { Reminder } from './useReminders'

// Forum hooks
export {
  useForumPosts,
  useForumComments,
  useCreatePost,
  useToggleLike,
  useCreateComment,
  forumKeys,
} from './useForum'
export type { ForumPost, ForumComment } from './useForum'

// Profile hooks
export {
  useProfile,
  useUpdateProfile,
  profileKeys,
} from './useProfile'
export type { Profile } from './useProfile'

// Focus sessions hooks
export {
  useDashboardStats,
  useFocusPageStats,
  useCreateSession,
  focusKeys,
} from './useFocusSessions'
export type { FocusSession, DashboardStats, FocusPageStats, MilestoneProgress } from './useFocusSessions'

// Sounds hooks
export {
  useSounds,
  useIncrementPlayCount,
  soundKeys,
} from './useSounds'
export type { AmbientSound } from './useSounds'

// Achievements hooks
export {
  useAchievements,
  achievementKeys,
} from './useAchievements'
export type { Milestone, UserAchievement, AchievementsData } from './useAchievements'

// Admin Content hooks
export {
  useDailyTips,
  useCreateDailyTip,
  useDeleteDailyTip,
  useAdminForumPosts,
  useDeleteForumPost,
  useAdminComments,
  useDeleteComment,
  contentKeys,
} from './useAdminContent'
export type { DailyTip, AdminForumPost, AdminComment } from './useAdminContent'

// Admin Sounds hooks
export {
  useAdminSounds,
  useUploadSound,
  useUpdateSound,
  useDeleteSound,
  useToggleSoundActive,
  adminSoundsKeys,
} from './useAdminSounds'
export type { AdminSound } from './useAdminSounds'

// Admin Users hooks
export {
  useAdminUsers,
  useToggleUserRole,
  useBanUser,
  useUnbanUser,
  adminUsersKeys,
} from './useAdminUsers'
export type { AdminUser } from './useAdminUsers'

// Admin Milestones hooks
export {
  useAdminMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useToggleMilestoneActive,
  adminMilestonesKeys,
} from './useAdminMilestones'
export type { AdminMilestone } from './useAdminMilestones'

// Admin Reminders hooks
export {
  useAdminReminders,
  useCreateGlobalReminder,
  useUpdateGlobalReminder,
  useDeleteGlobalReminder,
  adminRemindersKeys,
} from './useAdminReminders'
export type { GlobalReminder } from './useAdminReminders'

// Subscription hooks
export {
  useSubscription,
  useIsPremium,
  usePlanFeatures,
  useFeatureLimit,
  redirectToCheckout,
  redirectToPortal,
  subscriptionKeys,
} from './useSubscription'
export type { SubscriptionData } from './useSubscription'

// Messages hooks
export {
  useConversations,
  useConversationMessages,
  useUnreadMessageCount,
  useSendMessage,
  useMarkMessagesAsRead,
  useCreateConversation,
  useToggleArchiveConversation,
  useDeleteMessage,
  messagesKeys,
} from './useMessages'
export type { Conversation, Message } from '@/app/messages/actions'
