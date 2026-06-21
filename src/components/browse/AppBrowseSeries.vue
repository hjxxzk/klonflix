<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiFetch, ApiError } from '@/api/client'
import {
  ContentType,
  type ContentResponse,
  type EpisodeResponse,
  type SeasonResponse,
} from '@/types/LibraryContent.ts'
import { type Metadata } from '@/types/Metadata.ts'

type SeriesDetails = {
  metadata: Metadata
  content: ContentResponse
}

type UserRatingResponse = {
  contentId: string
  stars: number
  ratedAt: string
}

const route = useRoute()
const auth = useAuthStore()

const id = ref<string | null>(null)

const metadata = ref<Metadata | null>(null)
const content = ref<ContentResponse | null>(null)

const selectedSeasonId = ref<string | null>(null)

const loading = ref(false)
const error = ref<string | null>(null)

const WATCHLIST_BASE_PATH = '/watchlist'

const watchlistLoading = ref(false)
const watchlistChecking = ref(false)
const watchlistError = ref<string | null>(null)
const isInWatchlist = ref(false)

let watchlistController: AbortController | null = null

const MAX_STARS = 5

const selectedRating = ref<number | null>(null)
const hoveredRating = ref<number | null>(null)
const ratingLoading = ref(false)
const ratingError = ref<string | null>(null)
const ratingSuccess = ref<string | null>(null)

let ratingController: AbortController | null = null

const displayedRating = computed(() => {
  return hoveredRating.value ?? selectedRating.value ?? 0
})


async function fetchInitialWatchlistState(
  contentId: string,
  token: string | undefined,
  requestNumber: number
) {
  watchlistController?.abort()

  const currentController = new AbortController()
  watchlistController = currentController

  isInWatchlist.value = false
  watchlistError.value = null

  if (!token) {
    watchlistController = null
    watchlistChecking.value = false
    return
  }

  watchlistChecking.value = true

  try {
    const present = await apiFetch<boolean>(
      `${WATCHLIST_BASE_PATH}/present/${encodeURIComponent(contentId)}`,
      {
        method: 'GET',
        signal: currentController.signal,
      },
      token
    )

    if (requestNumber !== activeRequest) {
      return
    }

    isInWatchlist.value = present === true
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return
    }

    if (requestNumber !== activeRequest) {
      return
    }

    if (e instanceof ApiError && e.status === 404) {
      isInWatchlist.value = false
      return
    }

    isInWatchlist.value = false
    watchlistError.value =
      e instanceof Error
        ? e.message
        : 'Nie udało się sprawdzić, czy serial znajduje się na watchliście.'
  } finally {
    if (requestNumber === activeRequest) {
      watchlistChecking.value = false
    }

    if (watchlistController === currentController) {
      watchlistController = null
    }
  }
}

function resetWatchlistState() {
  watchlistController?.abort()
  watchlistController = null

  watchlistLoading.value = false
  watchlistChecking.value = false
  watchlistError.value = null
  isInWatchlist.value = false
}

async function fetchInitialRating(
  contentId: string,
  token: string | undefined,
  requestNumber: number
) {
  ratingController?.abort()
  ratingController = new AbortController()

  selectedRating.value = null
  hoveredRating.value = null
  ratingError.value = null
  ratingSuccess.value = null

  if (!token) {
    ratingLoading.value = false
    return
  }

  ratingLoading.value = true

  try {
    const response = await apiFetch<UserRatingResponse | undefined>(
      `/stars/${encodeURIComponent(contentId)}`,
      {
        method: 'GET',
        signal: ratingController.signal,
      },
      token
    )

    if (requestNumber !== activeRequest) {
      return
    }

    const stars = response?.stars

    selectedRating.value =
      typeof stars === 'number' &&
      Number.isInteger(stars) &&
      stars >= 1 &&
      stars <= MAX_STARS
        ? stars
        : null
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return
    }

    if (requestNumber !== activeRequest) {
      return
    }

    if (e instanceof ApiError && e.status === 404) {
      selectedRating.value = null
      return
    }

    ratingError.value =
      e instanceof Error
        ? e.message
        : 'Nie udało się pobrać Twojej oceny serialu.'
  } finally {
    if (requestNumber === activeRequest) {
      ratingLoading.value = false
    }
  }
}

