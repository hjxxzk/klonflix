let youtubeApiPromise: Promise<void> | null = null

export function extractYouTubeVideoId(uri: string): string | null {
  try {
    const url = new URL(uri)

    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1) || null
    }

    return url.searchParams.get('v')
  } catch {
    return null
  }
}

export function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve()
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady

      window.onYouTubeIframeAPIReady = () => {
        previousReady?.()
        resolve()
      }

      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    })
  }

  return youtubeApiPromise
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }

  return `${minutes} min`
}
