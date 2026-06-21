<script setup lang="ts">
import { BButton } from 'bootstrap-vue-3'
import IconActionButton from '@/components/admin/IconActionButton.vue'
import type { ContentResponse, EpisodeResponse, SeasonResponse } from '@/types/Content'

defineProps<{
  series: ContentResponse
}>()

defineEmits<{
  addSeason: []
  editSeason: [season: SeasonResponse]
  addEpisode: [season: SeasonResponse]
  editEpisode: [season: SeasonResponse, episode: EpisodeResponse]
  close: []
}>()
</script>

<template>
  <section class="series-panel">
    <header class="series-panel__header">
      <div>
        <p class="series-panel__label">Serial</p>
        <h2 class="series-panel__title">{{ series.title }}</h2>
        <p class="series-panel__subtitle">
          {{ series.seasons.length }}
          {{ series.seasons.length === 1 ? 'sezon' : 'sezonów' }}
        </p>
      </div>

      <div class="series-panel__header-actions">
        <b-button size="sm" variant="primary" @click="$emit('addSeason')">Dodaj sezon</b-button>
        <button type="button" class="series-panel__close" aria-label="Zwiń panel" @click="$emit('close')">
          ×
        </button>
      </div>
    </header>

    <p v-if="series.seasons.length === 0" class="series-panel__empty">
      Brak sezonów. Dodaj pierwszy sezon, aby móc dodawać odcinki.
    </p>

    <div v-else class="season-list">
      <article v-for="season in series.seasons" :key="season.id" class="season-card">
        <div class="season-card__header">
          <div>
            <span class="season-card__number">Sezon {{ season.number }}</span>
            <h3 class="season-card__title">{{ season.title }}</h3>
          </div>

          <div class="season-card__actions">
            <IconActionButton label="Edytuj sezon" @click="$emit('editSeason', season)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </IconActionButton>
            <b-button size="sm" variant="outline-primary" @click="$emit('addEpisode', season)">
              + Odcinek
            </b-button>
          </div>
        </div>

        <ul v-if="season.episodes.length > 0" class="episode-list">
          <li v-for="episode in season.episodes" :key="episode.id" class="episode-item">
            <div class="episode-item__info">
              <span class="episode-item__number">{{ episode.number }}</span>
              <div>
                <p class="episode-item__title">{{ episode.title }}</p>
                <p class="episode-item__meta">{{ episode.durationSeconds }} s</p>
              </div>
            </div>

            <IconActionButton
              label="Edytuj odcinek"
              @click="$emit('editEpisode', season, episode)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </IconActionButton>
          </li>
        </ul>

        <p v-else class="season-card__empty">Brak odcinków w tym sezonie.</p>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.series-panel {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: linear-gradient(160deg, rgba($accent, 0.95), rgba($black, 0.92));
  border: 1px solid rgba($primary, 0.2);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}

.series-panel__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.series-panel__label {
  margin: 0 0 0.2rem;
  color: $primary;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.series-panel__title {
  margin: 0;
  font-size: 1.35rem;
  color: $white;
}

.series-panel__subtitle {
  margin: 0.35rem 0 0;
  color: rgba($white, 0.55);
  font-size: 0.9rem;
}

.series-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.series-panel__close {
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba($white, 0.15);
  border-radius: 999px;
  background: transparent;
  color: $white;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    border-color: rgba($primary, 0.5);
    color: $primary;
  }
}

.series-panel__empty,
.season-card__empty {
  margin: 0;
  color: rgba($white, 0.6);
  font-size: 0.9rem;
}

.season-list {
  display: grid;
  gap: 1rem;
}

.season-card {
  padding: 1rem 1.1rem;
  border-radius: 12px;
  background: rgba($black, 0.35);
  border: 1px solid rgba($white, 0.08);
}

.season-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.season-card__number {
  display: inline-block;
  margin-bottom: 0.2rem;
  color: $primary;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.season-card__title {
  margin: 0;
  font-size: 1rem;
  color: $white;
}

.season-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.episode-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.episode-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  background: rgba($white, 0.03);
  border: 1px solid rgba($white, 0.06);
}

.episode-item__info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.episode-item__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: rgba($primary, 0.15);
  color: $primary;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.episode-item__title {
  margin: 0;
  font-size: 0.9rem;
  color: $white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.episode-item__meta {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: rgba($white, 0.45);
}
</style>
