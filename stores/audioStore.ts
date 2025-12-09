import { create } from 'zustand'

interface AmbientSound {
  id: string
  title: string
  description: string | null
  file_url: string
  category: string
  duration: number | null
  play_count: number
}

type LoopMode = 'none' | 'one' | 'all' // none = no loop, one = repeat single, all = loop playlist

interface AudioState {
  // Current sound
  currentSound: AmbientSound | null

  // Playlist
  playlist: AmbientSound[]
  currentIndex: number

  // Audio element reference
  audio: HTMLAudioElement | null

  // Playback state
  isPlaying: boolean
  isLoading: boolean
  shouldAutoPlay: boolean // Flag to auto-play when ready
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLooping: boolean // Legacy - kept for compatibility
  loopMode: LoopMode

  // Shuffle
  isShuffled: boolean
  shuffleOrder: number[]

  // Modal state
  isModalOpen: boolean

  // Actions
  setPlaylist: (sounds: AmbientSound[]) => void
  loadSound: (sound: AmbientSound, autoPlay?: boolean) => void
  playFromPlaylist: (sound: AmbientSound, playlist?: AmbientSound[]) => void
  playNext: () => void
  playPrevious: () => void
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleLoop: () => void
  cycleLoopMode: () => void
  toggleShuffle: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  openModal: () => void
  closeModal: () => void
  cleanup: () => void
}