async function submitRating(stars: number) {
  if (!id.value || ratingLoading.value) {
    return
  }

  if (!Number.isInteger(stars) || stars < 1 || stars > MAX_STARS) {
    ratingError.value = `Ocena musi mieścić się w zakresie od 1 do ${MAX_STARS}.`
    return
  }

  const token = getAccessToken()

  if (!token) {
    ratingError.value = 'Musisz być zalogowana, aby ocenić serial.'
    return
  }

  ratingController?.abort()
  ratingController = null

  ratingLoading.value = true
  ratingError.value = null
  ratingSuccess.value = null

  try {
    await apiFetch<void>(
      `/rate/${encodeURIComponent(id.value)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          stars,
        }),
      },
      token
    )

    selectedRating.value = stars
    ratingSuccess.value = `Twoja ocena: ${stars}/${MAX_STARS}`
  } catch (e: unknown) {
    ratingError.value = e instanceof Error ? e.message : 'Nie udało się zapisać oceny serialu.'
  } finally {
    ratingLoading.value = false
  }
}

function resetRatingState() {
  ratingController?.abort()
  ratingController = null

  selectedRating.value = null
  hoveredRating.value = null
  ratingLoading.value = false
  ratingError.value = null
  ratingSuccess.value = null
}

let activeRequest = 0

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

/**
 * GET /library/{id}
 */
async function fetchLibraryMetadata(contentId: string, accessToken?: string): Promise<Metadata> {
  return apiFetch<Metadata>(
    `/library/${encodeURIComponent(contentId)}`,
    {
      method: 'GET',
    },
    accessToken
  )
}

/**
 * GET /library/search?phrase=...
 */
async function searchLibrary(phrase: string, accessToken?: string): Promise<ContentResponse[]> {
  const params = new URLSearchParams({
    phrase,
  })

  return apiFetch<ContentResponse[]>(
    `/library/search?${params.toString()}`,
    {
      method: 'GET',
    },
    accessToken
  )
}

/**
 * Najpierw pobiera dokładne metadane serialu po ID,
 * następnie wyszukuje ContentResponse po tytule
 * i wybiera właściwy rekord po UUID.
 */
async function fetchSeriesDetails(seriesId: string, accessToken?: string): Promise<SeriesDetails> {
  const metadataResult = await fetchLibraryMetadata(seriesId, accessToken)

  const phrase = metadataResult.title.trim()

  if (!phrase) {
    throw new ApiError(422, 'Metadane serialu nie zawierają tytułu.')
  }

  const searchResults = await searchLibrary(phrase, accessToken)

  const contentResult = searchResults.find(
    (item) => item.id === seriesId && item.contentType === ContentType.SERIES
  )

  if (!contentResult) {
    throw new ApiError(404, `Nie znaleziono serialu o ID ${seriesId}.`)
  }

  return {
    metadata: metadataResult,
    content: contentResult,
  }
}

const seasons = computed<SeasonResponse[]>(() => {
  return [...(content.value?.seasons ?? [])]
    .sort((first, second) => {
      return first.number - second.number
    })
    .map((season) => ({
      ...season,
      episodes: [...season.episodes].sort((first, second) => {
        return first.number - second.number
      }),
    }))
})

const selectedSeason = computed<SeasonResponse | null>(() => {
  if (!selectedSeasonId.value) {
    return seasons.value[0] ?? null
  }

  return seasons.value.find((season) => season.id === selectedSeasonId.value) ?? null
})

const sortedEpisodes = computed<EpisodeResponse[]>(() => {
  return selectedSeason.value?.episodes ?? []
})

const totalEpisodes = computed(() => {
  return seasons.value.reduce((total, season) => total + season.episodes.length, 0)
})

const firstPlayableEpisode = computed<EpisodeResponse | null>(() => {
  for (const season of seasons.value) {
    const episode = season.episodes.find((item) => item.videoUri?.trim())

    if (episode) {
      return episode
    }
  }

  return null
})

const title = computed(() => {
  return metadata.value?.title ?? content.value?.title ?? 'Serial bez tytułu'
})

const description = computed(() => {
  return (
    metadata.value?.description ?? content.value?.description ?? 'Brak opisu dla wybranego serialu.'
  )
})

const genre = computed(() => {
  return metadata.value?.genre?.name ?? content.value?.genre ?? 'Nieznany'
})

const releaseYear = computed(() => {
  return metadata.value?.releaseYear ?? content.value?.releaseYear ?? '—'
})

const keywords = computed<string[]>(() => {
  return (
    metadata.value?.keywords
      ?.map((keyword) => keyword.value ?? keyword.name)
      .filter((keyword): keyword is string => Boolean(keyword)) ?? []
  )
})

const availabilityLabel = computed(() => {
  if (!content.value) {
    return '—'
  }

  return content.value.available ? 'Dostępny' : 'Niedostępny'
})

function seasonLabel(season: SeasonResponse): string {
  return season.title?.trim() || `Sezon ${season.number}`
}

function formatDuration(durationSeconds: number): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return '—'
  }

  const totalMinutes = Math.round(durationSeconds / 60)

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} godz.`
  }

  return `${hours} godz. ${minutes} min`
}

async function fetchSeriesFor(seriesId: string) {
  const requestNumber = ++activeRequest

  loading.value = true
  error.value = null

  resetRatingState()
  resetWatchlistState()

  metadata.value = null
  content.value = null
  selectedSeasonId.value = null

  try {
    const token = getAccessToken()

    void fetchInitialWatchlistState(seriesId, token, requestNumber)

    const result = await fetchSeriesDetails(seriesId, token)

    if (requestNumber !== activeRequest) {
      return
    }

    metadata.value = result.metadata
    content.value = result.content

    const firstSeason = [...result.content.seasons].sort((first, second) => {
      return first.number - second.number
    })[0]

    selectedSeasonId.value = firstSeason?.id ?? null

    await fetchInitialRating(seriesId, token, requestNumber)
  } catch (e: unknown) {
    if (requestNumber !== activeRequest) {
      return
    }

    error.value = e instanceof Error ? e.message : 'Nieznany błąd podczas pobierania serialu.'
  } finally {
    if (requestNumber === activeRequest) {
      loading.value = false
    }
  }
}

async function handleWatchlist() {
  if (
    !id.value ||
    watchlistLoading.value ||
    watchlistChecking.value
  ) {
    return
  }

  const token = getAccessToken()

  if (!token) {
    watchlistError.value =
      'Musisz być zalogowana, aby zmienić watchlistę.'
    return
  }

  watchlistController?.abort()

  const currentController = new AbortController()
  watchlistController = currentController

  const contentId = id.value
  const wasPresent = isInWatchlist.value

  watchlistLoading.value = true
  watchlistError.value = null

  try {
    await apiFetch<void>(
      `${WATCHLIST_BASE_PATH}/${encodeURIComponent(contentId)}`,
      {
        method: wasPresent ? 'DELETE' : 'POST',
        signal: currentController.signal,
      },
      token
    )

    if (contentId !== id.value) {
      return
    }

    isInWatchlist.value = !wasPresent
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return
    }

    watchlistError.value =
      e instanceof Error
        ? e.message
        : wasPresent
          ? 'Nie udało się usunąć serialu z watchlisty.'
          : 'Nie udało się dodać serialu do watchlisty.'
  } finally {
    if (contentId === id.value) {
      watchlistLoading.value = false
    }

    if (watchlistController === currentController) {
      watchlistController = null
    }
  }
}

