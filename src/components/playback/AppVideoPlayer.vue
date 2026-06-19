<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.ts'
import { completePlayback, saveProgress, saveProgressOnUnload } from '@/api/playback'
import type { ContentPlaybackData } from '@/types/ContentPlayback'
import { extractYouTubeVideoId, loadYouTubeApi } from '@/utils/youtube'

const props = withDefaults(
  defineProps<{
    content: ContentPlaybackData
    resumeFromSeconds?: number
  }>(),
  {
    resumeFromSeconds: 0,
  },
)

const auth = useAuthStore()
const playerContainer = ref<HTMLDivElement | null>(null)
const playerError = ref<string | null>(null)
const isPlayerReady = ref(false)

let player: YT.Player | null = null
let lastSavedPosition = -1
let hasCompleted = false
let isSavingProgress = false

function getCurrentPosition(): number {
  if (!player) {
    return props.resumeFromSeconds
  }

  return Math.floor(player.getCurrentTime())
}

async function persistProgress(positionSeconds: number): Promise<void> {
  const token = auth.user?.accessToken
  if (!token || positionSeconds < 0 || positionSeconds === lastSavedPosition) {
    return
  }

  if (isSavingProgress) {
    return
  }

  isSavingProgress = true

  try {
    await saveProgress(props.content.contentId, positionSeconds, token)
    lastSavedPosition = positionSeconds
  } catch {
    // Progress save failures should not block playback.
  } finally {
    isSavingProgress = false
  }
}

async function handlePause(): Promise<void> {
  await persistProgress(getCurrentPosition())
}

async function handleEnded(): Promise<void> {
  if (hasCompleted) {
    return
  }

  const token = auth.user?.accessToken
  if (!token) {
    return
  }

  hasCompleted = true

  try {
    await completePlayback(props.content.contentId, token)
  } catch {
    hasCompleted = false
  }
}

function handleUnload(): void {
  const token = auth.user?.accessToken
  if (!token || hasCompleted) {
    return
  }

  const position = getCurrentPosition()
  if (position < 0 || position === lastSavedPosition) {
    return
  }

  saveProgressOnUnload(props.content.contentId, position, token)
}

function handleStateChange(event: { data: number; target: YT.Player }): void {
  if (event.data === YT.PlayerState.PAUSED) {
    void handlePause()
    return
  }

  if (event.data === YT.PlayerState.ENDED) {
    void handleEnded()
  }
}

async function initPlayer(): Promise<void> {
  const videoId = extractYouTubeVideoId(props.content.videoUri)
  if (!videoId) {
    playerError.value = 'Nie udało się odczytać identyfikatora wideo YouTube.'
    return
  }

  if (!playerContainer.value) {
    return
  }

  await loadYouTubeApi()

  if (!window.YT?.Player) {
    playerError.value = 'Nie udało się załadować odtwarzacza YouTube.'
    return
  }

  const startSeconds = props.resumeFromSeconds

  player = new window.YT.Player(playerContainer.value, {
    videoId,
    width: '100%',
    height: '100%',
    playerVars: {
      start: startSeconds,
      rel: 0,
      modestbranding: 1,
    },
    events: {
      onReady: (event) => {
        isPlayerReady.value = true

        if (startSeconds > 0) {
          event.target.seekTo(startSeconds, true)
        }
      },
      onStateChange: handleStateChange,
    },
  })
}

function destroyPlayer(): void {
  handleUnload()
  player?.destroy()
  player = null
}

onMounted(() => {
  window.addEventListener('pagehide', handleUnload)
  window.addEventListener('beforeunload', handleUnload)
  void initPlayer()
})

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', handleUnload)
  window.removeEventListener('beforeunload', handleUnload)
  destroyPlayer()
})

watch(
  () => props.resumeFromSeconds,
  (resumeFromSeconds) => {
    if (isPlayerReady.value && player && resumeFromSeconds > 0) {
      player.seekTo(resumeFromSeconds, true)
    }
  },
)
</script>

<template>
  <div class="video-player">
    <div v-if="playerError" class="alert alert-danger" role="alert">
      {{ playerError }}
    </div>

    <div v-else class="player-wrapper">
      <div ref="playerContainer" class="player-container" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.video-player {
  width: 100%;
}

.player-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: $accent;
  border: 1px solid rgba($white, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.player-container {
  width: 100%;
  height: 100%;
}
</style>
