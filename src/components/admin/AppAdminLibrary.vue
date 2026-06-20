<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BButton } from 'bootstrap-vue-3'
import AppNavbarAdmin from '@/components/admin/AppNavbarAdmin.vue'
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
import { CONTENT_TYPE_LABELS, GENRES } from '@/types/Content'

const auth = useAuthStore()

const contents = ref<ContentResponse[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
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

function genreLabel(genre: string): string {
  return GENRES.find((item) => item.value === genre)?.label ?? genre
}

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
  } catch (error) {
    handleApiFailure(error, 'Nie udało się pobrać biblioteki treści.')
  } finally {
    isLoading.value = false
  }
}

function goToPage(page: number): void {
  currentPage.value = page
  void loadLibrary()
}

function toggleSeries(contentId: string): void {
  expandedSeriesId.value = expandedSeriesId.value === contentId ? null : contentId
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
          <div>
            <p class="admin-label">Panel administratora</p>
            <h1 class="admin-title">Zarządzanie biblioteką treści</h1>
          </div>

          <div class="admin-actions">
            <b-button variant="primary" @click="openCreateContent('MOVIE')">Dodaj film</b-button>
            <b-button variant="outline-primary" @click="openCreateContent('SERIES')">
              Dodaj serial
            </b-button>
          </div>
        </header>

        <div v-if="apiError" class="alert alert-danger" role="alert">{{ apiError }}</div>
        <div v-if="successMessage" class="alert alert-success" role="alert">
          {{ successMessage }}
        </div>

        <div v-if="isLoading" class="status-message">Ładowanie biblioteki...</div>

        <div v-else class="library-table-wrapper">
          <table class="table library-table">
            <thead>
              <tr>
                <th>Tytuł</th>
                <th>Typ</th>
                <th>Gatunek</th>
                <th>Rok</th>
                <th class="actions-col">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="content in contents" :key="content.id">
                <tr>
                  <td>
                    <button
                      v-if="content.type === 'SERIES'"
                      type="button"
                      class="series-toggle"
                      @click="toggleSeries(content.id)"
                    >
                      {{ expandedSeriesId === content.id ? '▼' : '▶' }}
                    </button>
                    {{ content.title }}
                  </td>
                  <td>{{ CONTENT_TYPE_LABELS[content.type] }}</td>
                  <td>{{ genreLabel(content.genre) }}</td>
                  <td>{{ content.releaseYear }}</td>
                  <td class="actions-col">
                    <div class="row-actions">
                      <b-button size="sm" variant="outline-primary" @click="openEditContent(content)">
                        Edytuj
                      </b-button>
                      <b-button
                        size="sm"
                        variant="outline-primary"
                        @click="handleDeleteContent(content)"
                      >
                        Usuń
                      </b-button>
                    </div>
                  </td>
                </tr>

                <tr v-if="content.type === 'SERIES' && expandedSeriesId === content.id">
                  <td colspan="5" class="series-details">
                    <div class="series-panel">
                      <div class="series-panel-header">
                        <h3>Sezony serialu</h3>
                        <b-button size="sm" variant="primary" @click="openCreateSeason(content)">
                          Dodaj sezon
                        </b-button>
                      </div>

                      <p v-if="content.seasons.length === 0" class="empty-message">
                        Brak sezonów. Dodaj pierwszy sezon, aby móc dodawać odcinki.
                      </p>

                      <div
                        v-for="season in content.seasons"
                        :key="season.id"
                        class="season-block"
                      >
                        <div class="season-header">
                          <h4>Sezon {{ season.number }} — {{ season.title }}</h4>
                          <div class="row-actions">
                            <b-button
                              size="sm"
                              variant="outline-primary"
                              @click="openEditSeason(content, season)"
                            >
                              Edytuj sezon
                            </b-button>
                            <b-button
                              size="sm"
                              variant="primary"
                              @click="openCreateEpisode(content, season)"
                            >
                              Dodaj odcinek
                            </b-button>
                          </div>
                        </div>

                        <table v-if="season.episodes.length > 0" class="table nested-table">
                          <thead>
                            <tr>
                              <th>Nr</th>
                              <th>Tytuł</th>
                              <th>Czas (s)</th>
                              <th class="actions-col">Akcje</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="episode in season.episodes" :key="episode.id">
                              <td>{{ episode.number }}</td>
                              <td>{{ episode.title }}</td>
                              <td>{{ episode.durationSeconds }}</td>
                              <td class="actions-col">
                                <b-button
                                  size="sm"
                                  variant="outline-primary"
                                  @click="openEditEpisode(content, season, episode)"
                                >
                                  Edytuj
                                </b-button>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p v-else class="empty-message">Brak odcinków w tym sezonie.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="contents.length === 0">
                <td colspan="5" class="empty-message">Biblioteka jest pusta.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="pagination-bar">
          <span class="pagination-info">
            Strona {{ currentPage }} · {{ itemCount }} pozycji na stronie
          </span>
          <div class="pagination-actions">
            <b-button
              variant="outline-primary"
              :disabled="!hasPreviousPage || isLoading"
              @click="goToPage(currentPage - 1)"
            >
              Poprzednia
            </b-button>
            <b-button
              variant="outline-primary"
              :disabled="!hasNextPage || isLoading"
              @click="goToPage(currentPage + 1)"
            >
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
  padding: 2rem 1.5rem 3rem;
}

.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.admin-label {
  margin: 0 0 0.25rem;
  color: $primary;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-title {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  color: $white;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.status-message,
.empty-message {
  color: rgba($white, 0.75);
}

.library-table-wrapper {
  overflow-x: auto;
  border: 1px solid rgba($white, 0.12);
  border-radius: 8px;
}

.library-table,
.nested-table {
  margin-bottom: 0;
  color: $white;

  th,
  td {
    vertical-align: middle;
    border-color: rgba($white, 0.1);
  }

  thead th {
    color: rgba($white, 0.85);
    font-weight: 600;
    background: $accent;
  }
}

.actions-col {
  width: 1%;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.series-toggle {
  margin-right: 0.5rem;
  border: none;
  background: transparent;
  color: $primary;
  cursor: pointer;
}

.series-details {
  background: rgba($accent, 0.65);
}

.series-panel {
  padding: 1rem;
}

.series-panel-header,
.season-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.series-panel-header h3,
.season-header h4 {
  margin: 0;
  color: $white;
}

.season-block {
  padding: 1rem 0;
  border-top: 1px solid rgba($white, 0.08);

  &:first-of-type {
    border-top: none;
    padding-top: 0;
  }
}

.nested-table {
  background: rgba($black, 0.35);
  border-radius: 6px;
}

.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-info {
  color: rgba($white, 0.75);
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
</style>