function playEpisode(episode: EpisodeResponse) {
  error.value = null

  if (!episode.videoUri?.trim()) {
    error.value = `Odcinek „${episode.title}” nie ma przypisanego pliku wideo.`

    return
  }

  window.location.assign(episode.videoUri)
}

function playFirstEpisode() {
  const episode = firstPlayableEpisode.value

  if (!episode) {
    error.value = 'Serial nie ma odcinka gotowego do odtworzenia.'

    return
  }

  playEpisode(episode)
}

function retry() {
  if (id.value) {
    void fetchSeriesFor(id.value)
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
    void fetchSeriesFor(idValue)
  },
  {
    immediate: true,
  }
)

onBeforeUnmount(() => {
  activeRequest++
  ratingController?.abort()
  watchlistController?.abort()
})
</script>

<template>
  <main class="app-browse-series">
    <div class="browse-container">
      <header class="page-header">
        <div>
          <span class="eyebrow"> Biblioteka </span>

          <h1>Szczegóły serialu</h1>
        </div>
      </header>

      <section v-if="loading" class="series-card loading-card">
        <div class="details-panel">
          <div class="skeleton skeleton-title" />
          <div class="skeleton skeleton-meta" />
          <div class="skeleton skeleton-description" />
          <div class="skeleton skeleton-description short" />

          <div class="skeleton skeleton-grid" />
          <div class="skeleton skeleton-actions" />
        </div>

        <div class="episodes-panel">
          <div class="skeleton skeleton-panel-title" />
          <div class="skeleton skeleton-season-select" />

          <div v-for="index in 5" :key="index" class="episode-skeleton">
            <div class="skeleton skeleton-episode-number" />

            <div class="episode-skeleton-content">
              <div class="skeleton skeleton-episode-title" />

              <div class="skeleton skeleton-episode-meta" />
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="error && !metadata" class="state-card error-card">
        <span class="state-icon">!</span>

        <div class="state-content">
          <h2>Nie udało się pobrać serialu</h2>
          <p>{{ error }}</p>
        </div>

        <button type="button" class="btn btn-primary" @click="retry">Spróbuj ponownie</button>
      </section>

      <section v-else-if="metadata && content" class="series-card">
        <div class="details-panel">
          <div class="title-section">
            <div class="title-badges">
              <span class="content-type"> Serial </span>

              <span
                class="availability"
                :class="{
                  unavailable: !content.available,
                }"
              >
                {{ availabilityLabel }}
              </span>
            </div>

            <h2>{{ title }}</h2>

            <div class="summary-row">
              <span>{{ releaseYear }}</span>

              <span class="summary-dot" />

              <span>{{ genre }}</span>

              <span class="summary-dot" />

              <span>
                {{ seasons.length }}
                {{ seasons.length === 1 ? 'sezon' : 'sezonów' }}
              </span>

              <span class="summary-dot" />

              <span>
                {{ totalEpisodes }}
                {{ totalEpisodes === 1 ? 'odcinek' : 'odcinków' }}
              </span>
            </div>
          </div>

          <p class="description">
            {{ description }}
          </p>

          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="metadata-label"> Gatunek </span>

              <strong>{{ genre }}</strong>
            </div>

            <div class="metadata-item">
              <span class="metadata-label"> Rok wydania </span>

              <strong>{{ releaseYear }}</strong>
            </div>

            <div class="metadata-item">
              <span class="metadata-label"> Liczba sezonów </span>

              <strong>{{ seasons.length }}</strong>
            </div>

            <div class="metadata-item">
              <span class="metadata-label"> Liczba odcinków </span>

              <strong>{{ totalEpisodes }}</strong>
            </div>
          </div>

          <div v-if="keywords.length" class="keywords-section">
            <span class="section-label"> Słowa kluczowe </span>

            <div class="keywords">
              <span v-for="keyword in keywords" :key="keyword" class="keyword">
                {{ keyword }}
              </span>
            </div>
          </div>

          <div class="rating-section">
            <div class="rating-heading">
              <div>
                <span class="section-label"> Twoja ocena </span>

                <p class="rating-description">Jak oceniasz ten serial?</p>
              </div>

              <span v-if="selectedRating" class="rating-value">
                {{ selectedRating }}/{{ MAX_STARS }}
              </span>
            </div>

            <div
              class="stars"
              role="group"
              :aria-label="`Oceń serial w skali od 1 do ${MAX_STARS}`"
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
                :aria-label="`Oceń serial na ${star} z ${MAX_STARS}`"
                :aria-pressed="selectedRating === star"
                @mouseenter="hoveredRating = star"
                @focus="hoveredRating = star"
                @blur="hoveredRating = null"
                @click="submitRating(star)"
              >
                <span aria-hidden="true">★</span>
              </button>

              <span
                v-if="ratingLoading"
                class="rating-spinner"
                role="status"
                aria-label="Zapisywanie oceny"
              />
            </div>

            <p v-if="ratingSuccess" class="rating-message success" role="status">
              {{ ratingSuccess }}
            </p>

            <p v-if="ratingError" class="rating-message error" role="alert">
              {{ ratingError }}
            </p>
          </div>

          <div class="actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!firstPlayableEpisode"
              @click="playFirstEpisode"
            >
              <span class="play-icon">▶</span>
              Odtwórz pierwszy odcinek
            </button>

            <button
              type="button"
              class="btn btn-outline-primary"
              :class="{ 'watchlist-active': isInWatchlist }"
              :disabled="watchlistLoading || watchlistChecking"
              :aria-pressed="isInWatchlist"
              :title="
                isInWatchlist
                  ? 'Kliknij, aby usunąć serial z watchlisty'
                  : 'Kliknij, aby dodać serial do watchlisty'
              "
              @click="handleWatchlist"
            >
              <span class="button-icon">
                {{ isInWatchlist ? '✓' : '+' }}
              </span>

              {{
                watchlistChecking
                  ? 'Sprawdzanie...'
                  : watchlistLoading
                    ? isInWatchlist
                      ? 'Usuwanie...'
                      : 'Dodawanie...'
                    : isInWatchlist
                      ? 'Na watchliście — usuń'
                      : 'Dodaj do watchlisty'
              }}
            </button>
          </div>

          <div v-if="watchlistError" class="inline-error">
            {{ watchlistError }}
          </div>

          <div v-if="error" class="inline-error">
            {{ error }}
          </div>
        </div>

        <aside class="episodes-panel">
          <header class="episodes-header">
            <div>
              <span class="section-label"> Odcinki </span>

              <h3>Przeglądaj serial</h3>
            </div>

            <span class="episode-count">
              {{ sortedEpisodes.length }}
              {{ sortedEpisodes.length === 1 ? 'odcinek' : 'odcinków' }}
            </span>
          </header>

          <div v-if="seasons.length" class="season-selector">
            <span class="selector-label"> Wybierz sezon </span>

            <div class="season-tabs">
              <button
                v-for="season in seasons"
                :key="season.id"
                type="button"
                class="season-tab"
                :class="{
                  active: season.id === selectedSeasonId,
                }"
                @click="selectedSeasonId = season.id"
              >
                <span>
                  {{ seasonLabel(season) }}
                </span>

                <small> {{ season.episodes.length }} odc. </small>
              </button>
            </div>

            <select v-model="selectedSeasonId" class="season-select" aria-label="Wybierz sezon">
              <option v-for="season in seasons" :key="season.id" :value="season.id">
                {{ seasonLabel(season) }}
                — {{ season.episodes.length }} odc.
              </option>
            </select>
          </div>

          <div v-if="selectedSeason && sortedEpisodes.length" class="episodes-list">
            <article
              v-for="episode in sortedEpisodes"
              :key="episode.id"
              class="episode-card"
              :class="{
                unavailable: !episode.videoUri?.trim(),
              }"
            >
              <div class="episode-number">
                {{ episode.number }}
              </div>

              <div class="episode-info">
                <h4>
                  {{ episode.title || `Odcinek ${episode.number}` }}
                </h4>

                <div class="episode-meta">
                  <span>
                    {{ formatDuration(episode.durationSeconds) }}
                  </span>

                  <template v-if="episode.languages.length">
                    <span class="summary-dot" />

                    <span>
                      {{ episode.languages.join(', ').toUpperCase() }}
                    </span>
                  </template>
                </div>
              </div>

              <button
                type="button"
                class="episode-play"
                :disabled="!episode.videoUri?.trim()"
                :aria-label="`Odtwórz odcinek ${episode.number}`"
                @click="playEpisode(episode)"
              >
                ▶
              </button>
            </article>
          </div>

          <div v-else-if="selectedSeason" class="empty-episodes">
            <span class="empty-icon">▤</span>

            <h4>Brak odcinków</h4>

            <p>Ten sezon nie zawiera jeszcze żadnych odcinków.</p>
          </div>

          <div v-else class="empty-episodes">
            <span class="empty-icon">▤</span>

            <h4>Brak sezonów</h4>

            <p>Do tego serialu nie dodano jeszcze żadnych sezonów.</p>
          </div>
        </aside>
      </section>

      <section v-else class="state-card">
        <span class="state-icon">?</span>

        <div class="state-content">
          <h2>Brak danych</h2>

          <p>Nie znaleziono informacji o wybranym serialu.</p>
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

