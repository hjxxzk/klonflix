<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BButton } from 'bootstrap-vue-3'
import AppNavbarAdmin from '@/components/admin/AppNavbarAdmin.vue'
import ContentCard from '@/components/admin/ContentCard.vue'
import SeriesDetailPanel from '@/components/admin/SeriesDetailPanel.vue'
import ContentFormModal from '@/components/admin/ContentFormModal.vue'
import SeasonFormModal from '@/components/admin/SeasonFormModal.vue'
import EpisodeFormModal from '@/components/admin/EpisodeFormModal.vue'
import { ApiError } from '@/api/client'
import {
  addEpisode,
  addSeason,
  browseLibrary,
  createContent,
  deleteContent,
  updateContent,
  updateEpisode,
  updateSeason,
} from '@/api/content'
import { useAuthStore } from '@/stores/auth.ts'
import type {
  ContentRequest,
  ContentResponse,
  ContentType,
  EpisodeRequest,
  EpisodeResponse,
  SeasonRequest,
  SeasonResponse,
} from '@/types/Content'

const auth = useAuthStore()

const contents = ref<ContentResponse[]>([])
const currentPage = ref(1)
const pageSize = ref(12)
const itemCount = ref(0)
const isLoading = ref(false)
const apiError = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const expandedSeriesId = ref<string | null>(null)

const contentModalVisible = ref(false)
const contentModalMode = ref<'create' | 'edit'>('create')
const contentModalType = ref<ContentType>('MOVIE')
const editingContent = ref<ContentResponse | null>(null)

const seasonModalVisible = ref(false)
const seasonModalMode = ref<'create' | 'edit'>('create')
const seasonSeries = ref<ContentResponse | null>(null)
const editingSeason = ref<SeasonResponse | null>(null)

const episodeModalVisible = ref(false)
const episodeModalMode = ref<'create' | 'edit'>('create')
const episodeSeries = ref<ContentResponse | null>(null)
const episodeSeason = ref<SeasonResponse | null>(null)
const editingEpisode = ref<EpisodeResponse | null>(null)

const hasNextPage = computed(() => itemCount.value === pageSize.value)
const hasPreviousPage = computed(() => currentPage.value > 1)

const expandedSeries = computed(() =>
  contents.value.find((content) => content.id === expandedSeriesId.value) ?? null,
)

function clearMessages(): void {
  apiError.value = null
  successMessage.value = null
}

function showSuccess(message: string): void {
  successMessage.value = message
  apiError.value = null
}

function handleApiFailure(error: unknown, fallback: string): void {
  if (error instanceof ApiError) {
    apiError.value = error.message
  } else {
    apiError.value = fallback
  }
  successMessage.value = null
}

async function loadLibrary(): Promise<void> {
  const token = auth.user?.accessToken
  if (!token) {
    return
  }

  isLoading.value = true
  clearMessages()

  try {
    const response = await browseLibrary(token, currentPage.value, pageSize.value)
    contents.value = response.contents
    itemCount.value = response.pagination.itemCount

    if (
      expandedSeriesId.value &&
      !contents.value.some((content) => content.id === expandedSeriesId.value)
    ) {
      expandedSeriesId.value = null
    }
  } catch (error) {
    handleApiFailure(error, 'Nie udało się pobrać biblioteki treści.')
  } finally {
    isLoading.value = false
  }
}

function goToPage(page: number): void {
  currentPage.value = page
  expandedSeriesId.value = null
  void loadLibrary()
}

function toggleSeries(content: ContentResponse): void {
  expandedSeriesId.value = expandedSeriesId.value === content.id ? null : content.id
}

function openCreateContent(type: ContentType): void {
  contentModalMode.value = 'create'
  contentModalType.value = type
  editingContent.value = null
  contentModalVisible.value = true
}

function openEditContent(content: ContentResponse): void {
  contentModalMode.value = 'edit'
  editingContent.value = content
  contentModalVisible.value = true
}

async function handleContentSave(payload: ContentRequest): Promise<void> {
  const token = auth.user?.accessToken
  if (!token) {
    return
  }

  clearMessages()

  try {
    if (contentModalMode.value === 'create') {
      await createContent(token, payload)
      showSuccess(payload.type === 'MOVIE' ? 'Film został dodany.' : 'Serial został dodany.')
    } else if (editingContent.value) {
      await updateContent(token, editingContent.value.id, payload)
      showSuccess('Treść została zaktualizowana.')
    }

    contentModalVisible.value = false
    await loadLibrary()
  } catch (error) {
    handleApiFailure(error, 'Nie udało się zapisać treści.')
  }
}

