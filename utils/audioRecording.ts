/**
 * Audio Recording Utilities
 * Handles MediaRecorder API and audio blob management
 */

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0
  private pausedTime: number = 0

  /**
   * Request microphone permission and initialize recorder
   */
  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // Use webm format for best browser support
      const mimeType = this.getSupportedMimeType()

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000 // 128kbps for good quality
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied. Please enable microphone access in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.')
      } else {
        throw new Error(`Failed to initialize audio recorder: ${error.message}`)
      }
    }
  }

  /**
   * Get the best supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return '' // Browser will use default
  }

  /**
   * Start recording
   */
  start(): void {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized')
    }

    if (this.mediaRecorder.state === 'recording') {
      return
    }

    this.audioChunks = []
    this.startTime = Date.now()
    this.mediaRecorder.start(1000) // Collect data every second
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return
    }

    this.pausedTime = Date.now()
    this.mediaRecorder.pause()
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      return
    }

    this.startTime += Date.now() - this.pausedTime
    this.mediaRecorder.resume()
  }

  /**
   * Stop recording and return the audio blob
   */
  async stop(): Promise<{ blob: Blob; url: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not initialized'))
        return
      }

      if (this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recorder is not active'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType })
        const url = URL.createObjectURL(blob)
        const duration = Math.floor((Date.now() - this.startTime) / 1000)

        resolve({ blob, url, duration })
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * Get current recording duration in seconds
   */
  getCurrentDuration(): number {
    if (this.startTime === 0) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  /**
   * Cleanup and release microphone
   */
  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    this.mediaRecorder = null
    this.audioChunks = []
    this.startTime = 0
    this.pausedTime = 0
  }

  /**
   * Get recorder state
   */
  getState(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder?.state || 'inactive'
  }
}

/**
 * Format seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if browser supports audio recording
 */
export function isAudioRecordingSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  )
}

/**
 * Get audio format from blob
 */
export function getAudioFormat(blob: Blob): string {
  const type = blob.type.toLowerCase()

  if (type.includes('webm')) return 'webm'
  if (type.includes('mp4')) return 'mp4'
  if (type.includes('ogg')) return 'ogg'
  if (type.includes('wav')) return 'wav'
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3'

  return 'unknown'
}

