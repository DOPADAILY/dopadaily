'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Music, Upload, Trash2, Play, Pause, Plus, Search, Filter, Sparkles, Waves } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import BackButton from '@/components/BackButton'
import ConfirmModal from '@/components/ConfirmModal'
import Select from '@/components/Select'
import Toast from '@/components/Toast'

interface AmbientSound {
    id: string
    title: string
    description: string | null
    file_url: string
    file_name: string
    file_size: number | null
    duration: number | null
    category: string
    is_active: boolean
    play_count: number
    created_at: string
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

export default function AdminSoundsPage() {
    const router = useRouter()
    const [sounds, setSounds] = useState<AmbientSound[]>([])
    const [filteredSounds, setFilteredSounds] = useState<AmbientSound[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
    const [deletingSound, setDeletingSound] = useState<AmbientSound | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'nature',
        is_active: true,
        file: null as File | null
    })

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

            if (profileData?.role !== 'admin') {
                router.push('/dashboard')
                return
            }

            setProfile(profileData)
        }

        const fetchSounds = async () => {
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('ambient_sounds')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error
                setSounds(data || [])
                setFilteredSounds(data || [])
            } catch (error) {
                console.error('Error fetching sounds:', error)
                setToast({ message: 'Failed to load sounds', variant: 'error' })
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
        fetchSounds()

        // Subscribe to real-time updates
        const channel = supabase
            .channel('ambient_sounds_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ambient_sounds' }, () => {
                fetchSounds()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            if (audioElement) {
                audioElement.pause()
                audioElement.src = ''
            }
        }
    }, [router])

    // Filter sounds
    useEffect(() => {
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

        setFilteredSounds(filtered)
    }, [searchQuery, filterCategory, sounds])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac']
            if (!validTypes.includes(file.type)) {
                setToast({ message: 'Please upload a valid audio file (MP3, WAV, OGG, WebM, AAC)', variant: 'error' })
                return
            }

            // Validate file size (50MB)
            if (file.size > 50 * 1024 * 1024) {
                setToast({ message: 'File size must be less than 50MB', variant: 'error' })
                return
            }

            setFormData({ ...formData, file })
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.file || !formData.title) {
            setToast({ message: 'Please fill in all required fields', variant: 'error' })
            return
        }

        setIsSubmitting(true)
        setUploadProgress(0)

        try {
            const supabase = createClient()

            // Sanitize filename
            const timestamp = Date.now()
            const sanitizedTitle = formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
            const fileExt = formData.file.name.split('.').pop()
            const fileName = `${timestamp}_${sanitizedTitle}.${fileExt}`

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('ambient-sounds')
                .upload(fileName, formData.file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('ambient-sounds')
                .getPublicUrl(fileName)

            // Get audio duration (if possible)
            let duration: number | null = null
            try {
                const audio = new Audio(URL.createObjectURL(formData.file))
                await new Promise((resolve) => {
                    audio.addEventListener('loadedmetadata', () => {
                        duration = Math.round(audio.duration)
                        resolve(null)
                    })
                })
            } catch (err) {
                console.log('Could not get duration:', err)
            }

            // Save metadata to database
            const { error: dbError } = await supabase
                .from('ambient_sounds')
                .insert({
                    title: formData.title,
                    description: formData.description || null,
                    file_url: publicUrl,
                    file_name: fileName,
                    file_size: formData.file.size,
                    duration: duration,
                    category: formData.category,
                    is_active: formData.is_active,
                    created_by: currentUser?.id
                })

            if (dbError) throw dbError

            setToast({ message: 'Sound uploaded successfully!', variant: 'success' })
            setIsCreateOpen(false)
            setFormData({
                title: '',
                description: '',
                category: 'nature',
                is_active: true,
                file: null
            })

            // Refresh sounds list
            const { data: soundsData } = await supabase
                .from('ambient_sounds')
                .select('*')
                .order('created_at', { ascending: false })

            if (soundsData) {
                setSounds(soundsData)
                setFilteredSounds(soundsData)
            }
        } catch (error: any) {
            console.error('Error uploading sound:', error)
            setToast({ message: error.message || 'Failed to upload sound', variant: 'error' })
        } finally {
            setIsSubmitting(false)
            setUploadProgress(0)
        }
    }

    const handleDelete = async () => {
        if (!deletingSound) return

        setIsSubmitting(true)

        try {
            const supabase = createClient()

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('ambient-sounds')
                .remove([deletingSound.file_name])

            if (storageError) console.error('Storage deletion error:', storageError)

            // Delete from database
            const { error: dbError } = await supabase
                .from('ambient_sounds')
                .delete()
                .eq('id', deletingSound.id)

            if (dbError) throw dbError

            setToast({ message: 'Sound deleted successfully', variant: 'success' })
            setDeletingSound(null)

            // Refresh sounds list
            const { data: soundsData } = await supabase
                .from('ambient_sounds')
                .select('*')
                .order('created_at', { ascending: false })

            if (soundsData) {
                setSounds(soundsData)
                setFilteredSounds(soundsData)
            }
        } catch (error: any) {
            console.error('Error deleting sound:', error)
            setToast({ message: error.message || 'Failed to delete sound', variant: 'error' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const togglePlay = (sound: AmbientSound) => {
        if (playingId === sound.id) {
            audioElement?.pause()
            setPlayingId(null)
        } else {
            if (audioElement) {
                audioElement.pause()
            }

            const audio = new Audio(sound.file_url)
            audio.volume = 0.5
            audio.play()
            setAudioElement(audio)
            setPlayingId(sound.id)

            audio.onended = () => {
                setPlayingId(null)
            }
        }
    }

    const toggleActive = async (sound: AmbientSound) => {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('ambient_sounds')
                .update({ is_active: !sound.is_active })
                .eq('id', sound.id)

            if (error) throw error

            setToast({ message: `Sound ${!sound.is_active ? 'activated' : 'deactivated'}`, variant: 'success' })
        } catch (error: any) {
            console.error('Error updating sound:', error)
            setToast({ message: 'Failed to update sound status', variant: 'error' })
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'Unknown'
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(2)} MB`
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return 'Unknown'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
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
            other: 'from-primary/20 via-secondary/10 to-primary/20'
        }
        return gradients[category] || gradients.other
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
                    <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
                        <MobileMenuButton />
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                                <Music size={20} className="text-secondary" />
                                Ambient Sounds
                            </h1>
                        </div>
                    </div>
                </header>
                <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
                    <div className="card">
                        <div className="animate-pulse space-y-4 p-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-backplate rounded"></div>
                            ))}
                        </div>
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
                            <Music size={20} className="text-secondary" />
                            Ambient Sounds
                        </h1>
                        <p className="text-on-surface-secondary text-xs hidden sm:block">
                            {filteredSounds.length} sound{filteredSounds.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <UserMenu email={currentUser?.email} username={profile?.username} />
                </div>
            </header>

            <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
                {/* Header Section */}
                <div className="mb-8">
                    <BackButton />
                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Sound Library</h2>
                            <p className="text-on-surface-secondary">
                                Manage ambient sounds for users • {filteredSounds.length} total
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
                                : 'Upload your first ambient sound to get started'}
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredSounds.map((sound) => (
                            <div
                                key={sound.id}
                                className="group card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Subtle gradient background */}
                                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="relative flex items-start gap-4">
                                    {/* Play Button with Animation */}
                                    <button
                                        onClick={() => togglePlay(sound)}
                                        className="flex-0 p-4 rounded-full bg-linear-to-br from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
                                    >
                                        {playingId === sound.id ? (
                                            <div className="relative">
                                                <Pause size={22} className="text-primary relative z-10" />
                                                <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
                                            </div>
                                        ) : (
                                            <Play size={22} className="text-primary ml-0.5" />
                                        )}
                                    </button>

                                    {/* Sound Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                                                    {sound.title}
                                                </h3>
                                                {sound.description && (
                                                    <p className="text-sm text-on-surface-secondary line-clamp-2 mt-1">
                                                        {sound.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-0">
                                                <label className="relative flex items-center gap-2 cursor-pointer group/toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={sound.is_active}
                                                        onChange={() => toggleActive(sound)}
                                                        className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary transition-all"
                                                    />
                                                    <span className={`text-xs font-medium transition-colors ${sound.is_active ? 'text-success' : 'text-on-surface-secondary'}`}>
                                                        {sound.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </label>
                                                <button
                                                    onClick={() => setDeletingSound(sound)}
                                                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-all hover:scale-110"
                                                    title="Delete sound"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Metadata with Icons */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-primary/15 to-primary/10 text-primary rounded-full font-semibold">
                                                <Music size={12} />
                                                {sound.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-backplate rounded-full text-on-surface-secondary">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatDuration(sound.duration)}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-backplate rounded-full text-on-surface-secondary">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                {formatFileSize(sound.file_size)}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-backplate rounded-full text-on-surface-secondary">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {sound.play_count} plays
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                                <Upload size={24} className="text-primary" />
                                Upload Sound
                            </h2>
                            <button
                                onClick={() => !isSubmitting && setIsCreateOpen(false)}
                                disabled={isSubmitting}
                                className="p-2 hover:bg-backplate rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Music size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-on-surface mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Ocean Waves, Rain Forest, White Noise"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-on-surface mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the sound..."
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="category" className="block text-sm font-semibold text-on-surface mb-2">
                                    Category *
                                </label>
                                <Select
                                    id="category"
                                    value={formData.category}
                                    onChange={(value) => setFormData({ ...formData, category: value })}
                                    options={formCategoryOptions}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label htmlFor="file" className="block text-sm font-semibold text-on-surface mb-2">
                                    Audio File *
                                </label>
                                <input
                                    type="file"
                                    id="file"
                                    accept="audio/*"
                                    required
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-on-surface-secondary mt-1">
                                    Supported: MP3, WAV, OGG, WebM, AAC (Max 50MB)
                                </p>
                                {formData.file && (
                                    <p className="text-xs text-success mt-1">
                                        Selected: {formData.file.name} ({formatFileSize(formData.file.size)})
                                    </p>
                                )}
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="is_active" className="text-sm text-on-surface">
                                    Make sound active immediately
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.file}
                                    className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Upload Sound
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={isSubmitting}
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
                    isLoading={isSubmitting}
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

