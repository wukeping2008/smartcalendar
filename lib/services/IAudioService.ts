export interface AudioDeviceInfo {
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
}

export interface VoiceInfo {
  id: string
  name: string
  language: string
  gender?: 'male' | 'female' | 'neutral'
  locale?: string
  isDefault?: boolean
  isLocal?: boolean
}

export interface IAudioService {
  initTranscription(deviceId?: string): Promise<void>
  initSynthesis(): Promise<void>
  startTranscription(): Promise<void>
  stopTranscription(): Promise<void>
  synthesizeAndPlay(text: string, voiceId?: string): Promise<void>
  pauseSynthesis(): Promise<void>
  resumeSynthesis(): Promise<void>
  interruptSynthesis(): Promise<void>
  onTranscriptionUpdate(callback: (text: string, isFinal: boolean) => void): void
  onError(callback: (error: unknown) => void): void
  getAudioDevices(): Promise<AudioDeviceInfo>
  getAvailableVoices(): Promise<VoiceInfo[]>
  getStatus(): {
    transcriptionReady: boolean
    synthesisReady: boolean
    hasPermission: boolean
  }
  destroy(): void
}
