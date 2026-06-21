<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import placeholder from '@/resources/logo.png'
import { ContentType } from '@/types/LibraryContent.ts'

const props = defineProps<{
  rank: number
  thumbnail?: string
  id: string | number
  name?: string
  contentType?: ContentType
}>()

const router = useRouter()
const isLoading = ref(true)
const currentSrc = ref(placeholder)
let imageRequest = 0

const desiredSrc = computed(() => {
  return props.thumbnail?.trim() || placeholder
})

const typeLabel = computed(() => {
  switch (props.contentType) {
    case ContentType.MOVIE:
      return 'Film'
    case ContentType.SERIES:
      return 'Serial'
    default:
      return null
  }
})

function loadImage(source: string) {
  const request = ++imageRequest
  isLoading.value = true
  const image = new Image()
  image.onload = () => {
    if (request !== imageRequest) {
      return
    }
    currentSrc.value = source
    isLoading.value = false
  }
  image.onerror = () => {
    if (request !== imageRequest) {
      return
    }
    currentSrc.value = placeholder
    isLoading.value = false
  }
  image.src = source
}

function goToBrowse() {
  switch (props.contentType) {
    case ContentType.MOVIE:
      void router.push(`/browse/movie/${props.id}`)
      break
    case ContentType.SERIES:
      void router.push(`/browse/series/${props.id}`)
      break
  }
}

watch(
  desiredSrc,
  (source) => {
    loadImage(source)
  },
  { immediate: true },
)
</script>
<template>
  <button
    class="top-item"
    type="button"
    :aria-label="`Otwórz ${props.name || `pozycję ${props.rank}`}`"
    @click="goToBrowse"
  >
    <span class="rank" aria-hidden="true"> {{ props.rank }} </span>
    <span class="thumb-wrap">
      <img
        class="thumb"
        :src="currentSrc"
        :alt="props.name || `Pozycja ${props.rank}`"
        loading="lazy"
        draggable="false"
        :aria-busy="isLoading"
      />
      <span class="thumb-shade" />
      <span v-if="typeLabel" class="type-badge"> {{ typeLabel }} </span>
      <span v-if="isLoading" class="spinner" aria-hidden="true" />
      <span v-else class="play-button" aria-hidden="true"> ▶ </span>
      <span class="item-caption">
        <strong> {{ props.name || 'Bez tytułu' }} </strong>
        <small> Pozycja nr {{ props.rank }} </small>
      </span>
    </span>
  </button>
</template>
<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
.top-item {
  position: relative;
  display: grid;
  width: 100%;
  grid-template-columns: 78px minmax(0, 1fr);
  align-items: end;
  padding: 0;
  color: $white;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  &:focus-visible {
    outline: 3px solid rgba($primary, 0.32);
    outline-offset: 4px;
    border-radius: 14px;
  }
}
.rank {
  position: relative;
  z-index: 3;
  margin-right: -14px;
  color: transparent;
  font-size: clamp(5rem, 8vw, 7rem);
  font-weight: 900;
  line-height: 0.8;
  letter-spacing: -0.1em;
  text-align: right;
  -webkit-text-stroke: 2px rgba($white, 0.48);
  filter: drop-shadow(5px 8px 10px rgba(0, 0, 0, 0.6));
  transition:
    color 180ms ease,
    -webkit-text-stroke-color 180ms ease,
    transform 180ms ease;
}
.thumb-wrap {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: $accent;
  border: 1px solid rgba($white, 0.08);
  border-radius: 14px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.32);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}
.thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    filter 260ms ease,
    transform 260ms ease;
}
.thumb-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 35%, rgba($black, 0.92));
}
.type-badge {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  padding: 0.27rem 0.5rem;
  color: $primary;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  background: rgba($black, 0.72);
  border: 1px solid rgba($primary, 0.25);
  border-radius: 999px;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}
.item-caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.15rem;
  padding: 1.8rem 0.8rem 0.75rem;
  strong {
    overflow: hidden;
    color: #fff;
    font-size: 0.82rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    color: rgba($white, 0.52);
    font-size: 0.62rem;
  }
}
.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  padding-left: 3px;
  color: $black;
  font-size: 0.78rem;
  background: $primary;
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba($primary, 0.25);
  opacity: 0;
  transform: translate(-50%, -40%) scale(0.8);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.spinner {
  position: absolute;
  top: calc(50% - 15px);
  left: calc(50% - 15px);
  width: 30px;
  height: 30px;
  border: 3px solid rgba($white, 0.15);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 750ms linear infinite;
}
.top-item:hover {
  .thumb-wrap {
    border-color: rgba($primary, 0.45);
    box-shadow:
      0 22px 42px rgba(0, 0, 0, 0.45),
      0 0 24px rgba($primary, 0.08);
    transform: translateY(-5px);
  }
  .thumb {
    filter: brightness(0.68);
    transform: scale(1.05);
  }
  .play-button {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  .rank {
    color: rgba($primary, 0.08);
    -webkit-text-stroke-color: $primary;
    transform: translateX(-3px);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 720px) {
  .top-item {
    grid-template-columns: 64px minmax(0, 1fr);
  }
  .rank {
    margin-right: -10px;
    font-size: 4.8rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rank,
  .thumb-wrap,
  .thumb,
  .play-button,
  .spinner {
    transition: none;
    animation: none;
  }
}
</style>
