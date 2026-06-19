declare namespace YT {
  interface Player {
    getCurrentTime(): number
    destroy(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
  }

  enum PlayerState {
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerOptions {
    height?: string | number
    width?: string | number
    videoId: string
    playerVars?: Record<string, string | number>
    events?: {
      onReady?: (event: { target: Player }) => void
      onStateChange?: (event: { data: number; target: Player }) => void
    }
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions)
  }
}

interface Window {
  YT?: typeof YT
  onYouTubeIframeAPIReady?: () => void
}