.app-browse-series {
  min-height: 100%;
  padding: 2rem;
  color: $white;
  font-family: $font-family;
  background:
    radial-gradient(circle at 85% 15%, rgba($primary, 0.13), transparent 30rem),
    radial-gradient(circle at 10% 90%, rgba($secondary, 0.08), transparent 30rem), $black;
}

.browse-container {
  width: min(100%, 1380px);
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
    letter-spacing: -0.04em;
  }
}

.eyebrow,
.content-type,
.section-label {
  color: $primary;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.id-badge,
.episode-count {
  padding: 0.45rem 0.75rem;
  color: rgba($white, 0.8);
  font-size: 0.75rem;
  background: rgba($accent, 0.8);
  border: 1px solid rgba($primary, 0.18);
  border-radius: 999px;
}

.id-badge {
  font-family: monospace;
}

.series-card {
  display: grid;
  grid-template-columns:
    minmax(0, 0.9fr)
    minmax(420px, 1.1fr);
  min-height: 660px;
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
  min-width: 0;
  flex-direction: column;
  padding: clamp(1.5rem, 4vw, 3.5rem);
}

.title-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.availability {
  padding: 0.25rem 0.55rem;
  color: $primary;
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba($primary, 0.08);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 999px;
  text-transform: uppercase;

  &.unavailable {
    color: #ff8a8a;
    background: rgba(255, 70, 70, 0.08);
    border-color: rgba(255, 70, 70, 0.2);
  }
}

.title-section h2 {
  margin: 0.6rem 0 0.75rem;
  color: #fff;
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.03;
  letter-spacing: -0.055em;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  color: rgba($white, 0.78);
  font-size: 0.88rem;
}

.summary-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  flex: 0 0 auto;
  background: $primary;
  border-radius: 50%;
}

