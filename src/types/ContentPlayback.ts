export interface ContentPlaybackData {
  contentId: string
  videoUri: string
  durationSec: number
  videoLanguages: string[]
}

export interface PlaybackResponse {
  playbackId: string
  uri: string
  language: string
  resumeFromSeconds: number
  resumed: boolean
}
