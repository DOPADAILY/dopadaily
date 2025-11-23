'use client'

import { useState, useEffect } from 'react'
import { Award, Plus, Edit2, Trash2, CheckCircle, XCircle, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Modal from '@/components/Modal'
import ConfirmModal from '@/components/ConfirmModal'
import Select from '@/components/Select'
import BackButton from '@/components/BackButton'
import Toast from '@/components/Toast'

interface Milestone {
    id: number
    title: string
    description: string
    session_threshold: number
    badge_icon: string
    badge_color: string
    is_active: boolean
}

interface MilestonesClientProps {
    milestones: Milestone[]
}

export default function MilestonesClient({ milestones: initialMilestones }: MilestonesClientProps) {
    const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
    const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' | 'warning' } | null>(null)
    const [showToast, setShowToast] = useState(false)

    const emojiOptions = ['🌱', '🎯', '⚡', '🔥', '💎', '👑', '🏆', '🧘', '✨', '🌟', '💪', '🎉', '🚀', '🌈', '🎨']
    const emojiSelectOptions = emojiOptions.map(emoji => ({ value: emoji, label: emoji }))

    // Update local state when parent updates
    useEffect(() => {
        setMilestones(initialMilestones)
    }, [initialMilestones])

    const fetchMilestones = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('milestones')
            .select('*')
            .order('session_threshold', { ascending: true })

        if (error) {
            console.error('Error fetching milestones:', error)
        } else {
            setMilestones(data || [])
        }
    }

    const handleCreateMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const supabase = createClient()

        const { error } = await supabase.from('milestones').insert({
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            session_threshold: parseInt(formData.get('session_threshold') as string),
            badge_icon: formData.get('badge_icon') as string,
            badge_color: formData.get('badge_color') as string,
            is_active: formData.get('is_active') === 'on',
        })

        setIsSubmitting(false)

        if (error) {
            console.error('Error creating milestone:', error)
            setToast({ message: 'Failed to create milestone', variant: 'error' })
            setShowToast(true)
        } else {
            setIsCreateOpen(false)
            await fetchMilestones()
            setToast({ message: 'Milestone created successfully', variant: 'success' })
            setShowToast(true)
        }
    }

    const handleUpdateMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const supabase = createClient()

        const { error } = await supabase
            .from('milestones')
            .update({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                session_threshold: parseInt(formData.get('session_threshold') as string),
                badge_icon: formData.get('badge_icon') as string,
                badge_color: formData.get('badge_color') as string,
                is_active: formData.get('is_active') === 'on',
            })
            .eq('id', parseInt(formData.get('id') as string))

        setIsSubmitting(false)

        if (error) {
            console.error('Error updating milestone:', error)
            setToast({ message: 'Failed to update milestone', variant: 'error' })
            setShowToast(true)
        } else {
            setEditingMilestone(null)
            await fetchMilestones()
            setToast({ message: 'Milestone updated successfully', variant: 'success' })
            setShowToast(true)
        }
    }

    const handleDeleteMilestone = async () => {
        if (!deletingMilestone) return
        setIsSubmitting(true)

        const supabase = createClient()
        const { error } = await supabase
            .from('milestones')
            .delete()
            .eq('id', deletingMilestone.id)

        setIsSubmitting(false)
        setDeletingMilestone(null)

        if (error) {
            console.error('Error deleting milestone:', error)
            setToast({ message: 'Failed to delete milestone', variant: 'error' })
            setShowToast(true)
        } else {
            await fetchMilestones()
            setToast({ message: 'Milestone deleted successfully', variant: 'success' })
            setShowToast(true)
        }
    }

    return (
        <>
            {/* Back Button and Actions */}
            <div className="mb-6 flex items-center justify-between">
                <BackButton />
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Milestone
                </button>
            </div>

            {/* Milestones Grid */}
            {milestones && milestones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {milestones.map((milestone) => (
                        <div key={milestone.id} className="card">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                                        {milestone.badge_icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-on-surface">{milestone.title}</h3>
                                        <p className="text-xs text-on-surface-secondary">
                                            {milestone.session_threshold} sessions
                                        </p>
                                    </div>
                                </div>
                                {milestone.is_active ? (
                                    <CheckCircle size={18} className="text-success" />
                                ) : (
                                    <XCircle size={18} className="text-neutral-medium" />
                                )}
                            </div>

                            <p className="text-sm text-on-surface-secondary mb-4 line-clamp-2">
                                {milestone.description}
                            </p>

                            <div className="flex items-center gap-2 pt-4 border-t border-border">
                                <button
                                    onClick={() => setEditingMilestone(milestone)}
                                    className="btn btn-ghost text-primary hover:bg-primary/10 flex items-center gap-2 flex-1 justify-center"
                                >
                                    <Edit2 size={16} />
                                    <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                    onClick={() => setDeletingMilestone(milestone)}
                                    className="btn btn-ghost text-error hover:bg-error/10 flex items-center gap-2 flex-1 justify-center"
                                >
                                    <Trash2 size={16} />
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 card">
                    <Award size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
                    <h2 className="text-xl font-semibold text-on-surface mb-2">No milestones yet</h2>
                    <p className="text-on-surface-secondary mb-6">
                        Create your first milestone to reward users for their progress!
                    </p>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn btn-primary inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Create First Milestone
                    </button>
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => !isSubmitting && setIsCreateOpen(false)}
                title="Create New Milestone"
            >
                <form onSubmit={handleCreateMilestone} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-on-surface mb-2">
                                Milestone Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="e.g., First Steps"
                            />
                        </div>

                        <div>
                            <label htmlFor="session_threshold" className="block text-sm font-semibold text-on-surface mb-2">
                                Sessions Required *
                            </label>
                            <input
                                type="number"
                                id="session_threshold"
                                name="session_threshold"
                                required
                                min="1"
                                className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="e.g., 5"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="badge_icon" className="block text-sm font-semibold text-on-surface mb-2">
                            Icon (Emoji) *
                        </label>
                        <Select
                            id="badge_icon"
                            name="badge_icon"
                            options={emojiSelectOptions}
                            defaultValue="🌱"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-on-surface mb-2">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                            placeholder="Describe what users achieve with this milestone..."
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="badge_color" className="block text-sm font-semibold text-on-surface mb-2">
                            Badge Color
                        </label>
                        <input
                            type="color"
                            id="badge_color"
                            name="badge_color"
                            defaultValue="#10b981"
                            className="w-full h-10 px-1 py-1 rounded-lg border border-border bg-backplate text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            defaultChecked
                            className="rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-on-surface">
                            Active (users can earn this milestone)
                        </label>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Create Milestone
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            className="btn btn-ghost"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            {editingMilestone && (
                <Modal
                    isOpen={!!editingMilestone}
                    onClose={() => !isSubmitting && setEditingMilestone(null)}
                    title="Edit Milestone"
                >
                    <form onSubmit={handleUpdateMilestone} className="space-y-6">
                        <input type="hidden" name="id" value={editingMilestone.id} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="edit-title" className="block text-sm font-semibold text-on-surface mb-2">
                                    Milestone Title *
                                </label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    name="title"
                                    required
                                    defaultValue={editingMilestone.title}
                                    className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label htmlFor="edit-sessions" className="block text-sm font-semibold text-on-surface mb-2">
                                    Sessions Required *
                                </label>
                                <input
                                    type="number"
                                    id="edit-sessions"
                                    name="session_threshold"
                                    required
                                    min="1"
                                    defaultValue={editingMilestone.session_threshold}
                                    className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit-badge-icon" className="block text-sm font-semibold text-on-surface mb-2">
                                Icon (Emoji) *
                            </label>
                            <Select
                                id="edit-badge-icon"
                                name="badge_icon"
                                options={emojiSelectOptions}
                                defaultValue={editingMilestone.badge_icon}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="edit-description" className="block text-sm font-semibold text-on-surface mb-2">
                                Description *
                            </label>
                            <textarea
                                id="edit-description"
                                name="description"
                                rows={3}
                                required
                                defaultValue={editingMilestone.description}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor="edit-badge-color" className="block text-sm font-semibold text-on-surface mb-2">
                                Badge Color
                            </label>
                            <input
                                type="color"
                                id="edit-badge-color"
                                name="badge_color"
                                defaultValue={editingMilestone.badge_color || '#10b981'}
                                className="w-full h-10 px-1 py-1 rounded-lg border border-border bg-backplate text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit-active"
                                name="is_active"
                                defaultChecked={editingMilestone.is_active}
                                className="rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor="edit-active" className="text-sm font-medium text-on-surface">
                                Active (users can earn this milestone)
                            </label>
                        </div>

                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingMilestone(null)}
                                className="btn btn-ghost"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deletingMilestone && (
                <ConfirmModal
                    isOpen={!!deletingMilestone}
                    onClose={() => setDeletingMilestone(null)}
                    onConfirm={handleDeleteMilestone}
                    title="Delete Milestone?"
                    message={`Are you sure you want to delete "${deletingMilestone.title}"? This action cannot be undone.`}
                    confirmText={isSubmitting ? 'Deleting...' : 'Delete'}
                    cancelText="Cancel"
                    variant="danger"
                />
            )}

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    isOpen={showToast}
                    message={toast.message}
                    variant={toast.variant}
                    onClose={() => {
                        setShowToast(false)
                        setToast(null)
                    }}
                />
            )}
        </>
    )
}

