<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getLibraryPage, type LibraryItem } from '@/api/library'

type Item = LibraryItem

const auth = useAuthStore()

const items = ref<Item[]>([])
const total = ref(0)

const router = useRouter()

const pageSize = ref(20)
const currentPage = ref(1)
const isLoading = ref(false)
const error = ref<string | null>(null)

let controller: AbortController | null = null

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const pages = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))

const pagedItems = computed(() => items.value)

function goToBrowse(id?: string | number) {
  if (id === undefined || id === null) return
  router.push(`/browse/${id}`)
}

function setPage(n: number) {
  if (n < 1) n = 1
  if (n > totalPages.value) n = totalPages.value
  currentPage.value = n
  const el = document.querySelector('.overview-grid')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function prevPage() {
  setPage(currentPage.value - 1)
}

function nextPage() {
  setPage(currentPage.value + 1)
}

async function loadPage() {
  // cancel previous
  if (!auth.user?.accessToken) {
    items.value = []
    total.value = 0
    return
  }

  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal

  isLoading.value = true
  error.value = null

  try {
    const resp = await getLibraryPage(
      auth.user.accessToken,
      currentPage.value,
      pageSize.value,
      signal
    )
    items.value = resp.items
    total.value = resp.total
  } catch (err: any) {
    if (err.name === 'AbortError') return
    error.value = err.message || String(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPage()
})

watch([currentPage, pageSize, () => auth.user?.accessToken], () => {
  loadPage()
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <div class="overview-grid">
    <div class="grid">
      <div v-if="isLoading" class="grid-loader">Ładowanie...</div>
      <div v-if="error" class="grid-error">{{ error }}</div>
      <button
        v-for="item in pagedItems"
        :key="item.id"
        class="card"
        type="button"
        @click="goToBrowse(item.id)"
        @keydown.enter.prevent="goToBrowse(item.id)"
        @keydown.space.prevent="goToBrowse(item.id)"
        :aria-label="`Open ${item.title || 'item'}`"
      >
        <span class="thumb-wrap">
          <img
            :src="item.thumbnail || ''"
            :alt="item.title || 'thumbnail'"
            loading="lazy"
            draggable="false"
          />
          <span class="overlay">
            <span class="title">{{ item.title }}</span>
          </span>
        </span>
      </button>
    </div>

    <div class="pagination" v-if="pages.length > 1">
      <button
        class="page-btn"
        @click="prevPage"
        :disabled="currentPage === 1"
        aria-label="Poprzednia strona"
      >
        ‹
      </button>

      <button
        v-for="p in pages"
        :key="p"
        class="page-number"
        :aria-current="p === currentPage ? 'page' : undefined"
        :class="{ active: p === currentPage }"
        @click="setPage(p)"
      >
        {{ p }}
      </button>

      <button
        class="page-btn"
        @click="nextPage"
        :disabled="currentPage === pages.length"
        aria-label="Następna strona"
      >
        ›
      </button>
    </div>

    <div class="no-items" v-if="items.length === 0">Brak pozycji do wyświetlenia.</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.overview-grid {
  width: 100%;
  max-width: 1450px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  width: 100%;
}

.grid-loader,
.grid-error {
  grid-column: 1 / -1;
  text-align: center;
  color: $white;
  padding: 12px 0;
}

.grid-error {
  color: #ffb3b3;
}

.card {
  background: transparent;
  cursor: pointer;
  user-select: none;
  border-radius: 8px;
  overflow: hidden;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
  outline: none;
  border: 0;
}

.card:focus {
  transform: translateY(-4px);
  outline: 2px solid rgba(255, 255, 255, 0.12);
}

.card:hover {
  transform: translateY(-4px);
}

.thumb-wrap {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16/9;
  background: rgba(0, 0, 0, 0.06);
}

.thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 10px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.6) 100%);
  opacity: 0;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
  pointer-events: none;
}

.card:hover .overlay,
.card:focus .overlay,
.card:focus-within .overlay {
  opacity: 1;
  pointer-events: auto;
}

.title {
  color: $white;
  font-weight: 700;
  text-align: center;
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  flex-wrap: wrap;
}

.page-btn,
.page-number {
  background: transparent;
  color: $white;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.page-number.active {
  background: rgba(255, 255, 255, 0.06);
  font-weight: 700;
}

.page-btn[disabled] {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}

.no-items {
  text-align: center;
  color: $white;
  padding: 18px 0;
}

@media (max-width: 720px) {
  .grid {
    gap: 8px;
  }

  .title {
    font-size: 13px;
  }
}
</style>
