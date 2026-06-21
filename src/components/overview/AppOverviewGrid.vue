<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getLibraryPage, type LibraryItem } from '@/api/library'
import { ContentType } from '@/types/LibraryContent.ts'
import placeholder from '@/resources/logo.png'

const auth = useAuthStore()
const router = useRouter()
const items = ref<LibraryItem[]>([])
const hasNextPage = ref(false)
const pageSize = ref(6)
const currentPage = ref(1)
const isLoading = ref(false)
const error = ref<string | null>(null)
let controller: AbortController | null = null
const hasItems = computed(() => items.value.length > 0)
const showEmptyState = computed(() => {
  return !isLoading.value && !error.value && !hasItems.value
})

function goToBrowse(id?: string | number, contentType?: ContentType) {
  if (id === undefined || id === null) {
    return
  }
  switch (contentType) {
    case ContentType.MOVIE:
      void router.push(`/browse/movie/${id}`)
      break
    case ContentType.SERIES:
      void router.push(`/browse/series/${id}`)
      break
  }
}

function contentTypeLabel(contentType?: ContentType): string {
  switch (contentType) {
    case ContentType.MOVIE:
      return 'Film'
    case ContentType.SERIES:
      return 'Serial'
    default:
      return 'Materiał'
  }
}

function handleImageError(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  if (image.src !== placeholder) {
    image.src = placeholder
  }
}

function scrollToGrid() {
  document.querySelector('.overview-grid')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function setPage(page: number) {
  currentPage.value = Math.max(1, page)
  scrollToGrid()
}

function prevPage() {
  if (currentPage.value > 1) {
    setPage(currentPage.value - 1)
  }
}

function nextPage() {
  if (hasNextPage.value) {
    setPage(currentPage.value + 1)
  }
}

async function loadPage() {
  const token = auth.user?.accessToken
  if (!token) {
    items.value = []
    hasNextPage.value = false
    error.value = null
    return
  }

  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  isLoading.value = true
  error.value = null

  try {
    const [currentResponse, nextResponse] = await Promise.all([
      getLibraryPage(token, currentPage.value, pageSize.value, signal),
      getLibraryPage(token, currentPage.value + 1, pageSize.value, signal),
    ])
    items.value = currentResponse
    hasNextPage.value = nextResponse.length > 0
    if (currentResponse.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return
    }
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    if (!signal.aborted) {
      isLoading.value = false
    }
  }
}

onMounted(() => {
  void loadPage()
})

watch([currentPage, () => auth.user?.accessToken], () => {
  void loadPage()
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>
<template>
  <div class="overview-grid">
    <div v-if="error" class="state-card error-state" role="alert">
      <span class="state-icon">!</span>
      <div>
        <strong>Nie udało się pobrać biblioteki</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" class="retry-button" @click="loadPage">Spróbuj ponownie</button>
    </div>
    <div v-else-if="showEmptyState" class="state-card">
      <span class="state-icon">▤</span>
      <div>
        <strong>Biblioteka jest pusta</strong>
        <p>Nie znaleziono pozycji do wyświetlenia.</p>
      </div>
    </div>
    <div v-else class="grid">
      <template v-if="isLoading">
        <div v-for="index in pageSize" :key="index" class="card-skeleton" aria-hidden="true">
          <div class="skeleton skeleton-image" />
          <div class="skeleton-content">
            <div class="skeleton skeleton-title" />
            <div class="skeleton skeleton-meta" />
          </div>
        </div>
      </template>
      <button
        v-for="item in items"
        v-else
        :key="item.id"
        class="card"
        type="button"
        :aria-label="`Otwórz ${item.title || 'wybraną pozycję'}`"
        @click="goToBrowse(item.id, item.contentType)"
      >
        <span class="thumb-wrap">
          <img
            :src="item.thumbnailUrl || placeholder"
            :alt="item.title || 'Miniatura'"
            loading="lazy"
            draggable="false"
            @error="handleImageError"
          />
          <span class="image-shade" />
          <span v-if="item.contentType" class="content-badge">
            {{ contentTypeLabel(item.contentType) }}
          </span>
          <span v-if="item.available === false" class="unavailable-badge"> Niedostępny </span>
          <span class="play-indicator" aria-hidden="true"> ▶ </span>
        </span>
        <span class="card-content">
          <strong class="title"> {{ item.title || 'Bez tytułu' }} </strong>
          <span class="card-meta">
            <span v-if="item.genre"> {{ item.genre }} </span>
            <span v-if="item.genre && item.releaseYear" class="meta-dot" />
            <span v-if="item.releaseYear"> {{ item.releaseYear }} </span>
          </span>
        </span>
      </button>
    </div>
    <nav
      v-if="!isLoading && !error && (currentPage > 1 || hasNextPage)"
      class="pagination"
      aria-label="Stronicowanie biblioteki"
    >
      <button
        type="button"
        class="page-btn"
        :disabled="currentPage === 1"
        aria-label="Poprzednia strona"
        @click="prevPage"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <span class="page-info">
        Strona <strong>{{ currentPage }}</strong>
      </span>
      <button
        type="button"
        class="page-btn"
        :disabled="!hasNextPage"
        aria-label="Następna strona"
        @click="nextPage"
      >
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  </div>
</template>
<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
.overview-grid {
  width: 100%;
  scroll-margin-top: 6rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}
.card {
  position: relative;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  color: $white;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(145deg, rgba($accent, 0.9), rgba($black, 0.95));
  border: 1px solid rgba($white, 0.07);
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
  &:hover {
    border-color: rgba($primary, 0.42);
    box-shadow:
      0 20px 38px rgba(0, 0, 0, 0.34),
      0 0 0 1px rgba($primary, 0.06);
    transform: translateY(-6px);
  }
  &:focus-visible {
    outline: 3px solid rgba($primary, 0.35);
    outline-offset: 3px;
  }
}
.thumb-wrap {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: $accent;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition:
      transform 350ms ease,
      filter 350ms ease;
  }
}
.card:hover .thumb-wrap img {
  filter: brightness(0.72);
  transform: scale(1.06);
}
.image-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba($black, 0.04), rgba($black, 0.7));
  opacity: 0.45;
  transition: opacity 180ms ease;
}
.card:hover .image-shade {
  opacity: 0.85;
}
.content-badge,
.unavailable-badge {
  position: absolute;
  top: 0.7rem;
  padding: 0.3rem 0.55rem;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  border-radius: 999px;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}