// Helper to generate shuffle order
const generateShuffleOrder = (length: number, currentIndex: number): number[] => {
  const indices = Array.from({ length }, (_, i) => i)
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  // Move current index to front if it exists
  const currentPos = indices.indexOf(currentIndex)
  if (currentPos > 0) {
    indices.splice(currentPos, 1)
    indices.unshift(currentIndex)
  }
  return indices
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentSound: null,
  playlist: [],
  currentIndex: -1,
  audio: null,
  isPlaying: false,
  isLoading: false,
  shouldAutoPlay: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  isLooping: false, // Legacy
  loopMode: 'all', // Default to looping playlist
  isShuffled: false,
  shuffleOrder: [],
  isModalOpen: false,

  setPlaylist: (sounds: AmbientSound[]) => {
    set({ playlist: sounds })
  },

  loadSound: (sound: AmbientSound, autoPlay: boolean = false) => {
    const state = get()

    // Clean up existing audio - remove event listeners first
    if (state.audio) {
      state.audio.onloadedmetadata = null
      state.audio.oncanplaythrough = null
      state.audio.onended = null
      state.audio.ontimeupdate = null
      state.audio.onerror = null
      state.audio.pause()
      state.audio.src = ''
    }

    // Find index in playlist
    const index = state.playlist.findIndex(s => s.id === sound.id)

    // Set loading state immediately
    set({
      currentSound: sound,
      currentIndex: index,
      isLoading: true,
      isPlaying: false,
      shouldAutoPlay: autoPlay,
      currentTime: 0,
      duration: 0,
      isModalOpen: true
    })

    // Create new audio element
    const audio = new Audio(sound.file_url)
    audio.volume = state.isMuted ? 0 : state.volume
    audio.loop = state.loopMode === 'one'

    // Set up event listeners
    audio.onloadedmetadata = () => {
      set({ duration: audio.duration })
    }

    audio.oncanplaythrough = () => {
      const currentState = get()
      set({ isLoading: false, audio })

      // Auto-play if flag is set (e.g., from playNext/playPrevious)
      if (currentState.shouldAutoPlay) {
        set({ shouldAutoPlay: false })
        audio.play()
          .then(() => set({ isPlaying: true }))
          .catch(err => {
            console.error('Failed to auto-play audio:', err)
            set({ isPlaying: false })
          })
      }
    }

    audio.onended = () => {
      const currentState = get()
      if (currentState.loopMode === 'one') {
        // Single track loop is handled by audio.loop
        return
      }
      // Auto-advance to next track
      currentState.playNext()
    }

    audio.ontimeupdate = () => {
      set({ currentTime: audio.currentTime })
    }

    audio.onerror = () => {
      console.error('Failed to load audio')
      set({ isLoading: false, isPlaying: false, shouldAutoPlay: false })
    }

    // Start loading
    audio.load()

    // Store audio reference
    set({ audio })
  },

  playFromPlaylist: (sound: AmbientSound, playlist?: AmbientSound[]) => {
    const state = get()

    // Update playlist if provided
    if (playlist) {
      const index = playlist.findIndex(s => s.id === sound.id)
      set({
        playlist,
        currentIndex: index,
        shuffleOrder: state.isShuffled ? generateShuffleOrder(playlist.length, index) : []
      })
    }

    // Load and play the sound
    state.loadSound(sound)
  },

  playNext: () => {
    const { playlist, currentIndex, loopMode, isShuffled, shuffleOrder } = get()
    if (playlist.length === 0) {
      set({ isPlaying: false })
      return
    }

    let nextIndex: number

    if (isShuffled && shuffleOrder.length > 0) {
      // Find current position in shuffle order
      const shufflePos = shuffleOrder.indexOf(currentIndex)
      const nextShufflePos = shufflePos + 1

      if (nextShufflePos >= shuffleOrder.length) {
        // End of shuffle order
        if (loopMode === 'all') {
          // Reshuffle and start from beginning
          const newOrder = generateShuffleOrder(playlist.length, -1)
          set({ shuffleOrder: newOrder })
          nextIndex = newOrder[0]
        } else {
          // Stop playing
          set({ isPlaying: false })
          return
        }
      } else {
        nextIndex = shuffleOrder[nextShufflePos]
      }
    } else {
      // Normal sequential playback
      nextIndex = currentIndex + 1

      if (nextIndex >= playlist.length) {
        if (loopMode === 'all') {
          nextIndex = 0 // Loop back to start
        } else {
          // Stop playing
          set({ isPlaying: false })
          return
        }
      }
    }

    const nextSound = playlist[nextIndex]
    if (nextSound) {
      get().loadSound(nextSound, true) // Auto-play when ready
    }
  },

  playPrevious: () => {
    const { playlist, currentIndex, currentTime, isShuffled, shuffleOrder, loopMode } = get()
    if (playlist.length === 0) return

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      get().seek(0)
      return
    }

    let prevIndex: number

    if (isShuffled && shuffleOrder.length > 0) {
      const shufflePos = shuffleOrder.indexOf(currentIndex)
      const prevShufflePos = shufflePos - 1

      if (prevShufflePos < 0) {
        if (loopMode === 'all') {
          prevIndex = shuffleOrder[shuffleOrder.length - 1]
        } else {
          get().seek(0)
          return
        }
      } else {
        prevIndex = shuffleOrder[prevShufflePos]
      }
    } else {
      prevIndex = currentIndex - 1
      if (prevIndex < 0) {
        if (loopMode === 'all') {
          prevIndex = playlist.length - 1
        } else {
          get().seek(0)
          return
        }
      }
    }

    const prevSound = playlist[prevIndex]
    if (prevSound) {
      get().loadSound(prevSound, true) // Auto-play when ready
    }
  },

  play: () => {
    const { audio } = get()
    if (audio) {
      audio.play()
        .then(() => set({ isPlaying: true }))
        .catch(err => {
          console.error('Failed to play audio:', err)
          set({ isPlaying: false })
        })
    }
  },

  pause: () => {
    const { audio } = get()
    if (audio) {
      audio.pause()
      set({ isPlaying: false })
    }
  },

  togglePlayPause: () => {
    const { isPlaying, play, pause } = get()
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  },

  seek: (time: number) => {
    const { audio } = get()
    if (audio) {
      audio.currentTime = time
      set({ currentTime: time })
    }
  },

  setVolume: (volume: number) => {
    const { audio, isMuted } = get()
    set({ volume })
    if (audio && !isMuted) {
      audio.volume = volume
    }
  },

  toggleMute: () => {
    const { audio, isMuted, volume } = get()
    const newMuted = !isMuted
    set({ isMuted: newMuted })
    if (audio) {
      audio.volume = newMuted ? 0 : volume
    }
  },

  toggleLoop: () => {
    // Legacy function - just calls cycleLoopMode
    get().cycleLoopMode()
  },

  cycleLoopMode: () => {
    const { audio, loopMode } = get()
    // Cycle: all -> one -> none -> all
    const modes: LoopMode[] = ['all', 'one', 'none']
    const currentIndex = modes.indexOf(loopMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]

    set({
      loopMode: nextMode,
      isLooping: nextMode === 'one' // Legacy compatibility
    })

    if (audio) {
      audio.loop = nextMode === 'one'
    }
  },

  toggleShuffle: () => {
    const { isShuffled, playlist, currentIndex } = get()
    const newShuffled = !isShuffled

    set({
      isShuffled: newShuffled,
      shuffleOrder: newShuffled ? generateShuffleOrder(playlist.length, currentIndex) : []
    })
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time })
  },

  setDuration: (duration: number) => {
    set({ duration })
  },

  openModal: () => {
    set({ isModalOpen: true })
  },

  closeModal: () => {
    set({ isModalOpen: false })
  },

  cleanup: () => {
    const { audio } = get()
    if (audio) {
      // Remove event listeners first
      audio.onloadedmetadata = null
      audio.oncanplaythrough = null
      audio.onended = null
      audio.ontimeupdate = null
      audio.onerror = null
      audio.pause()
      audio.src = ''
    }
    set({
      currentSound: null,
      audio: null,
      isPlaying: false,
      isLoading: false,
      shouldAutoPlay: false,
      currentTime: 0,
      duration: 0,
      isModalOpen: false
    })
  }
}))

