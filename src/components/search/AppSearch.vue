<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/api/client'
import { ContentType, type ContentResponse } from '@/types/LibraryContent'
import placeholder from '@/resources/logo.png'

type GenreValue = 'ACTION' | 'COMEDY' | 'DRAMA' | 'DOCUMENTARY' | 'HORROR'
type YearInput = number | ''

type GenreOption = {
  value: GenreValue
  label: string
}

const GENRES: GenreOption[] = [
  {
    value: 'ACTION',
    label: 'Akcja',
  },
  {
    value: 'COMEDY',
    label: 'Komedia',
  },
  {
    value: 'DRAMA',
    label: 'Dramat',
  },
  {
    value: 'DOCUMENTARY',
    label: 'Dokumentalny',
  },
  {
    value: 'HORROR',
    label: 'Horror',
  },
]

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const phrase = ref('')
const genre = ref<GenreValue | ''>('')
const yearFrom = ref<YearInput>('')
const yearTo = ref<YearInput>('')

const results = ref<ContentResponse[]>([])
const loading = ref(false)
const requestError = ref<string | null>(null)
const formError = ref<string | null>(null)

let controller: AbortController | null = null

function getAccessToken(): string | undefined {
  const storeToken = auth.user?.accessToken

  if (storeToken) {
    return storeToken
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

function firstQueryValue(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? '')
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

function isGenreValue(value: string): value is GenreValue {
  return GENRES.some((option) => option.value === value)
}

function parseYearFromQuery(value: unknown): YearInput {
  const raw = firstQueryValue(value).trim()

  if (!raw) {
    return ''
  }

  const parsed = Number(raw)

  return Number.isInteger(parsed) ? parsed : ''
}

function normalizeYear(value: YearInput): number | null {
  if (value === '') {
    return null
  }

  return Number.isInteger(value) ? value : null
}

function hydrateFormFromUrl() {
  phrase.value = firstQueryValue(route.query.phrase)

  const routeGenre = firstQueryValue(route.query.genre).toUpperCase()

  genre.value = isGenreValue(routeGenre) ? routeGenre : ''

  yearFrom.value = parseYearFromQuery(route.query.yearFrom)
  yearTo.value = parseYearFromQuery(route.query.yearTo)
}

function validateForm(): string | null {
  const from = normalizeYear(yearFrom.value)
  const to = normalizeYear(yearTo.value)

  if (yearFrom.value !== '' && from === null) {
    return 'Rok początkowy musi być liczbą całkowitą.'
  }

  if (yearTo.value !== '' && to === null) {
    return 'Rok końcowy musi być liczbą całkowitą.'
  }

  if (from !== null && from < 1888) {
    return 'Rok początkowy nie może być wcześniejszy niż 1888.'
  }

  if (to !== null && to < 1888) {
    return 'Rok końcowy nie może być wcześniejszy niż 1888.'
  }

  if (from !== null && to !== null && from > to) {
    return 'Rok początkowy nie może być większy od końcowego.'
  }

  return null
}

function buildFilterQuery(): Record<string, string> {
  const query: Record<string, string> = {}

  const normalizedPhrase = phrase.value.trim()
  const normalizedYearFrom = normalizeYear(yearFrom.value)
  const normalizedYearTo = normalizeYear(yearTo.value)

  if (normalizedPhrase) {
    query.phrase = normalizedPhrase
  }

  if (genre.value) {
    query.genre = genre.value
  }

  if (normalizedYearFrom !== null) {
    query.yearFrom = String(normalizedYearFrom)
  }

  if (normalizedYearTo !== null) {
    query.yearTo = String(normalizedYearTo)
  }

  return query
}

function buildFilterPath(): string {
  const query = buildFilterQuery()
  const params = new URLSearchParams(query)
  const queryString = params.toString()

  return queryString ? `/library/filter?${queryString}` : '/library/filter'
}

function currentRouteFilterQuery(): Record<string, string> {
  const current: Record<string, string> = {}

  const currentPhrase = firstQueryValue(route.query.phrase).trim()

  const currentGenre = firstQueryValue(route.query.genre).trim()

  const currentYearFrom = firstQueryValue(route.query.yearFrom).trim()

  const currentYearTo = firstQueryValue(route.query.yearTo).trim()

  if (currentPhrase) {
    current.phrase = currentPhrase
  }

  if (currentGenre) {
    current.genre = currentGenre
  }

  if (currentYearFrom) {
    current.yearFrom = currentYearFrom
  }

  if (currentYearTo) {
    current.yearTo = currentYearTo
  }

  return current
}

function queriesAreEqual(first: Record<string, string>, second: Record<string, string>): boolean {
  return JSON.stringify(first) === JSON.stringify(second)
}

async function fetchResults() {
  const validationError = validateForm()

  formError.value = validationError

  if (validationError) {
    results.value = []
    requestError.value = null
    return
  }

  const token = getAccessToken()

  if (!token) {
    results.value = []
    requestError.value = 'Musisz być zalogowana, aby przeszukiwać bibliotekę.'
    return
  }

  controller?.abort()

  const currentController = new AbortController()

  controller = currentController

  loading.value = true
  requestError.value = null

  try {
    results.value = await apiFetch<ContentResponse[]>(
      buildFilterPath(),
      {
        method: 'GET',
        signal: currentController.signal,
      },
      token
    )
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    results.value = []

    requestError.value =
      error instanceof Error ? error.message : 'Nie udało się pobrać wyników wyszukiwania.'
  } finally {
    if (controller === currentController) {
      loading.value = false
    }
  }
}

async function submitSearch() {
  const validationError = validateForm()

  formError.value = validationError

  if (validationError) {
    return
  }

  const nextQuery = buildFilterQuery()
  const currentQuery = currentRouteFilterQuery()

  if (queriesAreEqual(nextQuery, currentQuery)) {
    await fetchResults()
    return
  }

  await router.replace({
    query: nextQuery as LocationQueryRaw,
  })
}

async function resetFilters() {
  phrase.value = ''
  genre.value = ''
  yearFrom.value = ''
  yearTo.value = ''

  formError.value = null

  const nextQuery: Record<string, string> = {}
  const currentQuery = currentRouteFilterQuery()

  if (queriesAreEqual(nextQuery, currentQuery)) {
    await fetchResults()
    return
  }

  await router.replace({
    query: {},
  })
}

function goToContent(item: ContentResponse) {
  switch (item.contentType) {
    case ContentType.MOVIE:
      void router.push(`/browse/movie/${item.id}`)
      break

    case ContentType.SERIES:
      void router.push(`/browse/series/${item.id}`)
      break
  }
}

function handleImageError(event: Event) {
  const image = event.currentTarget as HTMLImageElement

  if (image.dataset.fallbackApplied === 'true') {
    return
  }

  image.dataset.fallbackApplied = 'true'
  image.src = placeholder
}

function contentTypeLabel(contentType: ContentType): string {
  switch (contentType) {
    case ContentType.MOVIE:
      return 'Film'

    case ContentType.SERIES:
      return 'Serial'

    default:
      return 'Materiał'
  }
}

function genreLabel(value: string): string {
  return GENRES.find((option) => option.value === value)?.label ?? value
}

function formatDuration(durationSeconds?: number): string | null {
  if (durationSeconds === undefined || durationSeconds <= 0) {
    return null
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

function resultWord(count: number): string {
  if (count === 1) {
    return 'wynik'
  }

  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return 'wyniki'
  }

  return 'wyników'
}

const hasActiveFilters = computed(() => {
  return Boolean(
    phrase.value.trim() ||
      genre.value ||
      yearFrom.value !== '' ||
      yearTo.value !== ''
  )
})

const searchDescription = computed(() => {
  const normalizedPhrase = phrase.value.trim()

  if (normalizedPhrase) {
    return `Wyniki dla frazy „${normalizedPhrase}”`
  }

  if (hasActiveFilters.value) {
    return 'Wyniki dla wybranych filtrów'
  }

  return 'Wszystkie pozycje w bibliotece'
})

watch(
  () => [route.query.phrase, route.query.genre, route.query.yearFrom, route.query.yearTo],
  () => {
    hydrateFormFromUrl()
    void fetchResults()
  },
  {
    immediate: true,
  }
)

watch(
  () => auth.user?.accessToken,
  (token, previousToken) => {
    if (token !== previousToken) {
      void fetchResults()
    }
  }
)

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <main class="app-search">
    <div class="search-container">
      <header class="page-header">
        <div>
          <span class="eyebrow"> Biblioteka </span>

          <h1>Wyszukiwanie</h1>

          <p>Znajdź film lub serial i dopasuj wyniki za pomocą dodatkowych filtrów.</p>
        </div>

        <span v-if="!loading && !requestError" class="results-badge">
          {{ results.length }}
          {{ resultWord(results.length) }}
        </span>
      </header>

      <form class="search-form" @submit.prevent="submitSearch">
        <div class="main-search">
          <label class="field-label" for="search-phrase"> Szukana fraza </label>

          <div class="search-input-wrapper">
            <span class="search-icon" aria-hidden="true"> ⌕ </span>

            <input
              id="search-phrase"
              v-model="phrase"
              class="search-input"
              type="search"
              name="phrase"
              placeholder="Wpisz tytuł, opis lub słowo kluczowe..."
              autocomplete="off"
            />

            <button
              v-if="phrase"
              type="button"
              class="clear-input"
              aria-label="Wyczyść frazę"
              @click="phrase = ''"
            >
              ×
            </button>
          </div>
        </div>

        <div class="advanced-filters">
          <div class="form-field">
            <label class="field-label" for="search-genre"> Gatunek </label>

            <select id="search-genre" v-model="genre" class="filter-control" name="genre">
              <option value="">Wszystkie gatunki</option>

              <option v-for="option in GENRES" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-field">
            <label class="field-label" for="year-from"> Rok od </label>

            <input
              id="year-from"
              v-model.number="yearFrom"
              class="filter-control"
              type="number"
              name="yearFrom"
              min="1888"
              max="2100"
              step="1"
              placeholder="np. 1990"
              inputmode="numeric"
            />
          </div>

          <div class="form-field">
            <label class="field-label" for="year-to"> Rok do </label>

            <input
              id="year-to"
              v-model.number="yearTo"
              class="filter-control"
              type="number"
              name="yearTo"
              min="1888"
              max="2100"
              step="1"
              placeholder="np. 2025"
              inputmode="numeric"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="search-button" :disabled="loading">
              <span v-if="loading" class="button-spinner" aria-hidden="true" />

              <span v-else aria-hidden="true"> ⌕ </span>

              {{ loading ? 'Wyszukiwanie...' : 'Szukaj' }}
            </button>

            <button
              type="button"
              class="reset-button"
              :disabled="loading || !hasActiveFilters"
              @click="resetFilters"
            >
              Wyczyść
            </button>
          </div>
        </div>

        <p v-if="formError" class="form-error" role="alert">
          {{ formError }}
        </p>
      </form>

      <section class="results-section">
        <header class="results-header">
          <div>
            <span class="section-label"> Wyniki </span>

            <h2>{{ searchDescription }}</h2>
          </div>

          <span v-if="genre" class="active-filter">
            {{ genreLabel(genre) }}
          </span>
        </header>

        <div v-if="loading" class="results-grid" aria-label="Ładowanie wyników">
          <article
            v-for="index in 8"
            :key="index"
            class="result-card skeleton-card"
            aria-hidden="true"
          >
            <div class="skeleton skeleton-image" />

            <div class="skeleton-card-body">
              <div class="skeleton skeleton-title" />

              <div class="skeleton skeleton-meta" />

              <div class="skeleton skeleton-description" />
            </div>
          </article>
        </div>

        <div v-else-if="requestError" class="state-card error-state" role="alert">
          <span class="state-icon">!</span>

          <div class="state-content">
            <h2>Nie udało się pobrać wyników</h2>

            <p>{{ requestError }}</p>
          </div>

          <button type="button" class="retry-button" @click="fetchResults">Spróbuj ponownie</button>
        </div>

        <div v-else-if="results.length === 0" class="state-card empty-state">
          <span class="state-icon">⌕</span>

          <div class="state-content">
            <h2>Brak wyników</h2>

            <p>Nie znaleziono pozycji pasujących do wybranych kryteriów.</p>
          </div>

          <button
            v-if="hasActiveFilters"
            type="button"
            class="retry-button outline"
            @click="resetFilters"
          >
            Wyczyść filtry
          </button>
        </div>

        <div v-else class="results-grid">
          <button
            v-for="item in results"
            :key="item.id"
            type="button"
            class="result-card"
            :aria-label="`Otwórz ${item.title}`"
            @click="goToContent(item)"
          >
            <span class="thumbnail-wrapper">
              <img
                :src="item.thumbnailUrl || placeholder"
                :alt="item.title"
                loading="lazy"
                draggable="false"
                @error="handleImageError"
              />

              <span class="thumbnail-shade" />

              <span class="content-type-badge">
                {{ contentTypeLabel(item.contentType) }}
              </span>

              <span v-if="!item.available" class="availability-badge"> Niedostępny </span>

              <span class="play-indicator" aria-hidden="true"> ▶ </span>
            </span>

            <span class="card-body">
              <span class="card-heading">
                <strong>{{ item.title }}</strong>

                <span class="release-year">
                  {{ item.releaseYear }}
                </span>
              </span>

              <span class="card-metadata">
                <span>
                  {{ genreLabel(item.genre) }}
                </span>

                <template v-if="formatDuration(item.durationSeconds)">
                  <span class="metadata-dot" />

                  <span>
                    {{ formatDuration(item.durationSeconds) }}
                  </span>
                </template>

                <template
                  v-else-if="item.contentType === ContentType.SERIES && item.seasons?.length"
                >
                  <span class="metadata-dot" />

                  <span>
                    {{ item.seasons.length }}
                    {{ item.seasons.length === 1 ? 'sezon' : 'sezonów' }}
                  </span>
                </template>
              </span>

              <span class="description">
                {{ item.description || 'Brak opisu dla tej pozycji.' }}
              </span>

              <span class="card-footer">
                <span> Zobacz szczegóły </span>

                <span aria-hidden="true"> → </span>
              </span>
            </span>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.app-search {
  min-height: 100vh;
  padding: 2rem;
  color: $white;
  font-family: $font-family;
  background:
    radial-gradient(circle at 80% 8%, rgba($primary, 0.12), transparent 32rem),
    radial-gradient(circle at 5% 70%, rgba($secondary, 0.07), transparent 30rem), $black;
}

.search-container {
  width: min(100%, 1450px);
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  h1 {
    margin: 0.3rem 0 0;
    color: #f4f7f5;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.055em;
  }

  p {
    max-width: 640px;
    margin: 0.85rem 0 0;
    color: rgba($white, 0.68);
    font-size: 0.95rem;
    line-height: 1.6;
  }
}

.eyebrow,
.section-label {
  color: $primary;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.results-badge {
  flex: 0 0 auto;
  padding: 0.5rem 0.8rem;
  color: $primary;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba($primary, 0.07);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 999px;
}

.search-form {
  padding: clamp(1.25rem, 3vw, 2rem);
  background: linear-gradient(135deg, rgba($accent, 0.9), rgba($black, 0.88));
  border: 1px solid rgba($primary, 0.14);
  border-radius: 20px;
  box-shadow:
    0 22px 55px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.025);
}

.main-search {
  width: 100%;
}

.field-label {
  display: block;
  margin-bottom: 0.55rem;
  color: rgba($white, 0.68);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 1rem;
  color: $primary;
  font-size: 1.45rem;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input,
.filter-control {
  width: 100%;
  color: #f7faf8;
  font-family: inherit;
  background: rgba($black, 0.48);
  border: 1px solid rgba($white, 0.1);
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;

  &:hover {
    border-color: rgba($primary, 0.3);
  }

  &:focus {
    background: rgba($black, 0.66);
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.12);
  }

  &::placeholder {
    color: rgba($white, 0.35);
  }
}

.search-input {
  min-height: 58px;
  padding: 0 3.2rem;
  font-size: 1rem;
  border-radius: 12px;

  &::-webkit-search-cancel-button {
    display: none;
  }
}

.clear-input {
  position: absolute;
  top: 50%;
  right: 0.8rem;
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: rgba($white, 0.56);
  font-size: 1.35rem;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
  transform: translateY(-50%);

  &:hover {
    color: $primary;
    background: rgba($primary, 0.08);
  }

  &:focus-visible {
    outline: 2px solid rgba($primary, 0.4);
  }
}

.advanced-filters {
  display: grid;
  grid-template-columns:
    minmax(180px, 1fr)
    minmax(130px, 0.55fr)
    minmax(130px, 0.55fr)
    auto;
  align-items: end;
  gap: 1rem;
  margin-top: 1.2rem;
}

.form-field {
  min-width: 0;
}

.filter-control {
  min-height: 46px;
  padding: 0 0.85rem;
  font-size: 0.86rem;
  border-radius: 9px;

  option {
    color: #fff;
    background: $accent;
  }
}

.form-actions {
  display: flex;
  gap: 0.6rem;
}

.search-button,
.reset-button,
.retry-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.7rem 1.1rem;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 750;
  cursor: pointer;
  border-radius: 9px;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

.search-button,
.retry-button {
  color: $black;
  background: $primary;
  border: 1px solid $primary;

  &:hover:not(:disabled) {
    background: $secondary;
    border-color: $secondary;
  }
}

.reset-button,
.retry-button.outline {
  color: $primary;
  background: transparent;
  border: 1px solid rgba($primary, 0.5);

  &:hover:not(:disabled) {
    color: $black;
    background: $primary;
    border-color: $primary;
  }
}

.button-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgba($black, 0.25);
  border-top-color: $black;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.form-error {
  margin: 1rem 0 0;
  padding: 0.75rem 0.9rem;
  color: #ffabab;
  font-size: 0.8rem;
  background: rgba(170, 0, 0, 0.12);
  border: 1px solid rgba(255, 80, 80, 0.18);
  border-radius: 8px;
}

.results-section {
  margin-top: 2.5rem;
}

.results-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;

  h2 {
    margin: 0.25rem 0 0;
    color: #f4f7f5;
    font-size: clamp(1.35rem, 3vw, 2rem);
    letter-spacing: -0.04em;
  }
}

.active-filter {
  padding: 0.4rem 0.7rem;
  color: $primary;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba($primary, 0.07);
  border: 1px solid rgba($primary, 0.18);
  border-radius: 999px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.25rem;
}

.result-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  color: $white;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(145deg, rgba($accent, 0.9), rgba($black, 0.96));
  border: 1px solid rgba($white, 0.07);
  border-radius: 15px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.25);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    border-color: rgba($primary, 0.42);
    box-shadow:
      0 22px 44px rgba(0, 0, 0, 0.4),
      0 0 24px rgba($primary, 0.06);
    transform: translateY(-6px);
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.34);
    outline-offset: 3px;
  }
}

