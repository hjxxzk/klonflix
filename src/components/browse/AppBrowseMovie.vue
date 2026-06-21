<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchLibraryMetadata, type Metadata } from '@/api/browse'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/api/client.ts'

const route = useRoute()
const auth = useAuthStore()

const id = ref<string | null>(null)
const metadata = ref<Metadata | null>(null)

const loading = ref(false)
const error = ref<string | null>(null)

const thumbnailUrl = ref<string | null>(null)
const thumbnailLoading = ref(false)
const thumbnailError = ref<string | null>(null)

const watchlistLoading = ref(false)
const isInWatchlist = ref(false)

let requestId = 0
let thumbnailController: AbortController | null = null

const MAX_STARS = 5
const selectedRating = ref<number | null>(null)
const hoveredRating = ref<number | null>(null)
const ratingLoading = ref(false)
const ratingError = ref<string | null>(null)
const ratingSuccess = ref<string | null>(null)

const displayedRating = computed(() => {
  return hoveredRating.value ?? selectedRating.value ?? 0
})

async function submitRating(stars: number) {
  if (!id.value || ratingLoading.value) {
    return
  }

  if (!Number.isInteger(stars) || stars < 1 || stars > MAX_STARS) {
    ratingError.value = 'Ocena musi mieścić się w zakresie od 1 do 5.'
    return
  }
  const token = getAccessToken()
  if (!token) {
    ratingError.value = 'Musisz być zalogowana, aby ocenić film.'
    return
  }
  ratingLoading.value = true
  ratingError.value = null
  ratingSuccess.value = null

  try {
    await apiFetch<void>(
      `/rate/${encodeURIComponent(id.value)}`,
      { method: 'POST', body: JSON.stringify({ stars }) },
      token
    )
    selectedRating.value = stars
    ratingSuccess.value = `Twoja ocena: ${stars}/${MAX_STARS}`
  } catch (e: unknown) {
    ratingError.value = e instanceof Error ? e.message : 'Nie udało się zapisać oceny.'
  } finally {
    ratingLoading.value = false
  }
}
function resetRatingState() {
  selectedRating.value = null
  hoveredRating.value = null
  ratingError.value = null
  ratingSuccess.value = null
}

function getAccessToken(): string | undefined {
  const token = auth.user?.accessToken

  if (token) {
    return token
  }

  const raw = localStorage.getItem('user')

  if (!raw) {
    return undefined
  }

  try {
    const parsed = JSON.parse(raw) as {
      accessToken?: string
    }

    return parsed.accessToken
  } catch {
    return undefined
  }
}

function getMetadataRecord(item: Metadata): Record<string, unknown> {
  return item as unknown as Record<string, unknown>
}

