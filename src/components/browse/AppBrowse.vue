<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { fetchLibraryMetadata, type Metadata } from '@/api/browse'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const id = ref<string | null>(null)
const metadata = ref<Metadata | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function getAccessToken(): string | undefined {
  const token = auth.user?.accessToken
  if (token) return token

  const raw = localStorage.getItem('user')
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as { accessToken?: string }
    return parsed?.accessToken
  } catch {
    return undefined
  }
}

async function fetchMetadataFor(idVal: string) {
  loading.value = true
  error.value = null
  metadata.value = null
  const token = getAccessToken()
  try {
    metadata.value = await fetchLibraryMetadata(idVal, token)
  } catch (e: unknown) {
    if (e instanceof Error) error.value = e.message
    else error.value = 'Nieznany błąd podczas pobierania metadanych.'
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  const p = route.params.id
  if (!p) return
  const idStr = Array.isArray(p) ? (p[0] ?? '') : String(p)
  if (!idStr) return
  if (idStr !== id.value) {
    id.value = idStr
    fetchMetadataFor(idStr)
  }
})
</script>

<template>
  <div class="app-browse">
    <h2>Browse / Library</h2>
    <div v-if="loading">Ładowanie metadanych...</div>
    <div v-else-if="error" class="error">Błąd: {{ error }}</div>
    <div v-else-if="metadata">
      <h3>Metadata (id: {{ id }})</h3>
      <pre>{{ JSON.stringify(metadata, null, 2) }}</pre>
    </div>
    <div v-else>Brak danych do wyświetlenia.</div>
  </div>
</template>

<style scoped lang="scss">
.app-browse {
  padding: 1rem;
}
.error {
  color: #c00;
}
pre {
  background: #f7f7f7;
  padding: 0.5rem;
  overflow: auto;
}
</style>
