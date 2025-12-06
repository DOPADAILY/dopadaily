'use client'

import { useEffect, useState, useMemo } from 'react'
import { Music, Play, Search, Headphones, Waves, Sparkles, WifiOff, Lock, Crown } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import Select from '@/components/Select'
import MusicPlayerModal from '@/components/MusicPlayerModal'
import EmptyState from '@/components/EmptyState'
import { useAudioStore } from '@/stores/audioStore'
import { useSounds, useIncrementPlayCount, AmbientSound, useIsPremium } from '@/hooks/queries'
import { SoundsSkeleton } from '@/components/SkeletonLoader'
import UpgradePrompt from '@/components/UpgradePrompt'

// Number of free sounds available to free users
const FREE_SOUNDS_LIMIT = 3

interface SoundsClientProps {
  user: any
  profile: any
}

const CATEGORIES = [
  'nature',
  'white_noise',
  'binaural',
  'lofi',
  'meditation',
  'rain',
  'ocean',
  'forest',
  '8d_audio',
  'other'
]

const categoryOptions = [
  { value: '', label: 'All Categories' },
  ...CATEGORIES.map(cat => ({
    value: cat,
    label: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }))
]

export default function SoundsClient({ user, profile }: SoundsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const { loadSound, isModalOpen, closeModal } = useAudioStore()

  // TanStack Query hooks
  const { data: sounds = [], isLoading, error } = useSounds()
  const incrementPlayCount = useIncrementPlayCount()

  // Subscription check
  const { isPremium } = useIsPremium()

  // Filter sounds
  const filteredSounds = useMemo(() => {
    let filtered = sounds

    if (searchQuery) {
      filtered = filtered.filter(sound =>
        sound.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sound.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterCategory) {
      filtered = filtered.filter(sound => sound.category === filterCategory)
    }

    return filtered
  }, [searchQuery, filterCategory, sounds])

  // Separate free and premium sounds for non-premium users
  const freeSounds = useMemo(() => sounds.slice(0, FREE_SOUNDS_LIMIT), [sounds])
  const isSoundFree = (soundId: string) => {
    return freeSounds.some(s => s.id === soundId)
  }

  const handlePlaySound = (sound: AmbientSound) => {
    // Check if user can play this sound
    if (!isPremium && !isSoundFree(sound.id)) {
      setShowUpgradeModal(true)
      return
    }

    loadSound(sound)
    // Increment play count
    incrementPlayCount.mutate({ soundId: sound.id, currentCount: sound.play_count })
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      nature: Sparkles,
      white_noise: Waves,
      binaural: Music,
      lofi: Music,
      meditation: Sparkles,
      rain: Waves,
      ocean: Waves,
      forest: Sparkles,
      '8d_audio': Headphones,
      other: Music
    }
    return icons[category] || Music
  }

  const getCategoryGradient = (category: string) => {
    const gradients: { [key: string]: string } = {
      nature: 'from-green-500/20 via-emerald-500/10 to-lime-500/20',
      white_noise: 'from-gray-500/20 via-slate-500/10 to-zinc-500/20',
      binaural: 'from-purple-500/20 via-pink-500/10 to-fuchsia-500/20',
      lofi: 'from-orange-500/20 via-red-500/10 to-rose-500/20',
      meditation: 'from-blue-500/20 via-cyan-500/10 to-sky-500/20',
      rain: 'from-indigo-500/20 via-blue-500/10 to-violet-500/20',
      ocean: 'from-cyan-500/20 via-teal-500/10 to-blue-500/20',
      forest: 'from-green-600/20 via-lime-500/10 to-emerald-500/20',
      '8d_audio': 'from-violet-500/20 via-purple-500/10 to-indigo-500/20',
      other: 'from-primary/20 via-secondary/10 to-primary/20'
    }
    return gradients[category] || gradients.other
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Only show skeleton on initial load when there's no cached data
  if (isLoading && sounds.length === 0) {
    return <SoundsSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
          <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
            <MobileMenuButton />
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                <Headphones size={20} className="text-secondary" />
                Ambient Sounds
              </h1>
              <p className="text-on-surface-secondary text-xs hidden sm:block">
                Calming sounds to enhance your focus
              </p>
            </div>
            <UserMenu email={user?.email} username={profile?.username} />
          </div>
        </header>
        <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div className="card">
            <EmptyState
              icon={Music}
              title="Failed to load sounds"
              description={error.message || 'Something went wrong. Please try again.'}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
        <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <Headphones size={20} className="text-secondary" />
              Ambient Sounds
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">
              Calming sounds to enhance your focus
            </p>
          </div>
          <UserMenu email={user?.email} username={profile?.username} />
        </div>
      </header>

      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-3">
            Find Your Focus
          </h2>
          <p className="text-on-surface-secondary max-w-2xl mx-auto">
            Discover carefully curated ambient sounds designed to enhance concentration and reduce distractions
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
            <input
              type="text"
              placeholder="Search sounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface-elevated text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <div className="sm:w-56">
            <Select
              value={filterCategory}
              onChange={(value) => setFilterCategory(value)}
              options={categoryOptions}
              placeholder="Filter by category"
            />
          </div>
        </div>

        {/* Free User Banner */}
        {!isPremium && sounds.length > FREE_SOUNDS_LIMIT && (
          <div className="mb-6 p-4 bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-primary" />
                <span className="text-sm text-on-surface">
                  <strong>{FREE_SOUNDS_LIMIT} free sounds</strong> available. Upgrade to Premium for the full library of {sounds.length} sounds.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sounds Grid */}
        {filteredSounds.length === 0 ? (
          <div className="text-center py-20 card">
            <div className="inline-flex p-6 rounded-full bg-primary/10 mb-6">
              <Music size={64} className="text-primary opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-3">
              {searchQuery || filterCategory ? 'No sounds found' : 'No sounds available'}
            </h2>
            <p className="text-on-surface-secondary max-w-md mx-auto">
              {searchQuery || filterCategory
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Check back later for new ambient sounds to enhance your focus'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSounds.map((sound) => {
              const CategoryIcon = getCategoryIcon(sound.category)
              const isLocked = !isPremium && !isSoundFree(sound.id)

              return (
                <div
                  key={sound.id}
                  className={`group card hover:border-primary/30 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative ${isLocked ? 'opacity-75' : ''}`}
                  onClick={() => handlePlaySound(sound)}
                >
                  {/* Premium Lock Overlay */}
                  {isLocked && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface/90 backdrop-blur-sm text-xs font-medium text-on-surface-secondary rounded-full border border-border">
                        <Lock size={12} />
                        Premium
                      </span>
                    </div>
                  )}

                  {/* Sound Image with Gradient */}
                  <div className={`relative aspect-video bg-linear-to-br ${getCategoryGradient(sound.category)} rounded-xl mb-4 flex items-center justify-center overflow-hidden`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 80%, currentColor 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                      }}></div>
                    </div>

                    {/* Icon */}
                    <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                      <div className="p-5 rounded-full bg-surface/60 backdrop-blur-sm shadow-lg">
                        {isLocked ? (
                          <Lock size={40} className="text-on-surface-secondary" />
                        ) : (
                          <CategoryIcon size={40} className="text-primary" />
                        )}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className={`p-4 rounded-full shadow-lg ${isLocked ? 'bg-on-surface-secondary' : 'bg-primary'}`}>
                          {isLocked ? (
                            <Lock size={24} className="text-white" />
                          ) : (
                            <Play size={24} className="text-white ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-surface/90 backdrop-blur-sm text-xs font-bold text-primary rounded-full border border-primary/20 uppercase tracking-wide">
                        {sound.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Sound Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className={`text-xl font-bold mb-2 transition-colors ${isLocked ? 'text-on-surface-secondary' : 'text-on-surface group-hover:text-primary'}`}>
                        {sound.title}
                      </h3>
                      {sound.description && (
                        <p className="text-sm text-on-surface-secondary line-clamp-2 leading-relaxed">
                          {sound.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-on-surface-secondary pt-2 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Music size={14} />
                        {formatDuration(sound.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play size={14} />
                        {sound.play_count} plays
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-12 card bg-linear-to-br from-primary/5 to-secondary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-3 rounded-full bg-primary/10">
              <Headphones size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-on-surface mb-3">About Ambient Sounds</h3>
              <p className="text-sm text-on-surface-secondary mb-3 leading-relaxed">
                These carefully curated sounds are designed to help you focus, relax, and maintain productivity.
                Each sound loops seamlessly and includes full playback controls.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-surface rounded-full border border-border">
                  🎵 High-quality audio
                </span>
                <span className="px-3 py-1 bg-surface rounded-full border border-border">
                  🔁 Seamless looping
                </span>
                <span className="px-3 py-1 bg-surface rounded-full border border-border">
                  🎚️ Volume control
                </span>
                <span className="px-3 py-1 bg-surface rounded-full border border-border">
                  ⏯️ Full playback controls
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Music Player Modal */}
      <MusicPlayerModal />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="Full Sound Library"
          description={`Free users can access ${FREE_SOUNDS_LIMIT} sounds. Upgrade to Premium for unlimited access to all ${sounds.length} ambient sounds.`}
          variant="modal"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  )
}