async function handleDeleteContent(content: ContentResponse): Promise<void> {
  const message =
    content.type === 'SERIES'
      ? `Usunąć serial „${content.title}” wraz ze wszystkimi sezonami i odcinkami?`
      : `Usunąć film „${content.title}”?`

  if (!window.confirm(message)) {
    return
  }

  const token = auth.user?.accessToken
  if (!token) {
    return
  }

  clearMessages()

  try {
    await deleteContent(token, content.id)
    if (expandedSeriesId.value === content.id) {
      expandedSeriesId.value = null
    }
    showSuccess('Treść została usunięta.')
    await loadLibrary()
  } catch (error) {
    handleApiFailure(error, 'Nie udało się usunąć treści.')
  }
}

function openCreateSeason(series: ContentResponse): void {
  seasonModalMode.value = 'create'
  seasonSeries.value = series
  editingSeason.value = null
  seasonModalVisible.value = true
}

function openEditSeason(series: ContentResponse, season: SeasonResponse): void {
  seasonModalMode.value = 'edit'
  seasonSeries.value = series
  editingSeason.value = season
  seasonModalVisible.value = true
}

async function handleSeasonSave(payload: SeasonRequest): Promise<void> {
  const token = auth.user?.accessToken
  const series = seasonSeries.value
  if (!token || !series) {
    return
  }

  clearMessages()

  try {
    if (seasonModalMode.value === 'create') {
      await addSeason(token, series.id, payload)
      showSuccess('Sezon został dodany.')
    } else if (editingSeason.value) {
      await updateSeason(token, series.id, editingSeason.value.id, payload)
      showSuccess('Sezon został zaktualizowany.')
    }

    seasonModalVisible.value = false
    await loadLibrary()
    expandedSeriesId.value = series.id
  } catch (error) {
    handleApiFailure(error, 'Nie udało się zapisać sezonu.')
  }
}

function openCreateEpisode(series: ContentResponse, season: SeasonResponse): void {
  episodeModalMode.value = 'create'
  episodeSeries.value = series
  episodeSeason.value = season
  editingEpisode.value = null
  episodeModalVisible.value = true
}

function openEditEpisode(
  series: ContentResponse,
  season: SeasonResponse,
  episode: EpisodeResponse,
): void {
  episodeModalMode.value = 'edit'
  episodeSeries.value = series
  episodeSeason.value = season
  editingEpisode.value = episode
  episodeModalVisible.value = true
}

async function handleEpisodeSave(payload: EpisodeRequest): Promise<void> {
  const token = auth.user?.accessToken
  const series = episodeSeries.value
  const season = episodeSeason.value
  if (!token || !series || !season) {
    return
  }

  clearMessages()

  try {
    if (episodeModalMode.value === 'create') {
      await addEpisode(token, series.id, season.id, payload)
      showSuccess('Odcinek został dodany.')
    } else if (editingEpisode.value) {
      await updateEpisode(token, series.id, season.id, editingEpisode.value.id, payload)
      showSuccess('Odcinek został zaktualizowany.')
    }

    episodeModalVisible.value = false
    await loadLibrary()
    expandedSeriesId.value = series.id
  } catch (error) {
    handleApiFailure(error, 'Nie udało się zapisać odcinka.')
  }
}

function handleEditEpisode(season: SeasonResponse, episode: EpisodeResponse): void {
  const series = expandedSeries.value
  if (!series) {
    return
  }
  openEditEpisode(series, season, episode)
}

onMounted(() => {
  void loadLibrary()
})
</script>

