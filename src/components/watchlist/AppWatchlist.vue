<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppNavbarOverview from '@/components/overview/AppNavbarOverview.vue'
import LibraryContentCard from '@/components/shared/LibraryContentCard.vue'
import { useAuthStore } from '@/stores/auth'
import { getWatchlist, removeFromWatchlist } from '@/api/watchlist'
import type { LibraryItem } from '@/types/LibraryContent'
import { ContentType } from '@/types/LibraryContent'
import type { ContentResponse } from '@/types/LibraryContent'

const auth = useAuthStore()
const router = useRouter()

const items = ref<LibraryItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const removingId = ref<string | null>(null)

let controller: AbortController | null = null

const hasItems = computed(() => items.value.length > 0)
const showEmptyState = computed(() => !isLoading.value && !error.value && !hasItems.value)

function mapToLibraryItem(content: ContentResponse): LibraryItem {
  return {
    id: content.id,
    title: content.title,
    genre: content.genre,
    releaseYear: content.releaseYear,
    available: content.available,
    thumbnailUrl: content.thumbnailUrl,
    contentType: content.contentType,
  }
}

function goToBrowse(item: LibraryItem): void {
  switch (item.contentType) {
    case ContentType.MOVIE:
      void router.push(`/browse/movie/${item.id}`)
      break
    case ContentType.SERIES:
      void router.push(`/browse/series/${item.id}`)
      break
  }
}

async function loadWatchlist(): Promise<void> {
  const token = auth.user?.accessToken
  if (!token) {
    items.value = []
    error.value = null
    return
  }

  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal

  isLoading.value = true
  error.value = null

  try {
    const response = await getWatchlist(token, signal)
    items.value = response.map(mapToLibraryItem)
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

async function handleRemove(item: LibraryItem): Promise<void> {
  const token = auth.user?.accessToken
  if (!token || removingId.value) {
    return
  }

  removingId.value = item.id
  error.value = null

  try {
    await removeFromWatchlist(token, item.id)
    items.value = items.value.filter((entry) => entry.id !== item.id)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Nie udało się usunąć pozycji z watchlisty.'
  } finally {
    removingId.value = null
  }
}

onMounted(() => {
  void loadWatchlist()
})

watch(
  () => auth.user?.accessToken,
  () => {
    void loadWatchlist()
  },
)

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <div class="page">
    <AppNavbarOverview />

    <main class="content">
      <section class="watchlist-section">
        <header class="section-header">
          <div>
            <span class="section-eyebrow">Twoja kolekcja</span>
            <h1 class="section-title">Watchlista</h1>
            <p class="section-description">
              Zapisane filmy i seriale, do których możesz wrócić w każdej chwili.
            </p>
          </div>
          <span class="section-decoration" />
        </header>

        <div v-if="error" class="state-card error-state" role="alert">
          <span class="state-icon">!</span>
          <div>
            <strong>Nie udało się załadować watchlisty</strong>
            <p>{{ error }}</p>
          </div>
          <button type="button" class="retry-button" @click="loadWatchlist">Spróbuj ponownie</button>
        </div>

        <div v-else-if="showEmptyState" class="state-card">
          <span class="state-icon">☆</span>
          <div>
            <strong>Watchlista jest pusta</strong>
            <p>Dodaj filmy i seriale podczas przeglądania biblioteki.</p>
          </div>
          <button type="button" class="retry-button" @click="router.push({ name: 'Overview' })">
            Przeglądaj bibliotekę
          </button>
        </div>

        <div v-else class="watchlist-grid">
          <template v-if="isLoading">
            <div v-for="index in 6" :key="index" class="card-skeleton" aria-hidden="true">
              <div class="skeleton skeleton-image" />
              <div class="skeleton-content">
                <div class="skeleton skeleton-title" />
                <div class="skeleton skeleton-meta" />
              </div>
            </div>
          </template>

          <LibraryContentCard
            v-for="item in items"
            v-else
            :key="item.id"
            :item="item"
            removable
            :removing="removingId === item.id"
            @open="goToBrowse(item)"
            @remove="handleRemove(item)"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  color: $white;
  font-family: $font-family;
  background:
    radial-gradient(circle at 75% 10%, rgba($primary, 0.1), transparent 32rem),
    radial-gradient(circle at 10% 45%, rgba($secondary, 0.07), transparent 34rem),
    $black;
}

.content {
  width: min(100% - 3rem, 1450px);
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
}

.section-header {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}

.section-eyebrow {
  color: $primary;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.section-title {
  margin: 0.3rem 0 0;
  color: #f4f7f5;
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  font-weight: 750;
  letter-spacing: -0.04em;
}

.section-description {
  max-width: 36rem;
  margin: 0.65rem 0 0;
  color: rgba($white, 0.62);
  font-size: 0.95rem;
  line-height: 1.6;
}

.section-decoration {
  height: 1px;
  flex: 1;
  margin-bottom: 0.45rem;
  background: linear-gradient(90deg, rgba($primary, 0.55), transparent);
}

.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
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
  .content {
    width: min(100% - 2rem, 1450px);
  }

  .watchlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
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
  .watchlist-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
