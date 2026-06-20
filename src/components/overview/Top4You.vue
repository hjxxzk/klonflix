<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import TopItem from '@/components/overview/TopItem.vue'
import { useAuthStore } from '@/stores/auth'
import { getRecommendedLibrary } from '@/api/library'

type Item = {
  id: string
  thumbnail?: string
  title?: string
}

const items = ref<Item[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)

const track = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

let controller: AbortController | null = null

function updateScrollButtons() {
  if (!track.value) return
  const el = track.value
  canScrollLeft.value = el.scrollLeft > 10
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
}

function scrollByDirection(dir: number) {
  if (!track.value) return
  const amount = Math.max(240, track.value.clientWidth * 0.6)
  track.value.scrollBy({ left: dir * amount, behavior: 'smooth' })
}

function onTrackKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    scrollByDirection(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    scrollByDirection(-1)
  }
}

async function fetchRecommendations() {
  const auth = useAuthStore()
  const token = auth.user?.accessToken ?? ''

  if (controller) {
    controller.abort()
  }
  controller = new AbortController()
  isLoading.value = true
  loadError.value = null

  try {
    const data = await getRecommendedLibrary(token, controller.signal)
    items.value = data.map((c) => ({
      id: c.id,
      thumbnail: c.thumbnailUrl,
      title: c.title || undefined,
    }))

    await nextTick()
    updateScrollButtons()
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name?: unknown }).name === 'AbortError'
    ) {
      return
    }

    if (err instanceof Error) {
      loadError.value = err.message
    } else {
      loadError.value = String(err)
    }

    items.value = Array.from({ length: 6 }).map((_, i) => ({
      id: `fallback-${i + 1}`,
      thumbnail: '',
      title: `Top item ${i + 1}`,
    }))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  updateScrollButtons()
  const el = track.value
  if (el) {
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
  }
  window.addEventListener('resize', updateScrollButtons)

  fetchRecommendations()
})

onBeforeUnmount(() => {
  const el = track.value
  if (el) el.removeEventListener('scroll', updateScrollButtons)
  window.removeEventListener('resize', updateScrollButtons)
  if (controller) controller.abort()
})
</script>

<template>
  <div class="top10-list">
    <button
      class="nav left"
      @click="scrollByDirection(-1)"
      :disabled="!canScrollLeft"
      :aria-disabled="!canScrollLeft"
      aria-label="Scroll left"
    >
      ‹
    </button>

    <div class="track" ref="track" role="list" tabindex="0" @keydown="onTrackKeydown">
      <div class="track-item" v-for="(item, i) in items" :key="item.id" role="listitem">
        <TopItem :rank="i + 1" :thumbnail="item.thumbnail" :id="item.id" :name="item.title" />
      </div>

      <div v-if="isLoading" class="track-item" aria-hidden="true">
        <div
          style="
            width: 260px;
            height: 88px;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 6px;
          "
        ></div>
      </div>
    </div>

    <button
      class="nav right"
      @click="scrollByDirection(1)"
      :disabled="!canScrollRight"
      :aria-disabled="!canScrollRight"
      aria-label="Scroll right"
    >
      ›
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.top10-list {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.track {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  display: flex;
  gap: 12px;
  padding: 8px 0;
  width: 100%;

  scrollbar-width: none;
  -ms-overflow-style: none;
}
.track::-webkit-scrollbar {
  display: none;
  height: 0;
}

.track-item {
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: 260px;
}

.nav {
  background: transparent;
  color: $white;
  border: none;
  width: 48px;
  height: 80px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
}

.nav.left {
  justify-self: start;
}

.nav.right {
  justify-self: end;
}

.nav:focus {
  outline: 2px solid rgba(255, 255, 255, 0.12);
}

.nav[disabled] {
  opacity: 0.45;
  cursor: default;
  pointer-events: none;
}

@media (max-width: 720px) {
  .track-item {
    width: 200px;
  }

  .nav {
    width: 40px;
    height: 64px;
    font-size: 1.25rem;
  }
}
</style>