.description {
  margin: 2rem 0;
  color: rgba($white, 0.88);
  font-size: 1rem;
  line-height: 1.75;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.metadata-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
  background: rgba($black, 0.32);
  border: 1px solid rgba($white, 0.08);
  border-radius: 12px;

  strong {
    overflow: hidden;
    color: #f0f5f2;
    font-size: 0.94rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.metadata-label {
  color: rgba($white, 0.55);
  font-size: 0.7rem;
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
  font-size: 0.77rem;
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
  padding: 0.75rem 1.25rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 10px;
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 3px;
  }
}

:deep(.btn-primary) {
  color: black;
  background-color: $primary;
  border-color: $primary;

  &:hover:not(:disabled) {
    color: black;
    background-color: $secondary;
    border-color: $secondary;
  }
}

:deep(.btn-outline-primary) {
  color: $primary;
  background: transparent;
  border-color: $primary;

  &:hover:not(:disabled) {
    color: black;
    background-color: $primary;
    border-color: $primary;
  }
}

:deep(.btn-outline-primary.watchlist-active) {
  color: $primary;
  background: rgba($primary, 0.12);
  border-color: rgba($primary, 0.72);
  box-shadow: inset 0 0 0 1px rgba($primary, 0.08);

  &:hover:not(:disabled) {
    color: #fff;
    background: rgba(170, 35, 35, 0.72);
    border-color: rgba(255, 100, 100, 0.72);
  }
}

.play-icon {
  font-size: 0.8rem;
}

.button-icon {
  width: 1rem;
  font-size: 1.2rem;
  line-height: 1;
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

.episodes-panel {
  display: flex;
  min-width: 0;
  max-height: 760px;
  flex-direction: column;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  background: linear-gradient(145deg, rgba($primary, 0.075), rgba($black, 0.5));
  border-left: 1px solid rgba($white, 0.06);
}

.episodes-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0.3rem 0 0;
    color: #fff;
    font-size: 1.5rem;
    letter-spacing: -0.035em;
  }
}