.thumbnail-wrapper {
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
      filter 300ms ease,
      transform 300ms ease;
  }
}

.result-card:hover {
  .thumbnail-wrapper img {
    filter: brightness(0.68);
    transform: scale(1.06);
  }

  .play-indicator {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.thumbnail-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba($black, 0.03), rgba($black, 0.7));
}

.content-type-badge,
.availability-badge {
  position: absolute;
  top: 0.7rem;
  padding: 0.3rem 0.55rem;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  border-radius: 999px;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.content-type-badge {
  left: 0.7rem;
  color: $primary;
  background: rgba($black, 0.74);
  border: 1px solid rgba($primary, 0.28);
}

.availability-badge {
  right: 0.7rem;
  color: #ffb0b0;
  background: rgba(90, 0, 0, 0.72);
  border: 1px solid rgba(255, 90, 90, 0.28);
}

.play-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  padding-left: 3px;
  color: $black;
  font-size: 0.82rem;
  background: $primary;
  border-radius: 50%;
  box-shadow: 0 12px 30px rgba($primary, 0.25);
  opacity: 0;
  transform: translate(-50%, -40%) scale(0.8);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.card-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding: 1rem;
}

.card-heading {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;

  strong {
    display: -webkit-box;
    overflow: hidden;
    color: #f7faf8;
    font-size: 0.98rem;
    line-height: 1.35;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.release-year {
  flex: 0 0 auto;
  padding: 0.24rem 0.4rem;
  color: rgba($white, 0.7);
  font-size: 0.65rem;
  background: rgba($white, 0.05);
  border-radius: 6px;
}

.card-metadata {
  display: flex;
  min-height: 1rem;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.6rem;
  color: rgba($white, 0.54);
  font-size: 0.7rem;
}

.metadata-dot {
  width: 3px;
  height: 3px;
  background: $primary;
  border-radius: 50%;
}

.description {
  display: -webkit-box;
  min-height: 3.9em;
  margin-top: 0.85rem;
  overflow: hidden;
  color: rgba($white, 0.67);
  font-size: 0.78rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 1rem;
  color: $primary;
  font-size: 0.72rem;
  font-weight: 700;
}

.state-card {
  display: flex;
  min-height: 210px;
  align-items: center;
  gap: 1.2rem;
  padding: 2rem;
  background: rgba($accent, 0.68);
  border: 1px solid rgba($primary, 0.14);
  border-radius: 16px;

  h2 {
    margin: 0;
    color: #fff;
    font-size: 1.2rem;
  }

  p {
    margin: 0.45rem 0 0;
    color: rgba($white, 0.66);
    font-size: 0.85rem;
    line-height: 1.5;
  }
}

.state-content {
  flex: 1;
}

.state-icon {
  display: flex;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 1.4rem;
  font-weight: 800;
  background: rgba($primary, 0.08);
  border: 1px solid rgba($primary, 0.22);
  border-radius: 50%;
}

.error-state {
  border-color: rgba(255, 80, 80, 0.18);

  .state-icon {
    color: #ff8d8d;
    background: rgba(255, 60, 60, 0.08);
    border-color: rgba(255, 80, 80, 0.22);
  }
}

.skeleton-card {
  pointer-events: none;
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

.skeleton-card-body {
  padding: 1rem;
}

.skeleton-title {
  width: 74%;
  height: 16px;
  border-radius: 5px;
}

.skeleton-meta {
  width: 48%;
  height: 10px;
  margin-top: 0.75rem;
  border-radius: 5px;
}

.skeleton-description {
  width: 100%;
  height: 48px;
  margin-top: 1rem;
  border-radius: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  to {
    background-position-x: -200%;
  }
}

@media (max-width: 1000px) {
  .advanced-filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .form-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .app-search {
    padding: 1rem;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .advanced-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-field:first-child {
    grid-column: 1 / -1;
  }

  .form-actions {
    width: 100%;

    > button {
      flex: 1;
    }
  }

  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .results-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .state-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .retry-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .advanced-filters {
    grid-template-columns: 1fr;
  }

  .form-field:first-child,
  .form-actions {
    grid-column: auto;
  }

  .form-actions {
    flex-direction: column;

    > button {
      width: 100%;
    }
  }

  .results-grid {
    grid-template-columns: 1fr;
  }

  .search-input {
    min-height: 52px;
    font-size: 0.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-card,
  .thumbnail-wrapper img,
  .play-indicator,
  .search-button,
  .reset-button,
  .retry-button,
  .skeleton,
  .button-spinner {
    transition: none;
    animation: none;
  }
}
</style>
