<script setup lang="ts">
import IconActionButton from '@/components/admin/IconActionButton.vue'
import type { ContentResponse } from '@/types/Content'
import { CONTENT_TYPE_LABELS } from '@/types/Content'

defineProps<{
  content: ContentResponse
  selected?: boolean
}>()

defineEmits<{
  edit: []
  delete: []
  select: []
}>()

function thumbnailSrc(content: ContentResponse): string | null {
  return content.thumbnailUrl?.trim() || null
}
</script>

<template>
  <article
    class="content-card"
    :class="{ 'content-card--selected': selected, 'content-card--series': content.type === 'SERIES' }"
  >
    <div class="content-card__media" @click="content.type === 'SERIES' ? $emit('select') : undefined">
      <img
        v-if="thumbnailSrc(content)"
        :src="content.thumbnailUrl"
        :alt="content.title"
        class="content-card__image"
        loading="lazy"
      />
      <div v-else class="content-card__placeholder">
        <span class="content-card__initial">{{ content.title.charAt(0).toUpperCase() }}</span>
      </div>

      <div class="content-card__overlay" />

      <div class="content-card__actions">
        <IconActionButton label="Edytuj treść" @click="$emit('edit')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </IconActionButton>

        <IconActionButton label="Usuń treść" variant="danger" @click="$emit('delete')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </IconActionButton>
      </div>

      <span class="content-card__type">{{ CONTENT_TYPE_LABELS[content.type] }}</span>
    </div>

    <div class="content-card__body">
      <h3 class="content-card__title" :title="content.title">{{ content.title }}</h3>
      <p class="content-card__meta">{{ content.releaseYear }}</p>

      <button
        v-if="content.type === 'SERIES'"
        type="button"
        class="content-card__manage"
        @click="$emit('select')"
      >
        {{ selected ? 'Zwiń sezony' : 'Zarządzaj sezonami' }}
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.content-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: rgba($accent, 0.55);
  border: 1px solid rgba($white, 0.08);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba($primary, 0.35);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  }

  &--selected {
    border-color: rgba($primary, 0.6);
    box-shadow: 0 0 0 1px rgba($primary, 0.25);
  }
}

.content-card__media {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  cursor: default;
}

.content-card--series .content-card__media {
  cursor: pointer;
}

.content-card__image,
.content-card__placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba($primary, 0.18), rgba($black, 0.85));
}

.content-card__initial {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgba($white, 0.45);
}

.content-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba($black, 0.75) 0%, transparent 45%);
  pointer-events: none;
}

.content-card__actions {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  display: flex;
  gap: 0.4rem;
  z-index: 2;
}

.content-card__type {
  position: absolute;
  left: 0.6rem;
  bottom: 0.6rem;
  z-index: 2;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba($black, 0.72);
  color: $primary;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.content-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.25rem;
  padding: 0.85rem 0.9rem 1rem;
  min-height: 5.5rem;
}

.content-card__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: $white;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-card__meta {
  margin: 0;
  font-size: 0.85rem;
  color: rgba($white, 0.55);
}

.content-card__manage {
  margin-top: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: $primary;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: $primary;
    filter: brightness(1.15);
  }
}
</style>
