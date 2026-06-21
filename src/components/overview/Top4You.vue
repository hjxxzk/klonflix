<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import TopItem from '@/components/overview/TopItem.vue'
import { useAuthStore } from '@/stores/auth'
import { getRecommendedLibrary } from '@/api/library'
import type { ContentType } from '@/types/LibraryContent.ts'

type Item = {
  id: string
  thumbnail?: string
  title?: string
  contentType?: ContentType
}

const auth = useAuthStore()
const items = ref<Item[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const track = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let controller: AbortController | null = null

function updateScrollButtons() {
  const element = track.value
  if (!element) {
    return
  }
  canScrollLeft.value = element.scrollLeft > 10
  canScrollRight.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 10
}

function scrollByDirection(direction: number) {
  const element = track.value
  if (!element) {
    return
  }
  const amount = Math.max(260, element.clientWidth * 0.72)
  element.scrollBy({
    left: direction * amount,
    behavior: 'smooth',
  })
}

function onTrackKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    scrollByDirection(1)
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    scrollByDirection(-1)
  }
}

async function fetchRecommendations() {
  const token = auth.user?.accessToken
  controller?.abort()
  controller = new AbortController()
  isLoading.value = true
  loadError.value = null

  try {
    if (!token) {
      items.value = []
      return
    }

    const data = await getRecommendedLibrary(token, controller.signal)
    items.value = data.slice(0, 10).map((content) => ({
      id: content.id,
      thumbnail: content.thumbnailUrl,
      title: content.title || undefined,
      contentType: content.contentType || undefined,
    }))

    await nextTick()
    requestAnimationFrame(() => {
      updateScrollButtons()
    })
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return
    }
    loadError.value = err instanceof Error ? err.message : String(err)
    items.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const element = track.value
  element?.addEventListener('scroll', updateScrollButtons, { passive: true })
  window.addEventListener('resize', updateScrollButtons)
  void fetchRecommendations()
})

onBeforeUnmount(() => {
  track.value?.removeEventListener('scroll', updateScrollButtons)
  window.removeEventListener('resize', updateScrollButtons)
  controller?.abort()
})
</script>

<template>
  <div class="top10-list">
    <button
      class="nav left"
      type="button"
      :disabled="!canScrollLeft"
      aria-label="Przewiń w lewo"
      @click="scrollByDirection(-1)"
    >
      ‹
    </button>

    <div
      ref="track"
      class="track"
      role="list"
      tabindex="0"
      aria-label="Najlepsze propozycje"
      @keydown="onTrackKeydown"
    >
      <template v-if="isLoading">
        <div v-for="index in 4" :key="index" class="track-item" aria-hidden="true">
          <div class="top-skeleton">
            <div class="skeleton-rank" />
            <div class="skeleton-poster" />
          </div>
        </div>
      </template>

      <div v-for="(item, index) in items" v-else :key="item.id" class="track-item" role="listitem">
        <TopItem
          :rank="index + 1"
          :thumbnail="item.thumbnail"
          :id="item.id"
          :name="item.title"
          :content-type="item.contentType"
        />
      </div>
    </div>

    <button
      class="nav right"
      type="button"
      :disabled="!canScrollRight"
      aria-label="Przewiń w prawo"
      @click="scrollByDirection(1)"
    >
      ›
    </button>
  </div>

  <div v-if="loadError" class="recommendation-error" role="alert">
    Nie udało się pobrać rekomendacji: {{ loadError }}
  </div>

  <div v-else-if="!isLoading && !items.length" class="recommendation-empty">
    Brak rekomendacji do wyświetlenia.
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.top10-list {
  position: relative;
  display: grid;
  width: 100%;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 0.5rem;
}

.track {
  display: flex;
  width: 100%;
  gap: 1rem;
  padding: 0.75rem 0.25rem 1.25rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid rgba($primary, 0.25);
    outline-offset: 5px;
    border-radius: 12px;
  }
}

.track-item {
  width: clamp(250px, 24vw, 340px);
  flex: 0 0 auto;
  scroll-snap-align: start;
}

.nav {
  position: relative;
  z-index: 5;
  display: flex;
  width: 44px;
  height: 72px;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 2rem;
  cursor: pointer;
  background: linear-gradient(145deg, rgba($accent, 0.85), rgba($black, 0.95));
  border: 1px solid rgba($primary, 0.18);
  border-radius: 12px;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;

  &:hover:not(:disabled) {
    color: $black;
    background: $primary;
    border-color: $primary;
    transform: scale(1.05);
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.22;
  }
}

.top-skeleton {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: end;
  min-height: 150px;
}

.skeleton-rank,
.skeleton-poster {
  background: linear-gradient(
    110deg,
    rgba($white, 0.04) 8%,
    rgba($white, 0.1) 18%,
    rgba($white, 0.04) 33%
  );
  background-size: 200% 100%;
  animation: shimmer 1.35s linear infinite;
}

.skeleton-rank {
  width: 56px;
  height: 90px;
  border-radius: 10px;
}

.skeleton-poster {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
}

.recommendation-error,
.recommendation-empty {
  margin-top: 0.5rem;
  padding: 1rem;
  color: rgba($white, 0.7);
  font-size: 0.82rem;
  text-align: center;
  background: rgba($accent, 0.5);
  border: 1px solid rgba($white, 0.06);
  border-radius: 10px;
}

.recommendation-error {
  color: #ffabab;
  border-color: rgba(255, 80, 80, 0.16);
}

@keyframes shimmer {
  to {
    background-position-x: -200%;
  }
}

@media (max-width: 720px) {
  .top10-list {
    grid-template-columns: 34px minmax(0, 1fr) 34px;
  }

  .track-item {
    width: 250px;
  }

  .nav {
    width: 34px;
    height: 62px;
    font-size: 1.5rem;
  }
}
</style>