function getThumbnailSource(item: Metadata): string | null {
  const record = getMetadataRecord(item)

  const possibleFields = ['thumbnailUrl', 'thumbnailUri', 'posterUrl', 'posterUri', 'imageUrl']

  for (const field of possibleFields) {
    const value = record[field]

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}

function getOptionalMetadataField(...fields: string[]): string | null {
  if (!metadata.value) {
    return null
  }

  const record = getMetadataRecord(metadata.value)

  for (const field of fields) {
    const value = record[field]

    if (typeof value === 'string' && value.trim()) {
      return value
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return null
}

const title = computed(() => metadata.value?.title || 'Bez tytułu')

const description = computed(
  () => metadata.value?.description || 'Brak opisu dla wybranej pozycji.'
)

const genre = computed(() => metadata.value?.genre || 'Nieznany')

const releaseYear = computed(() => metadata.value?.releaseYear || '—')

const duration = computed(() => {
  const value = getOptionalMetadataField('duration', 'durationMinutes', 'runtime')

  if (!value) {
    return '—'
  }

  if (/^\d+$/.test(value)) {
    return `${value} min`
  }

  return value
})

const keywords = computed(() => {
  return metadata.value?.keywords?.map((keyword) => keyword.name).filter(Boolean) ?? []
})

const playbackUrl = computed(() => {
  return getOptionalMetadataField('playbackUrl', 'streamUrl', 'videoUrl')
})

function revokeThumbnailUrl() {
  if (thumbnailUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(thumbnailUrl.value)
  }

  thumbnailUrl.value = null
}

async function fetchThumbnailFor(
  item: Metadata,
  token: string | undefined,
  currentRequestId: number
) {
  thumbnailController?.abort()
  thumbnailController = new AbortController()

  revokeThumbnailUrl()

  thumbnailLoading.value = true
  thumbnailError.value = null

  const source = getThumbnailSource(item)

  if (!source) {
    thumbnailLoading.value = false
    thumbnailError.value = 'Brak adresu miniatury.'
    return
  }

  if (source.startsWith('data:') || source.startsWith('blob:')) {
    thumbnailUrl.value = source
    thumbnailLoading.value = false
    return
  }

  try {
    const response = await fetch(source, {
      signal: thumbnailController.signal,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    })

    if (!response.ok) {
      throw new Error(`Nie udało się pobrać miniatury (${response.status}).`)
    }

    const blob = await response.blob()

    if (currentRequestId !== requestId) {
      return
    }

    thumbnailUrl.value = URL.createObjectURL(blob)
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return
    }

    /*
     * Fallback dla publicznych obrazów albo serwerów,
     * które blokują pobieranie przez CORS.
     */
    thumbnailUrl.value = source

    thumbnailError.value = e instanceof Error ? e.message : 'Nie udało się pobrać miniatury.'
  } finally {
    if (currentRequestId === requestId) {
      thumbnailLoading.value = false
    }
  }
}

async function fetchMetadataFor(idValue: string) {
  const currentRequestId = ++requestId

  loading.value = true
  error.value = null
  metadata.value = null

  thumbnailController?.abort()
  revokeThumbnailUrl()

  thumbnailError.value = null

  try {
    const token = getAccessToken()
    const result = await fetchLibraryMetadata(idValue, token)

    if (currentRequestId !== requestId) {
      return
    }

    metadata.value = result

    if (metadata.value) {
      await fetchThumbnailFor(metadata.value, token, currentRequestId)
    }
  } catch (e: unknown) {
    if (currentRequestId !== requestId) {
      return
    }

    error.value = e instanceof Error ? e.message : 'Nieznany błąd podczas pobierania metadanych.'
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

async function handleWatchlist() {
  if (!id.value || watchlistLoading.value) {
    return
  }

  watchlistLoading.value = true

  try {
    /*
     * Tutaj podepnij swoje API, przykładowo:
     *
     * await addMovieToWatchlist(id.value, getAccessToken())
     */

    isInWatchlist.value = !isInWatchlist.value
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Nie udało się zmienić watchlisty.'
  } finally {
    watchlistLoading.value = false
  }
}

function handlePlay() {
  if (!id.value) {
    return
  }

  if (playbackUrl.value) {
    window.location.assign(playbackUrl.value)
    return
  }

  /*
   * Alternatywnie podepnij tutaj własną trasę:
   *
   * router.push({
   *   name: 'MoviePlayer',
   *   params: { id: id.value },
   * })
   */

  error.value = 'Brak adresu odtwarzania. Podepnij trasę playera w handlePlay().'
}

function handleThumbnailError() {
  revokeThumbnailUrl()
  thumbnailError.value = 'Nie udało się wyświetlić miniatury.'
}

function retry() {
  if (id.value) {
    void fetchMetadataFor(id.value)
  }
}

watch(
  () => route.params.id,
  (parameter) => {
    const idValue = Array.isArray(parameter) ? String(parameter[0] ?? '') : String(parameter ?? '')

    if (!idValue || idValue === id.value) {
      return
    }

    id.value = idValue
    resetRatingState()
    void fetchMetadataFor(idValue)
  },
  {
    immediate: true,
  }
)

onBeforeUnmount(() => {
  requestId++
  thumbnailController?.abort()
  revokeThumbnailUrl()
})
</script>

<template>
  <main class="app-browse">
    <div class="browse-container">
      <header class="page-header">
        <div>
          <span class="eyebrow">Biblioteka</span>
          <h1>Szczegóły filmu</h1>
        </div>
      </header>

      <section v-if="loading" class="movie-card loading-card">
        <div class="details-panel">
          <div class="skeleton skeleton-title" />
          <div class="skeleton skeleton-meta" />
          <div class="skeleton skeleton-text" />
          <div class="skeleton skeleton-text short" />
          <div class="skeleton skeleton-actions" />
        </div>

        <div class="poster-panel">
          <div class="skeleton skeleton-poster" />
        </div>
      </section>

      <section v-else-if="error && !metadata" class="state-card error-card">
        <div class="state-icon">!</div>

        <div>
          <h2>Nie udało się pobrać filmu</h2>
          <p>{{ error }}</p>
        </div>

        <button type="button" class="btn btn-primary" @click="retry">Spróbuj ponownie</button>
      </section>

      <section v-else-if="metadata" class="movie-card">
        <div class="details-panel">
          <div class="title-section">
            <span class="content-type">Film</span>

            <h2>{{ title }}</h2>

            <div class="summary-row">
              <span>{{ releaseYear }}</span>

              <template v-if="duration !== '—'">
                <span class="summary-dot" />
                <span>{{ duration }}</span>
              </template>
            </div>
          </div>

          <p class="description">
            {{ description }}
          </p>

          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="metadata-label">Gatunek</span>
              <strong>{{ genre }}</strong>
            </div>

            <div class="metadata-item">
              <span class="metadata-label">Rok wydania</span>
              <strong>{{ releaseYear }}</strong>
            </div>
          </div>

          <div v-if="keywords.length" class="keywords-section">
            <span class="section-label">Słowa kluczowe</span>

            <div class="keywords">
              <span v-for="keyword in keywords" :key="keyword" class="keyword">
                {{ keyword }}
              </span>
            </div>
          </div>

          <div class="rating-section">
            <div class="rating-heading">
              <div>
                <span class="section-label">Twoja ocena</span>
                <p class="rating-description">Jak oceniasz ten film?</p>
              </div>
              <span v-if="selectedRating" class="rating-value">
                {{ selectedRating }}/{{ MAX_STARS }}
              </span>
            </div>
            <div
              class="stars"
              role="group"
              aria-label="Oceń film w skali od 1 do 5"
              @mouseleave="hoveredRating = null"
            >
              <button
                v-for="star in MAX_STARS"
                :key="star"
                type="button"
                class="star-button"
                :class="{
                  active: star <= displayedRating,
                  selected: star <= (selectedRating ?? 0),
                }"
                :disabled="ratingLoading"
                :aria-label="`Oceń na ${star} z ${MAX_STARS}`"
                :aria-pressed="selectedRating === star"
                @mouseenter="hoveredRating = star"
                @focus="hoveredRating = star"
                @blur="hoveredRating = null"
                @click="submitRating(star)"
              >
                <span aria-hidden="true">★</span>
              </button>
              <span v-if="ratingLoading" class="rating-spinner" aria-label="Zapisywanie oceny" />
            </div>
            <p v-if="ratingSuccess" class="rating-message success" role="status">
              {{ ratingSuccess }}
            </p>
            <p v-if="ratingError" class="rating-message error" role="alert">{{ ratingError }}</p>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-primary play-button" @click="handlePlay">
              <span class="button-icon play-icon">▶</span>
              Odtwórz
            </button>

            <button
              type="button"
              class="btn btn-outline-primary"
              :disabled="watchlistLoading"
              @click="handleWatchlist"
            >
              <span class="button-icon">
                {{ isInWatchlist ? '✓' : '+' }}
              </span>

              {{
                watchlistLoading
                  ? 'Zapisywanie...'
                  : isInWatchlist
                    ? 'Na watchliście'
                    : 'Dodaj do watchlisty'
              }}
            </button>
          </div>

          <div v-if="error" class="inline-error">
            {{ error }}
          </div>
        </div>

        <aside class="poster-panel">
          <div class="poster-wrapper">
            <div v-if="thumbnailLoading" class="poster-placeholder poster-loading">
              <span class="loader" />
              <span>Pobieranie obrazu...</span>
            </div>

            <img
              v-else-if="thumbnailUrl"
              :src="thumbnailUrl"
              :alt="`Okładka filmu ${title}`"
              class="poster"
              @error="handleThumbnailError"
            />

            <div v-else class="poster-placeholder">
              <span class="placeholder-icon">▧</span>
              <span>Brak miniatury</span>
            </div>

            <div class="poster-glow" />
          </div>
        </aside>
      </section>

      <section v-else class="state-card">
        <div class="state-icon">?</div>

        <div>
          <h2>Brak danych</h2>
          <p>Nie znaleziono informacji o wybranym filmie.</p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
$primary: #00c853;
$secondary: #00913f;
$black: #0a0a0a;
$white: #b3b3b3;
$accent: #0d1f16;
$font-family: 'Inter', sans-serif;

.app-browse {
  min-height: 100%;
  padding: 2rem;
  color: $white;
  font-family: $font-family;
  background:
    radial-gradient(circle at 85% 15%, rgba($primary, 0.12), transparent 32rem),
    radial-gradient(circle at 10% 90%, rgba($secondary, 0.08), transparent 30rem), $black;
}

.browse-container {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;

  h1 {
    margin: 0.25rem 0 0;
    color: #f4f7f5;
    font-size: clamp(1.65rem, 3vw, 2.3rem);
    font-weight: 700;
    letter-spacing: -0.04em;
  }
}

.eyebrow,
.content-type,
.section-label {
  color: $primary;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.id-badge {
  padding: 0.45rem 0.75rem;
  color: rgba($white, 0.8);
  font-family: monospace;
  font-size: 0.75rem;
  background: rgba($accent, 0.8);
  border: 1px solid rgba($primary, 0.18);
  border-radius: 999px;
}

.movie-card {
  display: grid;
  grid-template-columns:
    minmax(0, 1.15fr)
    minmax(320px, 0.85fr);
  min-height: 620px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(19, 32, 25, 0.98), rgba(10, 15, 12, 0.98));
  border: 1px solid rgba($primary, 0.15);
  border-radius: 24px;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.details-panel {
  display: flex;
  flex-direction: column;
  padding: clamp(1.5rem, 4vw, 3.5rem);
}

.title-section {
  h2 {
    max-width: 780px;
    margin: 0.6rem 0 0.75rem;
    color: #fff;
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 750;
    line-height: 1.02;
    letter-spacing: -0.055em;
  }
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  color: rgba($white, 0.78);
  font-size: 0.9rem;
}

.summary-dot {
  width: 4px;
  height: 4px;
  background: $primary;
  border-radius: 50%;
}

.description {
  max-width: 760px;
  margin: 2rem 0;
  color: rgba($white, 0.88);
  font-size: clamp(1rem, 1.5vw, 1.1rem);
  line-height: 1.75;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  background: rgba($black, 0.32);
  border: 1px solid rgba($white, 0.08);
  border-radius: 12px;

  strong {
    color: #f0f5f2;
    font-size: 0.95rem;
  }
}

.metadata-label {
  color: rgba($white, 0.55);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.keywords-section {
  margin-top: 1.75rem;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.keyword {
  padding: 0.45rem 0.7rem;
  color: rgba($white, 0.9);
  font-size: 0.78rem;
  background: rgba($primary, 0.08);
  border: 1px solid rgba($primary, 0.16);
  border-radius: 999px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 2.5rem;
}

.btn {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1.35rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 10px;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.play-button {
  min-width: 145px;
  box-shadow: 0 12px 30px rgba($primary, 0.18);
}

.button-icon {
  display: inline-flex;
  width: 1.2rem;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
}

.play-icon {
  font-size: 0.85rem;
}

:deep(.btn-primary) {
  color: black;
  background-color: $primary;
  border-color: $primary;

  &:hover {
    color: black;
    background-color: $secondary;
    border-color: $secondary;
  }
}

:deep(.btn-outline-primary) {
  color: $primary;
  background: rgba($primary, 0.02);
  border-color: $primary;

  &:hover {
    color: black;
    background-color: $primary;
    border-color: $primary;
  }
}

.poster-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 3rem);
  background: linear-gradient(145deg, rgba($primary, 0.08), rgba($black, 0.45));
  border-left: 1px solid rgba($white, 0.06);
}

.poster-wrapper {
  position: relative;
  width: min(100%, 420px);
  aspect-ratio: 2 / 3;
}

.poster {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: $accent;
  border: 1px solid rgba($white, 0.1);
  border-radius: 18px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.55);
}

.poster-glow {
  position: absolute;
  z-index: 0;
  inset: 10% -8% -5%;
  background: rgba($primary, 0.2);
  filter: blur(50px);
  border-radius: 50%;
  opacity: 0.6;
}

.poster-placeholder {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: rgba($white, 0.65);
  background: linear-gradient(145deg, rgba($accent, 0.95), rgba($black, 0.95));
  border: 1px dashed rgba($primary, 0.25);
  border-radius: 18px;
}

.placeholder-icon {
  color: rgba($primary, 0.5);
  font-size: 4rem;
}

.poster-loading {
  background: linear-gradient(
    110deg,
    rgba($accent, 0.9) 8%,
    rgba($primary, 0.08) 18%,
    rgba($accent, 0.9) 33%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.thumbnail-error {
  position: relative;
  z-index: 2;
  margin: 1rem 0 0;
  color: rgba($white, 0.55);
  font-size: 0.75rem;
  text-align: center;
}

.inline-error {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  color: #ffb4b4;
  font-size: 0.85rem;
  background: rgba(160, 0, 0, 0.14);
  border: 1px solid rgba(255, 80, 80, 0.18);
  border-radius: 8px;
}

.state-card {
  display: flex;
  min-height: 240px;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem;
  background: rgba($accent, 0.65);
  border: 1px solid rgba($primary, 0.15);
  border-radius: 18px;

  h2 {
    margin: 0 0 0.4rem;
    color: #fff;
  }

  p {
    margin: 0;
    color: rgba($white, 0.75);
  }

  .btn {
    margin-left: auto;
  }
}

.state-icon {
  display: flex;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 1.5rem;
  font-weight: 800;
  background: rgba($primary, 0.1);
  border: 1px solid rgba($primary, 0.25);
  border-radius: 50%;
}

.error-card .state-icon {
  color: #ff7474;
  background: rgba(255, 70, 70, 0.1);
  border-color: rgba(255, 70, 70, 0.25);
}

.raw-metadata {
  margin-top: 1rem;
  overflow: hidden;
  background: rgba($accent, 0.45);
  border: 1px solid rgba($white, 0.07);
  border-radius: 12px;

  summary {
    padding: 1rem 1.2rem;
    color: rgba($white, 0.75);
    font-size: 0.85rem;
    cursor: pointer;
    user-select: none;

    &:hover {
      color: $primary;
    }
  }

  pre {
    max-height: 420px;
    margin: 0;
    padding: 1.2rem;
    overflow: auto;
    color: #bfe8ce;
    font-size: 0.78rem;
    line-height: 1.55;
    background: rgba($black, 0.7);
    border-top: 1px solid rgba($white, 0.06);
  }
}

.loading-card {
  pointer-events: none;
}

.skeleton {
  background: linear-gradient(
    110deg,
    rgba($white, 0.05) 8%,
    rgba($white, 0.11) 18%,
    rgba($white, 0.05) 33%
  );
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.4s linear infinite;
}

.skeleton-title {
  width: 70%;
  height: 64px;
  margin-top: 2rem;
}

.skeleton-meta {
  width: 38%;
  height: 20px;
  margin-top: 1rem;
}

.skeleton-text {
  width: 100%;
  height: 18px;
  margin-top: 3rem;

  &.short {
    width: 74%;
    margin-top: 0.8rem;
  }
}

.skeleton-actions {
  width: 310px;
  height: 48px;
  margin-top: auto;
}

.skeleton-poster {
  width: min(100%, 420px);
  aspect-ratio: 2 / 3;
  border-radius: 18px;
}

@keyframes shimmer {
  to {
    background-position-x: -200%;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .app-browse {
    padding: 1.25rem;
  }

  .movie-card {
    grid-template-columns: 1fr;
  }

  .poster-panel {
    grid-row: 1;
    min-height: 480px;
    border-bottom: 1px solid rgba($white, 0.06);
    border-left: 0;
  }

  .poster-wrapper {
    width: min(75%, 330px);
  }

  .details-panel {
    min-height: 560px;
  }
}

@media (max-width: 560px) {
  .app-browse {
    padding: 1rem;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .movie-card {
    border-radius: 16px;
  }

  .details-panel {
    min-height: auto;
    padding: 1.35rem;
  }

  .poster-panel {
    min-height: 410px;
    padding: 1.5rem;
  }

  .poster-wrapper {
    width: min(85%, 280px);
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }

  .state-card {
    align-items: flex-start;
    flex-direction: column;

    .btn {
      width: 100%;
      margin-left: 0;
    }
  }

  .skeleton-actions {
    width: 100%;
  }
}

.rating-section {
  margin-top: 1.75rem;
  padding: 1.1rem 1.2rem;
  background: linear-gradient(135deg, rgba($primary, 0.065), rgba($black, 0.28));
  border: 1px solid rgba($primary, 0.16);
  border-radius: 14px;
}

.rating-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.rating-description {
  margin: 0.35rem 0 0;
  color: rgba($white, 0.68);
  font-size: 0.82rem;
}

.rating-value {
  padding: 0.35rem 0.65rem;
  color: $primary;
  font-size: 0.78rem;
  font-weight: 800;
  background: rgba($primary, 0.08);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 999px;
}

.stars {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  margin-top: 0.85rem;
}

.star-button {
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: rgba($white, 0.2);
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  text-shadow: none;
  transition:
    color 140ms ease,
    text-shadow 140ms ease,
    transform 140ms ease,
    background-color 140ms ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background: rgba($primary, 0.06);
    transform: translateY(-2px) scale(1.08);
  }

  &:focus-visible {
    outline: 2px solid rgba($primary, 0.4);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.55;
  }

  &.active {
    color: $primary;
    text-shadow: 0 0 14px rgba($primary, 0.4);
  }

  &.selected {
    color: $primary;
  }
}

.rating-spinner {
  width: 22px;
  height: 22px;
  margin-left: 0.7rem;
  border: 2px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.rating-message {
  margin: 0.75rem 0 0;
  font-size: 0.78rem;

  &.success {
    color: $primary;
  }

  &.error {
    color: #ff9f9f;
  }
}

@media (max-width: 560px) {
  .star-button {
    width: 38px;
    height: 38px;
    font-size: 1.55rem;
  }
}
</style>
