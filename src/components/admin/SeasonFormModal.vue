<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { SeasonRequest, SeasonResponse } from '@/types/Content'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  season?: SeasonResponse | null
  seriesTitle?: string
}>()

const emit = defineEmits<{
  close: []
  save: [payload: SeasonRequest]
}>()

const form = reactive({
  number: 1,
  title: '',
})

function resetForm(): void {
  form.number = props.season?.number ?? 1
  form.title = props.season?.title ?? ''
}

function handleSubmit(): void {
  emit('save', {
    number: form.number,
    title: form.title.trim(),
  })
}

watch(
  () => [props.visible, props.season] as const,
  ([visible]) => {
    if (visible) {
      resetForm()
    }
  },
)
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true">
      <header class="modal-header">
        <h2 class="modal-title">
          {{ mode === 'create' ? 'Dodaj sezon' : 'Edytuj sezon' }}
          <span v-if="seriesTitle" class="modal-subtitle">— {{ seriesTitle }}</span>
        </h2>
        <button type="button" class="btn-close-custom" aria-label="Zamknij" @click="emit('close')">
          ×
        </button>
      </header>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label for="season-number" class="form-label">Numer sezonu</label>
          <input
            id="season-number"
            v-model.number="form.number"
            type="number"
            class="form-control"
            min="1"
            required
          />
        </div>

        <div class="mb-3">
          <label for="season-title" class="form-label">Tytuł sezonu</label>
          <input id="season-title" v-model="form.title" type="text" class="form-control" required />
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn btn-outline-primary" @click="emit('close')">Anuluj</button>
          <button type="submit" class="btn btn-primary">Zapisz</button>
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
  max-width: 480px;
  background: $black;
  border: 1px solid rgba($white, 0.15);
  border-radius: 8px;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  color: $white;
}

.modal-subtitle {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba($white, 0.7);
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
</style>