.season-selector {
  margin-bottom: 1.25rem;
}

.selector-label {
  display: block;
  margin-bottom: 0.65rem;
  color: rgba($white, 0.62);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.season-tabs {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba($primary, 0.5) transparent;
}

.season-tab {
  display: flex;
  min-width: max-content;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.7rem 0.9rem;
  color: rgba($white, 0.75);
  font-family: inherit;
  cursor: pointer;
  background: rgba($black, 0.3);
  border: 1px solid rgba($white, 0.08);
  border-radius: 10px;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease;

  span {
    font-size: 0.83rem;
    font-weight: 700;
  }

  small {
    color: rgba($white, 0.45);
    font-size: 0.67rem;
  }

  &:hover {
    color: #fff;
    border-color: rgba($primary, 0.35);
  }

  &.active {
    color: $primary;
    background: rgba($primary, 0.1);
    border-color: rgba($primary, 0.5);

    small {
      color: rgba($primary, 0.7);
    }
  }
}

.season-select {
  display: none;
  width: 100%;
  min-height: 46px;
  padding: 0 0.9rem;
  color: #fff;
  font-family: inherit;
  background: $accent;
  border: 1px solid rgba($primary, 0.35);
  border-radius: 9px;
}

.episodes-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.65rem;
  padding-right: 0.4rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba($primary, 0.5) transparent;
}

