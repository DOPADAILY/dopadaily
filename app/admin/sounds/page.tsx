'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Music, Upload, Trash2, Play, Pause, Plus, Search, Sparkles, Waves, Headphones, Edit2, X, Clock, HardDrive, BarChart3, Volume2, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import BackButton from '@/components/BackButton'
import ConfirmModal from '@/components/ConfirmModal'
import Select from '@/components/Select'
import Toast from '@/components/Toast'
import {
    useAdminSounds,
    useUploadSound,
    useUpdateSound,
    useDeleteSound,
    useToggleSoundActive,
    adminSoundsKeys,
    type AdminSound,
} from '@/hooks/queries'

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

const formCategoryOptions = CATEGORIES.map(cat => ({
    value: cat,
    label: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}))

// Audio player state type
type AudioState = 'idle' | 'loading' | 'playing' | 'paused'

export default function AdminSoundsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingSound, setEditingSound] = useState<AdminSound | null>(null)
    const [deletingSound, setDeletingSound] = useState<AdminSound | null>(null)
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

    // Audio player state
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audioState, setAudioState] = useState<AudioState>('idle')
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const progressInterval = useRef<NodeJS.Timeout | null>(null)

    // TanStack Query hooks
    const { data: sounds = [], isLoading: loading } = useAdminSounds()
    const uploadMutation = useUploadSound()
    const updateMutation = useUpdateSound()
    const deleteMutation = useDeleteSound()
    const toggleActiveMutation = useToggleSoundActive()

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        category: 'nature',
        is_active: true,
        file: null as File | null
    })

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        category: '',
        is_active: true
    })

    // Filter sounds with useMemo
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

    useEffect(() => {
        const supabase = createClient()

        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            setCurrentUser(user)

            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, role')
                .eq('id', user.id)
                .single()

            if (profileData?.role !== 'admin' && profileData?.role !== 'super_admin') {
                router.push('/dashboard')
                return
            }

            setProfile(profileData)
        }

        checkAuth()

        // Subscribe to real-time updates
        const channel = supabase
            .channel('ambient_sounds_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ambient_sounds' }, () => {
                queryClient.invalidateQueries({ queryKey: adminSoundsKeys.lists() })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            cleanupAudio()
        }
    }, [router, queryClient])

    // Cleanup audio on unmount
    const cleanupAudio = (keepState = false) => {
        if (audioRef.current) {
            // Remove all event listeners before cleanup to prevent error callbacks
            audioRef.current.onloadedmetadata = null
            audioRef.current.oncanplaythrough = null
            audioRef.current.onended = null
            audioRef.current.onerror = null
            audioRef.current.pause()
            audioRef.current.src = ''
            audioRef.current = null
        }
        if (progressInterval.current) {
            clearInterval(progressInterval.current)
            progressInterval.current = null
        }
        if (!keepState) {
            setPlayingId(null)
            setAudioState('idle')
            setCurrentTime(0)
            setDuration(0)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac']
            if (!validTypes.includes(file.type)) {
                setToast({ message: 'Please upload a valid audio file (MP3, WAV, OGG, WebM, AAC)', variant: 'error' })
                return
            }

            if (file.size > 50 * 1024 * 1024) {
                setToast({ message: 'File size must be less than 50MB', variant: 'error' })
                return
            }

            setUploadForm({ ...uploadForm, file })
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!uploadForm.file || !uploadForm.title) {
            setToast({ message: 'Please fill in all required fields', variant: 'error' })
            return
        }

        try {
            await uploadMutation.mutateAsync({
                title: uploadForm.title,
                description: uploadForm.description,
                category: uploadForm.category,
                is_active: uploadForm.is_active,
                file: uploadForm.file,
                created_by: currentUser?.id
            })

            setToast({ message: 'Sound uploaded successfully!', variant: 'success' })
            setIsCreateOpen(false)
            setUploadForm({
                title: '',
                description: '',
                category: 'nature',
                is_active: true,
                file: null
            })
        } catch (error: any) {
            console.error('Error uploading sound:', error)
            setToast({ message: error.message || 'Failed to upload sound', variant: 'error' })
        }
    }

    const handleEdit = (sound: AdminSound) => {
        setEditingSound(sound)
        setEditForm({
            title: sound.title,
            description: sound.description || '',
            category: sound.category,
            is_active: sound.is_active
        })
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!editingSound || !editForm.title) {
            setToast({ message: 'Title is required', variant: 'error' })
            return
        }

        try {
            await updateMutation.mutateAsync({
                id: editingSound.id,
                title: editForm.title,
                description: editForm.description || null,
                category: editForm.category,
                is_active: editForm.is_active,
                admin_id: currentUser?.id
            })

            setToast({ message: 'Sound updated successfully!', variant: 'success' })
            setEditingSound(null)
        } catch (error: any) {
            console.error('Error updating sound:', error)
            setToast({ message: error.message || 'Failed to update sound', variant: 'error' })
        }
    }

    const handleDelete = async () => {
        if (!deletingSound) return

        try {
            await deleteMutation.mutateAsync({
                id: deletingSound.id,
                file_name: deletingSound.file_name,
                title: deletingSound.title,
                admin_id: currentUser?.id
            })

            // Stop playing if this sound is playing
            if (playingId === deletingSound.id) {
                cleanupAudio()
            }

            setToast({ message: 'Sound deleted successfully', variant: 'success' })
            setDeletingSound(null)
        } catch (error: any) {
            console.error('Error deleting sound:', error)
            setToast({ message: error.message || 'Failed to delete sound', variant: 'error' })
        }
    }

    const togglePlay = (sound: AdminSound) => {
        // If clicking the same sound that's playing
        if (playingId === sound.id) {
            if (audioState === 'playing') {
                audioRef.current?.pause()
                setAudioState('paused')
            } else if (audioState === 'paused') {
                audioRef.current?.play()
                setAudioState('playing')
            }
            return
        }

        // Playing a new sound
        cleanupAudio()
        setPlayingId(sound.id)
        setAudioState('loading')

        const audio = new Audio(sound.file_url)
        audioRef.current = audio
        audio.volume = 0.5

        audio.onloadedmetadata = () => {
            setDuration(audio.duration)
        }

        audio.oncanplaythrough = () => {
            setAudioState('playing')
            audio.play()
            // Update progress
            progressInterval.current = setInterval(() => {
                setCurrentTime(audio.currentTime)
            }, 100)
        }

        audio.onended = () => {
            cleanupAudio()
        }

        audio.onerror = () => {
            setToast({ message: 'Failed to load audio', variant: 'error' })
            cleanupAudio()
        }

        audio.load()
    }

    const toggleActive = async (sound: AdminSound) => {
        try {
            await toggleActiveMutation.mutateAsync({
                id: sound.id,
                is_active: sound.is_active,
                title: sound.title,
                admin_id: currentUser?.id
            })

            setToast({ message: `Sound ${!sound.is_active ? 'activated' : 'deactivated'}`, variant: 'success' })
        } catch (error: any) {
            console.error('Error updating sound:', error)
            setToast({ message: 'Failed to update sound status', variant: 'error' })
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '—'
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(1)} MB`
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '—'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatCategory = (category: string) => {
        return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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

    // Skeleton loader for sound items
    const SoundRowSkeleton = () => (
        <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-backplate rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-backplate rounded w-1/3" />
                    <div className="h-3 bg-backplate rounded w-1/2" />
                </div>
                <div className="hidden md:flex items-center gap-6">
                    <div className="h-6 w-20 bg-backplate rounded-full" />
                    <div className="h-4 w-12 bg-backplate rounded" />
                    <div className="h-4 w-12 bg-backplate rounded" />
                    <div className="h-4 w-16 bg-backplate rounded" />
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="min-h-screen">
                <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
                    <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
                        <MobileMenuButton />
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                                <Music size={20} className="text-secondary" />
                                Dopaflow Sound Library
                            </h1>
                        </div>
                    </div>
                </header>
                <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-6xl">
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <SoundRowSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
                <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
                    <MobileMenuButton />
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                            <Music size={20} className="text-secondary" />
                            Dopaflow Sound Library
                        </h1>
                        <p className="text-on-surface-secondary text-xs hidden sm:block">
                            {filteredSounds.length} sound{filteredSounds.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <UserMenu email={currentUser?.email} username={profile?.username} />
                </div>
            </header>

            <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-6xl">
                {/* Header Section */}
                <div className="mb-6">
                    <BackButton />
                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">Sound Library</h2>
                            <p className="text-on-surface-secondary text-sm">
                                Manage Dopaflow sounds • {sounds.length} total
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="btn btn-primary flex items-center gap-2 justify-center shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <Plus size={20} />
                            Upload Sound
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
                        <input
                            type="text"
                            placeholder="Search sounds..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-elevated text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="sm:w-48">
                        <Select
                            value={filterCategory}
                            onChange={(value) => setFilterCategory(value)}
                            options={categoryOptions}
                            placeholder="All Categories"
                        />
                    </div>
                </div>

                {/* Sounds List */}
                {filteredSounds.length === 0 ? (
                    <div className="text-center py-16 card">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                            <Music size={64} className="relative mx-auto text-primary mb-2" />
                        </div>
                        <h2 className="text-2xl font-bold text-on-surface mb-3">
                            {searchQuery || filterCategory ? 'No sounds found' : 'No sounds yet'}
                        </h2>
                        <p className="text-on-surface-secondary mb-6 max-w-md mx-auto">
                            {searchQuery || filterCategory
                                ? 'Try adjusting your search or filters'
                                : 'Upload your first Dopaflow sound to get started'}
                        </p>
                        {!searchQuery && !filterCategory && (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="btn btn-primary inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Upload size={18} />
                                Upload Sound
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Desktop Table Header */}
                        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-on-surface-secondary uppercase tracking-wide">
                            <div className="col-span-5">Sound</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-1 text-center">Duration</div>
                            <div className="col-span-1 text-center">Size</div>
                            <div className="col-span-1 text-center">Plays</div>
                            <div className="col-span-1 text-center">Status</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>

                        {/* Sound Rows */}
                        {filteredSounds.map((sound) => {
                            const CategoryIcon = getCategoryIcon(sound.category)
                            const isCurrentSound = playingId === sound.id
                            const isLoading = isCurrentSound && audioState === 'loading'
                            const isPlaying = isCurrentSound && audioState === 'playing'

                            return (
                                <div
                                    key={sound.id}
                                    className={`group bg-surface border rounded-xl transition-all duration-200 hover:border-primary/30 hover:shadow-md ${isCurrentSound ? 'border-primary/50 shadow-md' : 'border-border'}`}
                                >
                                    {/* Main Row */}
                                    <div className="p-4 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                                        {/* Sound Info - Mobile & Desktop */}
                                        <div className="col-span-5 flex items-center gap-3 mb-3 lg:mb-0">
                                            {/* Play Button */}
                                            <button
                                                onClick={() => togglePlay(sound)}
                                                disabled={isLoading}
                                                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isCurrentSound
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                    : 'bg-backplate text-on-surface-secondary hover:bg-primary/20 hover:text-primary'
                                                    } ${isLoading ? 'cursor-wait' : ''}`}
                                            >
                                                {isLoading ? (
                                                    <Loader2 size={22} className="animate-spin" />
                                                ) : isPlaying ? (
                                                    <Pause size={22} />
                                                ) : (
                                                    <Play size={22} className="ml-0.5" />
                                                )}
                                            </button>

                                            {/* Title & Description */}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                                                    {sound.title}
                                                </h3>
                                                {sound.description && (
                                                    <p className="text-sm text-on-surface-secondary truncate">
                                                        {sound.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="col-span-2 hidden lg:flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                                <CategoryIcon size={12} />
                                                {formatCategory(sound.category)}
                                            </span>
                                        </div>

                                        {/* Duration */}
                                        <div className="col-span-1 hidden lg:flex justify-center items-center gap-1 text-sm text-on-surface-secondary">
                                            <Clock size={14} />
                                            {formatDuration(sound.duration)}
                                        </div>

                                        {/* Size */}
                                        <div className="col-span-1 hidden lg:flex justify-center items-center gap-1 text-sm text-on-surface-secondary">
                                            <HardDrive size={14} />
                                            {formatFileSize(sound.file_size)}
                                        </div>

                                        {/* Plays */}
                                        <div className="col-span-1 hidden lg:flex justify-center items-center gap-1 text-sm text-on-surface-secondary">
                                            <BarChart3 size={14} />
                                            {sound.play_count}
                                        </div>

                                        {/* Status Toggle */}
                                        <div className="col-span-1 hidden lg:flex justify-center">
                                            <button
                                                onClick={() => toggleActive(sound)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sound.is_active
                                                    ? 'bg-success/10 text-success hover:bg-success/20'
                                                    : 'bg-neutral-medium/10 text-on-surface-secondary hover:bg-neutral-medium/20'
                                                    }`}
                                            >
                                                {sound.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 hidden lg:flex justify-end items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(sound)}
                                                className="p-2 text-on-surface-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                title="Edit sound"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingSound(sound)}
                                                className="p-2 text-on-surface-secondary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                                title="Delete sound"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Mobile: Metadata Row */}
                                        <div className="lg:hidden flex flex-wrap items-center gap-2 mt-3 text-xs">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                                <CategoryIcon size={12} />
                                                {formatCategory(sound.category)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-backplate rounded-full text-on-surface-secondary">
                                                <Clock size={12} />
                                                {formatDuration(sound.duration)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-backplate rounded-full text-on-surface-secondary">
                                                <BarChart3 size={12} />
                                                {sound.play_count} plays
                                            </span>
                                            <button
                                                onClick={() => toggleActive(sound)}
                                                className={`px-2 py-1 rounded-full font-medium ${sound.is_active
                                                    ? 'bg-success/10 text-success'
                                                    : 'bg-neutral-medium/10 text-on-surface-secondary'
                                                    }`}
                                            >
                                                {sound.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                            <div className="flex-1" />
                                            <button
                                                onClick={() => handleEdit(sound)}
                                                className="p-1.5 text-on-surface-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingSound(sound)}
                                                className="p-1.5 text-on-surface-secondary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Audio Progress Bar (Spotify-style) */}
                                    {isCurrentSound && (
                                        <div className="px-4 pb-4">
                                            <div className="flex items-center gap-3">
                                                <Volume2 size={16} className="text-primary shrink-0" />
                                                <div className="flex-1 relative">
                                                    {/* Background track */}
                                                    <div className="h-1.5 bg-backplate rounded-full overflow-hidden">
                                                        {isLoading ? (
                                                            // Spotify-like loading skeleton
                                                            <div className="h-full w-full relative overflow-hidden">
                                                                <div className="absolute inset-0 animate-shimmer" />
                                                            </div>
                                                        ) : (
                                                            // Progress bar
                                                            <div
                                                                className="h-full bg-primary transition-all duration-100 rounded-full"
                                                                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-on-surface-secondary tabular-nums w-20 text-right">
                                                    {isLoading ? (
                                                        'Loading...'
                                                    ) : (
                                                        `${formatDuration(currentTime)} / ${formatDuration(duration)}`
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                                <Upload size={24} className="text-primary" />
                                Upload Sound
                            </h2>
                            <button
                                onClick={() => !uploadMutation.isPending && setIsCreateOpen(false)}
                                disabled={uploadMutation.isPending}
                                className="p-2 hover:bg-backplate rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={uploadForm.title}
                                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                    placeholder="e.g., Ocean Waves, Rain Forest"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={uploadMutation.isPending}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    placeholder="Describe the sound..."
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                                    disabled={uploadMutation.isPending}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">
                                    Category *
                                </label>
                                <Select
                                    value={uploadForm.category}
                                    onChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                                    options={formCategoryOptions}
                                    disabled={uploadMutation.isPending}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">
                                    Audio File *
                                </label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    required
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={uploadMutation.isPending}
                                />
                                <p className="text-xs text-on-surface-secondary mt-1">
                                    MP3, WAV, OGG, WebM, AAC (Max 50MB)
                                </p>
                                {uploadForm.file && (
                                    <p className="text-xs text-success mt-1">
                                        ✓ {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                                    </p>
                                )}
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={uploadForm.is_active}
                                    onChange={(e) => setUploadForm({ ...uploadForm, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                                    disabled={uploadMutation.isPending}
                                />
                                <span className="text-sm text-on-surface">Make active immediately</span>
                            </label>

                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                <button
                                    type="submit"
                                    disabled={uploadMutation.isPending || !uploadForm.file}
                                    className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadMutation.isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Upload
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={uploadMutation.isPending}
                                    className="btn btn-ghost disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingSound && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                                <Edit2 size={24} className="text-primary" />
                                Edit Sound
                            </h2>
                            <button
                                onClick={() => !updateMutation.isPending && setEditingSound(null)}
                                disabled={updateMutation.isPending}
                                className="p-2 hover:bg-backplate rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder="Sound title"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={updateMutation.isPending}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Describe the sound..."
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                                    disabled={updateMutation.isPending}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">
                                    Category *
                                </label>
                                <Select
                                    value={editForm.category}
                                    onChange={(value) => setEditForm({ ...editForm, category: value })}
                                    options={formCategoryOptions}
                                    disabled={updateMutation.isPending}
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_active}
                                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                                    disabled={updateMutation.isPending}
                                />
                                <span className="text-sm text-on-surface">Active</span>
                            </label>

                            {/* File info (read-only) */}
                            <div className="p-3 bg-backplate rounded-lg">
                                <p className="text-xs text-on-surface-secondary mb-2 font-medium">File Info</p>
                                <div className="flex flex-wrap gap-3 text-sm">
                                    <span className="flex items-center gap-1 text-on-surface">
                                        <Clock size={14} className="text-on-surface-secondary" />
                                        {formatDuration(editingSound.duration)}
                                    </span>
                                    <span className="flex items-center gap-1 text-on-surface">
                                        <HardDrive size={14} className="text-on-surface-secondary" />
                                        {formatFileSize(editingSound.file_size)}
                                    </span>
                                    <span className="flex items-center gap-1 text-on-surface">
                                        <BarChart3 size={14} className="text-on-surface-secondary" />
                                        {editingSound.play_count} plays
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updateMutation.isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingSound(null)}
                                    disabled={updateMutation.isPending}
                                    className="btn btn-ghost disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deletingSound && (
                <ConfirmModal
                    isOpen={!!deletingSound}
                    onClose={() => setDeletingSound(null)}
                    onConfirm={handleDelete}
                    title="Delete Sound?"
                    message={`Are you sure you want to delete "${deletingSound.title}"? This will also remove the audio file from storage.`}
                    confirmText="Delete"
                    variant="danger"
                    isLoading={deleteMutation.isPending}
                />
            )}

            {/* Toast */}
            <Toast
                isOpen={toast !== null}
                message={toast?.message || ''}
                variant={toast?.variant || 'success'}
                onClose={() => setToast(null)}
            />
        </div>
    )
}
