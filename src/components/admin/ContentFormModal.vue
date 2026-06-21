<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { ContentRequest, ContentResponse, ContentType, Genre } from '@/types/Content'
import { GENRES } from '@/types/Content'
import { fetchLibraryMetadata } from '@/api/browse'
import { useAuthStore } from '@/stores/auth.ts'
import { joinCommaSeparated, parseCommaSeparated } from '@/utils/form'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  content?: ContentResponse | null
  initialType?: ContentType
}>()

const emit = defineEmits<{
  close: []
  save: [payload: ContentRequest]
}>()

const auth = useAuthStore()
const isFormLoading = ref(false)

const form = reactive({
  type: 'MOVIE' as ContentType,
  title: '',
  description: '',
  thumbnailUrl: '',
  genre: 'DRAMA' as Genre,
  releaseYear: new Date().getFullYear(),
  keywords: '',
  durationSeconds: 0,
  videoUri: '',
  languages: '',
})

const isSeries = computed(() => form.type === 'SERIES')
const title = computed(() => {
  if (props.mode === 'create') {
    return form.type === 'MOVIE' ? 'Dodaj film' : 'Dodaj serial'
  }

  return form.type === 'MOVIE' ? 'Edytuj film' : 'Edytuj serial'
})

function extractKeywords(keywords: Array<{ value?: string; name?: string } | string> | undefined): string[] {
  if (!keywords?.length) {
    return []
  }

  return keywords
    .map((keyword) => {
      if (typeof keyword === 'string') {
        return keyword
      }

      return keyword.value ?? keyword.name ?? ''
    })
    .filter(Boolean)
}

function applyContentToForm(content: ContentResponse, keywords: string[]): void {
  form.type = content.type ?? props.initialType ?? 'MOVIE'
  form.title = content.title ?? ''
  form.description = content.description ?? ''
  form.thumbnailUrl = content.thumbnailUrl ?? ''
  form.genre = content.genre ?? 'DRAMA'
  form.releaseYear = content.releaseYear ?? new Date().getFullYear()
  form.keywords = joinCommaSeparated(keywords)
  form.durationSeconds = content.durationSeconds ?? 0
  form.videoUri = content.videoUri ?? ''
  form.languages = joinCommaSeparated(content.languages ?? [])
}

function resetCreateForm(): void {
  form.type = props.initialType ?? 'MOVIE'
  form.title = ''
  form.description = ''
  form.thumbnailUrl = ''
  form.genre = 'DRAMA'
  form.releaseYear = new Date().getFullYear()
  form.keywords = ''
  form.durationSeconds = 0
  form.videoUri = ''
  form.languages = ''
}

async function resetForm(): Promise<void> {
  if (props.mode === 'create') {
    resetCreateForm()
    return
  }

  const content = props.content
  if (!content) {
    return
  }

  applyContentToForm(content, [])

  const token = auth.user?.accessToken
  if (!token) {
    return
  }

  isFormLoading.value = true

  try {
    const metadata = await fetchLibraryMetadata(content.id, token)
    const keywords = extractKeywords(metadata?.keywords)
    applyContentToForm(content, keywords)
  } finally {
    isFormLoading.value = false
  }
}

function handleSubmit(): void {
  const payload: ContentRequest = {
    type: form.type,
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    genre: form.genre,
    releaseYear: form.releaseYear,
    keywords: parseCommaSeparated(form.keywords),
  }

  if (!isSeries.value) {
    payload.durationSeconds = form.durationSeconds
    payload.videoUri = form.videoUri.trim()
    payload.languages = parseCommaSeparated(form.languages)
  }

  emit('save', payload)
}

watch(
  () => [props.visible, props.content?.id, props.mode, props.initialType] as const,
  ([visible]) => {
    if (visible) {
      void resetForm()
    }
  },
)
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true">
      <header class="modal-header">
        <h2 class="modal-title">{{ title }}</h2>
        <button type="button" class="btn-close-custom" aria-label="Zamknij" @click="emit('close')">
          ×
        </button>
      </header>

      <div v-if="isFormLoading" class="form-status">Ładowanie danych treści...</div>

      <form v-show="!isFormLoading" class="modal-form" @submit.prevent="handleSubmit">
        <div v-if="mode === 'create'" class="mb-3">
          <label for="content-type" class="form-label">Typ treści</label>
          <select id="content-type" v-model="form.type" class="form-select">
            <option value="MOVIE">Film</option>
            <option value="SERIES">Serial</option>
          </select>
        </div>

        <div class="mb-3">
          <label for="content-title" class="form-label">Tytuł</label>
          <input id="content-title" v-model="form.title" type="text" class="form-control" required />
        </div>

        <div class="mb-3">
          <label for="content-description" class="form-label">Opis</label>
          <textarea
            id="content-description"
            v-model="form.description"
            class="form-control"
            rows="3"
          />
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <label for="content-genre" class="form-label">Gatunek</label>
            <select id="content-genre" v-model="form.genre" class="form-select" required>
              <option v-for="genre in GENRES" :key="genre.value" :value="genre.value">
                {{ genre.label }}
              </option>
            </select>
          </div>

          <div class="col-md-6">
            <label for="content-year" class="form-label">Rok premiery</label>
            <input
              id="content-year"
              v-model.number="form.releaseYear"
              type="number"
              class="form-control"
              min="1888"
              required
            />
          </div>
        </div>

        <div class="mb-3 mt-3">
          <label for="content-thumbnail" class="form-label">URL miniatury</label>
          <input
            id="content-thumbnail"
            v-model="form.thumbnailUrl"
            type="url"
            class="form-control"
          />
        </div>

        <div class="mb-3">
          <label for="content-keywords" class="form-label">Słowa kluczowe (po przecinku)</label>
          <input id="content-keywords" v-model="form.keywords" type="text" class="form-control" />
        </div>

        <template v-if="!isSeries">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="content-duration" class="form-label">Czas trwania (sekundy)</label>
              <input
                id="content-duration"
                v-model.number="form.durationSeconds"
                type="number"
                class="form-control"
                min="1"
                required
              />
            </div>

            <div class="col-md-6">
              <label for="content-languages" class="form-label">Języki (po przecinku)</label>
              <input id="content-languages" v-model="form.languages" type="text" class="form-control" />
            </div>
          </div>

          <div class="mb-3 mt-3">
            <label for="content-video-uri" class="form-label">Adres wideo</label>
            <input
              id="content-video-uri"
              v-model="form.videoUri"
              type="text"
              class="form-control"
              required
            />
          </div>
        </template>

        <p v-else class="series-hint">
          Sezony i odcinki serialu dodajesz osobno po utworzeniu treści.
        </p>

        <footer class="modal-footer">
          <button type="button" class="btn btn-outline-primary" @click="emit('close')">Anuluj</button>
          <button type="submit" class="btn btn-primary" :disabled="isFormLoading">Zapisz</button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.75);
}

.modal-panel {
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  background: $black;
  border: 1px solid rgba($white, 0.15);
  border-radius: 8px;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.35rem;
  color: $white;
}

.btn-close-custom {
  border: none;
  background: transparent;
  color: $white;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.series-hint {
  margin: 1rem 0 0;
  color: rgba($white, 0.75);
  font-size: 0.9rem;
}

.form-status {
  margin-bottom: 1rem;
  color: rgba($white, 0.65);
  font-size: 0.9rem;
}
</style>
