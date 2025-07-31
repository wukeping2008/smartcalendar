export interface AudioDeviceInfo {
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
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
  getAvailableVoices(): Promise<any[]>
  getStatus(): {
    transcriptionReady: boolean
    synthesisReady: boolean
    hasPermission: boolean
  }
  destroy(): void
}
