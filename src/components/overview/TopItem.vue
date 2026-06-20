<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import placeholder from '@/resources/logo.png'

const props = defineProps<{
  rank: number
  thumbnail?: string
  id: string | number
  name?: string
}>()

const router = useRouter()

const isLoading = ref(true)
const hasError = ref(false)
const currentSrc = ref<string>(placeholder)

const desiredSrc = computed(() =>
  props.thumbnail && props.thumbnail.length > 0 ? props.thumbnail : placeholder
)

function loadImage(src: string) {
  isLoading.value = true
  hasError.value = false
  const img = new Image()
  img.src = src
  img.onload = () => {
    currentSrc.value = src
    isLoading.value = false
    hasError.value = false
  }
  img.onerror = () => {
    currentSrc.value = placeholder
    isLoading.value = false
    hasError.value = true
  }
}

watch(desiredSrc, (v) => {
  loadImage(v)
})

onMounted(() => {
  loadImage(desiredSrc.value)
})

function goToBrowse() {
  if (props.id === undefined || props.id === null) return
  router.push(`/browse/${props.id}`)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    goToBrowse()
  }
}
</script>

<template>
  <div
    class="top-item"
    role="button"
    tabindex="0"
    @click="goToBrowse"
    @keydown="onKeydown"
    :aria-label="`Open item ${props.rank}`"
    :title="props.name || ''"
  >
    <div class="rank">{{ props.rank }}</div>
    <div class="thumb-wrap">
      <img
        class="thumb"
        :src="currentSrc"
        :alt="`thumbnail for item ${props.rank}`"
        loading="lazy"
        draggable="false"
        :aria-busy="isLoading"
      />
      <div v-if="isLoading" class="spinner" aria-hidden="true"></div>
    </div>
    <div v-if="props.name" class="tooltip" role="tooltip">{{ props.name }}</div>
  </div>
</template>

<style scoped lang="scss">
.top-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: transform 160ms ease;
  padding: 6px;
  color: #fff;

  &:hover {
    transform: translateY(-2px);
  }

  &:focus {
    outline: 2px solid rgba(255, 255, 255, 0.12);
    outline-offset: 2px;
  }
}

.tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%) translateY(6px);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
  z-index: 30;
}

.top-item:hover .tooltip,
.top-item:focus .tooltip,
.top-item:focus-within .tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

.rank {
  font-weight: 800;
  color: #e6e6e6;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
  text-align: right;
  min-width: 44px;
  font-size: clamp(18px, 3.2vw, 44px);
  line-height: 1;
}

.thumb {
  width: 156px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
  transition:
    transform 200ms ease,
    box-shadow 200ms ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.thumb-wrap {
  position: relative;
  display: inline-block;
}

.spinner {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.12);
  border-top-color: rgba(255, 255, 255, 0.7);
  animation: spin 800ms linear infinite;
  pointer-events: none;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.top-item:hover .thumb {
  transform: scale(1.04);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}

@media (max-width: 480px) {
  .thumb {
    height: 60px;
  }

  .rank {
    font-size: clamp(14px, 4vw, 22px);
    min-width: 36px;
  }
}
</style>
