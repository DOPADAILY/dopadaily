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

interface AudioState {
  // Current sound
  currentSound: AmbientSound | null
  
  // Audio element reference
  audio: HTMLAudioElement | null
  
  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLooping: boolean
  
  // Modal state
  isModalOpen: boolean
  
  // Actions
  loadSound: (sound: AmbientSound) => void
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleLoop: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  openModal: () => void
  closeModal: () => void
  cleanup: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentSound: null,
  audio: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  isLooping: true,
  isModalOpen: false,

  loadSound: (sound: AmbientSound) => {
    const state = get()
    
    // Clean up existing audio
    if (state.audio) {
      state.audio.pause()
      state.audio.src = ''
    }

    // Create new audio element
    const audio = new Audio(sound.file_url)
    audio.volume = state.isMuted ? 0 : state.volume
    audio.loop = state.isLooping

    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      set({ duration: audio.duration })
    })

    audio.addEventListener('ended', () => {
      if (!get().isLooping) {
        set({ isPlaying: false })
      }
    })

    audio.addEventListener('timeupdate', () => {
      set({ currentTime: audio.currentTime })
    })

    set({
      currentSound: sound,
      audio,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isModalOpen: true
    })
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
    const { audio, isLooping } = get()
    const newLooping = !isLooping
    set({ isLooping: newLooping })
    if (audio) {
      audio.loop = newLooping
    }
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
      audio.pause()
      audio.src = ''
    }
    set({
      currentSound: null,
      audio: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isModalOpen: false
    })
  }
}))