.content-badge {
  left: 0.7rem;
  color: $primary;
  background: rgba($black, 0.72);
  border: 1px solid rgba($primary, 0.3);
}
.unavailable-badge {
  right: 0.7rem;
  color: #ffb0b0;
  background: rgba(90, 0, 0, 0.7);
  border: 1px solid rgba(255, 90, 90, 0.3);
}
.play-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 50px;
  height: 50px;
  align-items: center;
  justify-content: center;
  padding-left: 3px;
  color: $black;
  font-size: 0.9rem;
  background: $primary;
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba($primary, 0.25);
  opacity: 0;
  transform: translate(-50%, -40%) scale(0.8);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.card:hover .play-indicator,
.card:focus-visible .play-indicator {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.card-content {
  display: block;
  padding: 0.9rem 1rem 1rem;
}
.title {
  display: block;
  overflow: hidden;
  color: #f5f7f6;
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  display: flex;
  min-height: 1rem;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.45rem;
  overflow: hidden;
  color: rgba($white, 0.56);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta-dot {
  width: 3px;
  height: 3px;
  flex: 0 0 auto;
  background: $primary;
  border-radius: 50%;
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 2rem;
}
.page-btn {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 1.4rem;
  cursor: pointer;
  background: rgba($primary, 0.05);
  border: 1px solid rgba($primary, 0.22);
  border-radius: 50%;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
  &:hover:not(:disabled) {
    color: $black;
    background: $primary;
    transform: scale(1.06);
  }
  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 3px;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
}
.page-info {
  min-width: 100px;
  color: rgba($white, 0.62);
  font-size: 0.78rem;
  text-align: center;
  strong {
    color: #fff;
  }
}
.state-card {
  display: flex;
  min-height: 160px;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba($accent, 0.68);
  border: 1px solid rgba($primary, 0.14);
  border-radius: 14px;
  strong {
    color: #fff;
  }
  p {
    margin: 0.35rem 0 0;
    color: rgba($white, 0.65);
    font-size: 0.85rem;
  }
}
.state-icon {
  display: flex;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 1.25rem;
  font-weight: 800;
  background: rgba($primary, 0.08);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 50%;
}
.error-state {
  border-color: rgba(255, 80, 80, 0.2);
  .state-icon {
    color: #ff8a8a;
    background: rgba(255, 70, 70, 0.08);
    border-color: rgba(255, 70, 70, 0.22);
  }
}
.retry-button {
  min-height: 40px;
  margin-left: auto;
  padding: 0.6rem 0.9rem;
  color: $black;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  background: $primary;
  border: 0;
  border-radius: 8px;
  &:hover {
    background: $secondary;
  }
}
.card-skeleton {
  overflow: hidden;
  background: rgba($accent, 0.6);
  border: 1px solid rgba($white, 0.05);
  border-radius: 14px;
}
.skeleton {
  background: linear-gradient(
    110deg,
    rgba($white, 0.04) 8%,
    rgba($white, 0.1) 18%,
    rgba($white, 0.04) 33%
  );
  background-size: 200% 100%;
  animation: shimmer 1.35s linear infinite;
}
.skeleton-image {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.skeleton-content {
  padding: 1rem;
}
.skeleton-title {
  width: 76%;
  height: 14px;
  border-radius: 5px;
}
.skeleton-meta {
  width: 46%;
  height: 10px;
  margin-top: 0.65rem;
  border-radius: 5px;
}
@keyframes shimmer {
  to {
    background-position-x: -200%;
  }
}
@media (max-width: 720px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .card-content {
    padding: 0.75rem;
  }
  .title {
    font-size: 0.82rem;
  }
  .card-meta {
    font-size: 0.66rem;
  }
  .content-badge,
  .unavailable-badge {
    top: 0.5rem;
    padding: 0.23rem 0.4rem;
    font-size: 0.54rem;
  }
  .content-badge {
    left: 0.5rem;
  }
  .unavailable-badge {
    right: 0.5rem;
  }
  .play-indicator {
    width: 42px;
    height: 42px;
  }
  .state-card {
    align-items: flex-start;
    flex-direction: column;
  }
  .retry-button {
    width: 100%;
    margin-left: 0;
  }
}
@media (max-width: 420px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .card,
  .thumb-wrap img,
  .play-indicator,
  .page-btn,
  .skeleton {
    transition: none;
    animation: none;
  }
}
</style>
