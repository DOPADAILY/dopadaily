'use client'

import { useState } from 'react'
import { FileText, X, Edit2, Plus, Loader2, Mic, Type } from 'lucide-react'
import Select from '@/components/Select'
import { Note, NoteCategory, NoteColor } from '@/app/notes/actions'
import VoiceRecorder from '@/components/VoiceRecorder'
import SignedAudioPlayer from '@/components/SignedAudioPlayer'
import { useUploadVoiceNote, useDeleteVoiceNoteFile, useVoiceNoteLimit, useIsPremium } from '@/hooks/queries'
import Toast from '@/components/Toast'
import UpgradePrompt from '@/components/UpgradePrompt'

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'focus', label: 'Focus' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'reflections', label: 'Reflections' },
  { value: 'goals', label: 'Goals' },
]

const colorOptions: { value: NoteColor; label: string; class: string }[] = [
  { value: 'default', label: 'Default', class: 'bg-surface-elevated border-border' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' },
  { value: 'green', label: 'Green', class: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' },
  { value: 'yellow', label: 'Yellow', class: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800' },
]

interface NoteFormModalProps {
  note?: Note | null
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  title: string
  isSubmitting: boolean
}

export default function NoteFormModal({
  note,
  onSubmit,
  onCancel,
  title,
  isSubmitting
}: NoteFormModalProps) {
  // Use controlled state initialized from props - won't reset on re-renders
  const [formTitle, setFormTitle] = useState(note?.title || '')
  const [formContent, setFormContent] = useState(note?.content || '')
  const [formCategory, setFormCategory] = useState<NoteCategory>(note?.category || 'general')
  const [formColor, setFormColor] = useState<NoteColor>(note?.color || 'default')

  // Voice note state
  const [noteType, setNoteType] = useState<'text' | 'voice'>(note?.audio_url ? 'voice' : 'text')
  const [showRecorder, setShowRecorder] = useState(false)
  const [audioData, setAudioData] = useState<{
    url: string
    duration: number
    size: number
    format: string
  } | null>(
    note?.audio_url ? {
      url: note.audio_url,
      duration: note.audio_duration || 0,
      size: note.audio_size || 0,
      format: note.audio_format || 'webm'
    } : null
  )
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const uploadVoiceMutation = useUploadVoiceNote()
  const deleteVoiceFileMutation = useDeleteVoiceNoteFile()
  const { data: limits } = useVoiceNoteLimit()
  const { isPremium } = useIsPremium()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    try {
      // Upload the recording - returns path (not URL)
      const result = await uploadVoiceMutation.mutateAsync({ blob, duration })

      // Save the audio data to state so UI updates
      // Note: audio_url field stores the PATH, not the actual URL
      const audioInfo = {
        url: result.path, // This is actually the path - we use signed URLs for playback
        duration: result.duration,
        size: result.size,
        format: result.format
      }
      setAudioData(audioInfo)
      setShowRecorder(false)

      if (noteType === 'voice') {
        // Build FormData and submit immediately (skip validation)
        const formData = new FormData()
        if (note) formData.append('id', note.id)
        formData.append('title', formTitle)
        formData.append('content', formContent || '')
        formData.append('category', formCategory)
        formData.append('color', formColor)
        formData.append('audio_url', audioInfo.url) // This is the path
        formData.append('audio_duration', audioInfo.duration.toString())
        formData.append('audio_size', audioInfo.size.toString())
        formData.append('audio_format', audioInfo.format)

        onSubmit(formData)
      } else {
        setToast({
          message: 'Recording uploaded successfully',
          variant: 'success'
        })
      }
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to upload recording',
        variant: 'error'
      })
    }
  }


  const handleDeleteAudio = async () => {
    if (!audioData?.url) return

    if (!confirm('Delete this voice recording?')) return

    try {
      await deleteVoiceFileMutation.mutateAsync(audioData.url)
      setAudioData(null)
      setToast({
        message: 'Recording deleted',
        variant: 'success'
      })
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to delete recording',
        variant: 'error'
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate based on note type
    if (noteType === 'text') {
      // Text notes need content
      if (!formContent?.trim()) {
        setToast({
          message: 'Please add text content',
          variant: 'error'
        })
        return
      }
    } else if (noteType === 'voice') {
      // Voice notes need audio
      if (!audioData) {
        setToast({
          message: 'Please record and save a voice note first',
          variant: 'error'
        })
        return
      }
    }

    const formData = new FormData()
    if (note) formData.append('id', note.id)
    formData.append('title', formTitle)
    formData.append('content', formContent || '')
    formData.append('category', formCategory)
    formData.append('color', formColor)

    // Add audio data if exists
    if (audioData) {
      formData.append('audio_url', audioData.url)
      formData.append('audio_duration', audioData.duration.toString())
      formData.append('audio_size', audioData.size.toString())
      formData.append('audio_format', audioData.format)
    }

    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative bg-surface-elevated rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-surface-elevated border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-backplate transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Title <span className="text-on-surface-secondary font-normal">(optional)</span>
            </label>
            <input
              name="title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Give your note a title..."
              className="input w-full"
            />
          </div>

          {/* Note Type Toggle */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-3">Note Type</label>
            <div className="flex gap-2 p-1 bg-backplate rounded-lg">
              <button
                type="button"
                onClick={() => setNoteType('text')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${noteType === 'text'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-secondary hover:text-on-surface'
                  }`}
              >
                <Type size={18} />
                Text
              </button>
              <button
                type="button"
                onClick={() => setNoteType('voice')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${noteType === 'voice'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-secondary hover:text-on-surface'
                  }`}
              >
                <Mic size={18} />
                Voice
              </button>
            </div>
          </div>

          {/* Text Content */}
          {noteType === 'text' && (
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Content</label>
              <textarea
                name="content"
                rows={6}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="What's on your mind?"
                className="input w-full min-h-[150px] py-3 resize-none"
              />
            </div>
          )}

          {/* Voice Recording */}
          {noteType === 'voice' && (
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-3">Voice Recording</label>

              {/* Limit Check Warning */}
              {!isPremium && limits && !limits.canRecord && (
                <div className="mb-4 p-4 rounded-xl bg-error/10 border-2 border-error">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-error/20 flex items-center justify-center">
                      <Mic size={16} className="text-error" />
                    </div>
                    <div>
                      <div className="font-semibold text-error text-sm">Limit Reached</div>
                      <div className="text-sm text-on-surface-secondary mt-1">
                        You've used all {limits.maxRecordings} voice notes this month.
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUpgradePrompt(true)}
                        className="mt-2 text-sm text-primary hover:underline font-medium"
                      >
                        Upgrade to Premium for unlimited recordings →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showRecorder && !audioData && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isPremium && limits && !limits.canRecord) {
                      setShowUpgradePrompt(true)
                    } else {
                      setShowRecorder(true)
                    }
                  }}
                  disabled={!isPremium && limits && !limits.canRecord}
                  className="w-full p-8 border-2 border-dashed border-border hover:border-primary rounded-xl transition-colors flex flex-col items-center gap-3 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic size={32} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-on-surface">Start Voice Recording</div>
                    <div className="text-sm text-on-surface-secondary mt-1">
                      Click to record a voice note (max 15 minutes)
                    </div>
                    {!isPremium && limits && (
                      <div className="text-xs text-primary mt-2 font-medium">
                        {limits.remainingRecordings} of {limits.maxRecordings} recordings left this month
                      </div>
                    )}
                  </div>
                </button>
              )}

              {showRecorder && (
                <VoiceRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onCancel={() => setShowRecorder(false)}
                  maxDuration={900}
                  isUploading={uploadVoiceMutation.isPending}
                />
              )}

              {audioData && !showRecorder && (
                <div className="space-y-3">
                  <SignedAudioPlayer
                    audioPath={audioData.url}
                    duration={audioData.duration}
                    onDelete={handleDeleteAudio}
                    showDelete={true}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecorder(true)}
                    className="w-full text-sm text-primary hover:underline"
                  >
                    Record again
                  </button>
                </div>
              )}

              {/* Optional text note for voice recordings */}
              {audioData && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Additional Notes <span className="text-on-surface-secondary font-normal">(optional)</span>
                  </label>
                  <textarea
                    name="content"
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Add any additional text notes..."
                    className="input w-full py-3 resize-none"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Category</label>
              <Select
                name="category"
                value={formCategory}
                onChange={(value) => setFormCategory(value as NoteCategory)}
                options={categoryOptions}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <label key={color.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color.value}
                      checked={formColor === color.value}
                      onChange={() => setFormColor(color.value)}
                      className="sr-only peer"
                    />
                    <div className={`w-8 h-8 rounded-lg border-2 ${color.class} peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 transition-all`} />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Only show submit button for text notes or when editing */}
          {(noteType === 'text' || note) && (
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting || uploadVoiceMutation.isPending}
            >
              {isSubmitting || uploadVoiceMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {note ? <Edit2 size={18} /> : <Plus size={18} />}
                  {note ? 'Update Note' : 'Create Note'}
                </>
              )}
            </button>
          )}
        </form>
      </div>

      {/* Toast Notifications */}
      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        variant={toast?.variant || 'success'}
        onClose={() => setToast(null)}
      />

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-md">
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-backplate transition-colors z-10"
            >
              <X size={20} />
            </button>
            <UpgradePrompt
              variant="modal"
              feature="unlimited voice notes"
              description="You've reached your monthly limit of voice recordings. Upgrade to Premium for unlimited voice notes, longer recordings, and more features!"
              onClose={() => setShowUpgradePrompt(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