<template>
  <div class="page">
    <AppNavbarAdmin />

    <main class="content">
      <section class="admin-panel">
        <header class="admin-header">
          <div class="admin-header__intro">
            <p class="admin-label">Panel administratora</p>
            <h1 class="admin-title">Biblioteka treści</h1>
            <p class="admin-subtitle">Zarządzaj filmami i serialami w katalogu platformy.</p>
          </div>

          <div class="admin-actions">
            <b-button variant="primary" @click="openCreateContent('MOVIE')">+ Film</b-button>
            <b-button variant="outline-primary" @click="openCreateContent('SERIES')">
              + Serial
            </b-button>
          </div>
        </header>

        <div v-if="apiError" class="alert alert-danger toast" role="alert">{{ apiError }}</div>
        <div v-if="successMessage" class="alert alert-success toast" role="alert">
          {{ successMessage }}
        </div>

        <div v-if="isLoading" class="status-message">
          <span class="loader" aria-hidden="true" />
          Ładowanie biblioteki...
        </div>

        <div v-else-if="contents.length === 0" class="empty-state">
          <p>Biblioteka jest pusta.</p>
          <b-button variant="primary" @click="openCreateContent('MOVIE')">Dodaj pierwszy film</b-button>
        </div>

        <div v-else class="content-grid">
          <ContentCard
            v-for="content in contents"
            :key="content.id"
            :content="content"
            :selected="expandedSeriesId === content.id"
            @edit="openEditContent(content)"
            @delete="handleDeleteContent(content)"
            @select="toggleSeries(content)"
          />
        </div>

        <SeriesDetailPanel
          v-if="expandedSeries"
          :series="expandedSeries"
          @close="expandedSeriesId = null"
          @add-season="openCreateSeason(expandedSeries)"
          @edit-season="openEditSeason(expandedSeries, $event)"
          @add-episode="openCreateEpisode(expandedSeries, $event)"
          @edit-episode="handleEditEpisode"
        />

        <footer v-if="!isLoading && contents.length > 0" class="pagination-bar">
          <span class="pagination-info">
            Strona {{ currentPage }} · {{ itemCount }} pozycji
          </span>
          <div class="pagination-actions">
            <b-button
              variant="outline-primary"
              :disabled="!hasPreviousPage"
              @click="goToPage(currentPage - 1)"
            >
              Poprzednia
            </b-button>
            <b-button variant="outline-primary" :disabled="!hasNextPage" @click="goToPage(currentPage + 1)">
              Następna
            </b-button>
          </div>
        </footer>
      </section>
    </main>

    <ContentFormModal
      :visible="contentModalVisible"
      :mode="contentModalMode"
      :content="editingContent"
      :initial-type="contentModalType"
      @close="contentModalVisible = false"
      @save="handleContentSave"
    />

    <SeasonFormModal
      :visible="seasonModalVisible"
      :mode="seasonModalMode"
      :season="editingSeason"
      :series-title="seasonSeries?.title"
      @close="seasonModalVisible = false"
      @save="handleSeasonSave"
    />

    <EpisodeFormModal
      :visible="episodeModalVisible"
      :mode="episodeModalMode"
      :episode="editingEpisode"
      :season-label="
        episodeSeason ? `Sezon ${episodeSeason.number} — ${episodeSeason.title}` : undefined
      "
      @close="episodeModalVisible = false"
      @save="handleEpisodeSave"
    />
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
  padding: 2rem clamp(1rem, 4vw, 2.5rem) 3rem;
  background:
    radial-gradient(ellipse at top right, rgba($primary, 0.08), transparent 45%),
    radial-gradient(ellipse at bottom left, rgba($primary, 0.04), transparent 40%);
}

.admin-panel {
  max-width: 1280px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.admin-label {
  margin: 0 0 0.35rem;
  color: $primary;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.admin-title {
  margin: 0;
  font-size: clamp(1.85rem, 3.5vw, 2.5rem);
  font-weight: 700;
  color: $white;
}

.admin-subtitle {
  margin: 0.5rem 0 0;
  max-width: 36rem;
  color: rgba($white, 0.55);
  font-size: 0.95rem;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.toast {
  margin-bottom: 1.25rem;
  border-radius: 10px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 1.25rem;
}

.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 1rem;
  color: rgba($white, 0.65);
}

.loader {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba($primary, 0.25);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 1rem;
  text-align: center;
  color: rgba($white, 0.65);
  border: 1px dashed rgba($white, 0.12);
  border-radius: 16px;
  background: rgba($accent, 0.35);
}

.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba($white, 0.08);
}

.pagination-info {
  color: rgba($white, 0.55);
  font-size: 0.9rem;
}

.pagination-actions {
  display: flex;
  gap: 0.75rem;
}

:deep(.alert-success) {
  background: rgba($primary, 0.12);
  border-color: rgba($primary, 0.35);
  color: $white;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
