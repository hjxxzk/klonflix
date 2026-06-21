<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbarOverview from '@/components/overview/AppNavbarOverview.vue'
import AppVideoPlayer from '@/components/playback/AppVideoPlayer.vue'
import { fetchPlaybackContent, startPlayback } from '@/api/playback'
import { useAuthStore } from '@/stores/auth.ts'
import type { ContentPlaybackDetails } from '@/types/ContentPlayback'
import { formatDuration } from '@/utils/youtube'
import { ApiError } from '@/api/client'

const route = useRoute()
const auth = useAuthStore()

const content = ref<ContentPlaybackDetails | null>(null)
const resumeFromSeconds = ref(0)
const isLoading = ref(true)
const apiError = ref<string | null>(null)

async function loadPlayback(): Promise<void> {
  const contentId = String(route.params.contentId ?? '')
  const token = auth.user?.accessToken

  content.value = null
  resumeFromSeconds.value = 0
  apiError.value = null
  isLoading.value = true

  if (!contentId) {
    apiError.value = 'Brak identyfikatora treści.'
    isLoading.value = false
    return
  }

  if (!token) {
    apiError.value = 'Brak sesji użytkownika.'
    isLoading.value = false
    return
  }

  try {
    const playbackContent = await fetchPlaybackContent(contentId, token)

    if (!playbackContent) {
      apiError.value = 'Nie znaleziono materiału do odtworzenia.'
      return
    }

    content.value = playbackContent

    const playback = await startPlayback(contentId, token)
    resumeFromSeconds.value = playback.resumeFromSeconds
  } catch (error) {
    if (error instanceof ApiError) {
      apiError.value = error.message
    } else {
      apiError.value = 'Nie udało się rozpocząć odtwarzania.'
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadPlayback()
})

watch(
  () => route.params.contentId,
  (contentId, previousContentId) => {
    if (contentId && contentId !== previousContentId) {
      void loadPlayback()
    }
  },
)
</script>

<template>
  <div class="page">
    <AppNavbarOverview />

    <main class="content">
      <section class="playback-panel">
        <header class="playback-header">
          <p class="playback-label">Odtwarzanie</p>
          <h1 class="playback-title">{{ content?.title ?? 'Materiał wideo' }}</h1>

          <div v-if="content" class="playback-meta">
            <span class="meta-item">Czas trwania: {{ formatDuration(content.durationSec) }}</span>
            <span class="meta-item">
              Języki:
              <span v-for="language in content.videoLanguages" :key="language" class="language-badge">
                {{ language }}
              </span>
            </span>
          </div>
        </header>

        <div v-if="isLoading" class="status-message">Ładowanie odtwarzacza...</div>

        <div v-else-if="apiError" class="alert alert-danger" role="alert">
          {{ apiError }}
        </div>

        <AppVideoPlayer
          v-else-if="content"
          :content="content"
          :resume-from-seconds="resumeFromSeconds"
        />
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  padding: 2rem 1.5rem 3rem;
}

.playback-panel {
  width: 100%;
  max-width: 1100px;
}

.playback-header {
  margin-bottom: 1.5rem;
}

.playback-label {
  margin: 0 0 0.25rem;
  color: $primary;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.playback-title {
  margin: 0 0 1rem;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: $white;
}

.playback-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  color: rgba($white, 0.85);
  font-size: 0.95rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.language-badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border: 1px solid rgba($primary, 0.5);
  border-radius: 999px;
  color: $primary;
  font-size: 0.85rem;
}

.status-message {
  padding: 2rem;
  text-align: center;
  color: rgba($white, 0.75);
  background: $accent;
  border-radius: 8px;
}
</style>
