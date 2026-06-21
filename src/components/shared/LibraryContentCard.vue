<script setup lang="ts">
import type { LibraryItem } from '@/types/LibraryContent'
import { ContentType } from '@/types/LibraryContent'
import placeholder from '@/resources/logo.png'

defineProps<{
  item: LibraryItem
  removable?: boolean
  removing?: boolean
}>()

const emit = defineEmits<{
  open: []
  remove: []
}>()

function contentTypeLabel(contentType?: ContentType): string {
  switch (contentType) {
    case ContentType.MOVIE:
      return 'Film'
    case ContentType.SERIES:
      return 'Serial'
    default:
      return 'Materiał'
  }
}

function handleImageError(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  if (image.src !== placeholder) {
    image.src = placeholder
  }
}
</script>

<template>
  <article class="library-card">
    <button
      class="library-card__open"
      type="button"
      :aria-label="`Otwórz ${item.title || 'wybraną pozycję'}`"
      @click="emit('open')"
    >
      <span class="thumb-wrap">
        <img
          :src="item.thumbnailUrl || placeholder"
          :alt="item.title || 'Miniatura'"
          loading="lazy"
          draggable="false"
          @error="handleImageError"
        />
        <span class="image-shade" />
        <span v-if="item.contentType" class="content-badge">
          {{ contentTypeLabel(item.contentType) }}
        </span>
        <span v-if="item.available === false" class="unavailable-badge">Niedostępny</span>
        <span class="play-indicator" aria-hidden="true">▶</span>
      </span>

      <span class="card-content">
        <strong class="title">{{ item.title || 'Bez tytułu' }}</strong>
        <span class="card-meta">
          <span v-if="item.genre">{{ item.genre }}</span>
          <span v-if="item.genre && item.releaseYear" class="meta-dot" />
          <span v-if="item.releaseYear">{{ item.releaseYear }}</span>
        </span>
      </span>
    </button>

    <button
      v-if="removable"
      type="button"
      class="library-card__remove"
      :disabled="removing"
      :aria-label="`Usuń ${item.title || 'pozycję'} z watchlisty`"
      @click="emit('remove')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    </button>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.library-card {
  position: relative;
  min-width: 0;
}

.library-card__open {
  width: 100%;
  padding: 0;
  overflow: hidden;
  color: $white;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(145deg, rgba($accent, 0.9), rgba($black, 0.95));
  border: 1px solid rgba($white, 0.07);
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    border-color: rgba($primary, 0.42);
    box-shadow:
      0 20px 38px rgba(0, 0, 0, 0.34),
      0 0 0 1px rgba($primary, 0.06);
    transform: translateY(-6px);
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.35);
    outline-offset: 3px;
  }
}

.library-card__remove {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  z-index: 3;
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: $white;
  cursor: pointer;
  background: rgba($black, 0.72);
  border: none;
  border-radius: 999px;
  backdrop-filter: blur(6px);
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover:not(:disabled) {
    background: rgba(#ef4444, 0.92);
    transform: scale(1.06);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
}

.thumb-wrap {
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
      transform 350ms ease,
      filter 350ms ease;
  }
}

.library-card__open:hover .thumb-wrap img {
  filter: brightness(0.72);
  transform: scale(1.06);
}

.image-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba($black, 0.04), rgba($black, 0.7));
  opacity: 0.45;
  transition: opacity 180ms ease;
}

.library-card__open:hover .image-shade {
  opacity: 0.85;
}

.content-badge,
.unavailable-badge {
  position: absolute;
  top: 0.7rem;
  padding: 0.3rem 0.55rem;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  border-radius: 999px;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.content-badge {
  left: 0.7rem;
  color: $primary;
  background: rgba($black, 0.72);
  border: 1px solid rgba($primary, 0.3);
}

.unavailable-badge {
  right: 0.7rem;
  color: #ffb0b0;
  background: rgba(90, 0, 0, 0.7);
  border: 1px solid rgba(255, 90, 90, 0.3);
}

.play-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 50px;
  height: 50px;
  align-items: center;
  justify-content: center;
  padding-left: 3px;
  color: $black;
  font-size: 0.9rem;
  background: $primary;
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba($primary, 0.25);
  opacity: 0;
  transform: translate(-50%, -40%) scale(0.8);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.library-card__open:hover .play-indicator,
.library-card__open:focus-visible .play-indicator {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.card-content {
  display: block;
  padding: 0.9rem 1rem 1rem;
}

.title {
  display: block;
  overflow: hidden;
  color: #f5f7f6;
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  min-height: 1rem;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.45rem;
  overflow: hidden;
  color: rgba($white, 0.56);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-dot {
  width: 3px;
  height: 3px;
  flex: 0 0 auto;
  background: $primary;
  border-radius: 50%;
}

@media (max-width: 720px) {
  .card-content {
    padding: 0.75rem;
  }

  .title {
    font-size: 0.82rem;
  }

  .card-meta {
    font-size: 0.66rem;
  }

  .content-badge,
  .unavailable-badge {
    top: 0.5rem;
    padding: 0.23rem 0.4rem;
    font-size: 0.54rem;
  }

  .content-badge {
    left: 0.5rem;
  }

  .play-indicator {
    width: 42px;
    height: 42px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .library-card__open,
  .library-card__remove,
  .thumb-wrap img,
  .play-indicator {
    transition: none;
  }
}
</style>