.episode-card {
  display: grid;
  grid-template-columns:
    44px
    minmax(0, 1fr)
    42px;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem;
  background: rgba($black, 0.34);
  border: 1px solid rgba($white, 0.07);
  border-radius: 12px;
  transition:
    transform 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease;

  &:hover {
    background: rgba($accent, 0.9);
    border-color: rgba($primary, 0.25);
    transform: translateX(-2px);
  }

  &.unavailable {
    opacity: 0.58;
  }
}

.episode-number {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-weight: 750;
  background: rgba($primary, 0.09);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 10px;
}

.episode-info {
  min-width: 0;

  h4 {
    margin: 0 0 0.35rem;
    overflow: hidden;
    color: #f5f7f6;
    font-size: 0.92rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.episode-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba($white, 0.5);
  font-size: 0.7rem;
}

.episode-play {
  display: flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  color: $black;
  font-size: 0.72rem;
  cursor: pointer;
  background: $primary;
  border: 0;
  border-radius: 50%;
  transition:
    transform 150ms ease,
    background-color 150ms ease;

  &:hover:not(:disabled) {
    background: $secondary;
    transform: scale(1.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
}

.empty-episodes {
  display: flex;
  min-height: 300px;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba($white, 0.6);
  text-align: center;
  border: 1px dashed rgba($primary, 0.2);
  border-radius: 14px;

  h4 {
    margin: 0.8rem 0 0.35rem;
    color: rgba(#fff, 0.9);
  }

  p {
    max-width: 290px;
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
  }
}

.empty-icon {
  color: rgba($primary, 0.55);
  font-size: 3rem;
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
  width: 72%;
  height: 64px;
  margin-top: 2rem;
}

.skeleton-meta {
  width: 45%;
  height: 18px;
  margin-top: 1rem;
}

.skeleton-description {
  width: 100%;
  height: 18px;
  margin-top: 3rem;

  &.short {
    width: 70%;
    margin-top: 0.8rem;
  }
}

.skeleton-grid {
  width: 100%;
  height: 130px;
  margin-top: 2rem;
}

.skeleton-actions {
  width: 85%;
  height: 48px;
  margin-top: auto;
}

.skeleton-panel-title {
  width: 45%;
  height: 32px;
  margin-bottom: 1.5rem;
}

.skeleton-season-select {
  width: 100%;
  height: 54px;
  margin-bottom: 1.25rem;
}

.episode-skeleton {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem;
}

.skeleton-episode-number {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
}

.episode-skeleton-content {
  width: 100%;
}

.skeleton-episode-title {
  width: 65%;
  height: 15px;
}

.skeleton-episode-meta {
  width: 35%;
  height: 11px;
  margin-top: 0.65rem;
}

@keyframes shimmer {
  to {
    background-position-x: -200%;
  }
}

@media (max-width: 1050px) {
  .series-card {
    grid-template-columns: 1fr;
  }

  .episodes-panel {
    max-height: none;
    min-height: 600px;
    border-top: 1px solid rgba($white, 0.06);
    border-left: 0;
  }

  .details-panel {
    min-height: 580px;
  }

  .episodes-list {
    max-height: 540px;
  }
}

@media (max-width: 640px) {
  .app-browse-series {
    padding: 1rem;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .series-card {
    border-radius: 16px;
  }

  .details-panel,
  .episodes-panel {
    padding: 1.25rem;
  }

  .details-panel {
    min-height: auto;
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

  .season-tabs {
    display: none;
  }

  .season-select {
    display: block;
  }

  .episode-card {
    grid-template-columns:
      38px
      minmax(0, 1fr)
      36px;
    gap: 0.65rem;
    padding: 0.7rem;
  }

  .episode-number {
    width: 36px;
    height: 36px;
  }

  .episode-play {
    width: 34px;
    height: 34px;
  }

  .episodes-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .state-card {
    align-items: flex-start;
    flex-direction: column;

    .btn {
      width: 100%;
      margin-left: 0;
    }
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

  &.active,
  &.selected {
    color: $primary;
    text-shadow: 0 0 14px rgba($primary, 0.4);
  }
}

.rating-spinner {
  width: 22px;
  height: 22px;
  margin-left: 0.7rem;
  border: 2px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: rating-spin 0.7s linear infinite;
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

@keyframes rating-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .star-button {
    width: 38px;
    height: 38px;
    font-size: 1.55rem;
  }
}
</style>
