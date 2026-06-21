<script setup lang="ts">
import AppNavbar from '@/components/shared/AppNavbar.vue'
import { BButton } from 'bootstrap-vue-3'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.ts'
import AppBrandLogo from '@/components/home/AppBrandLogo.vue'

const router = useRouter()
const auth = useAuthStore()

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'Home' })
}
</script>

<template>
  <AppNavbar>
    <template #left>
      <AppBrandLogo :compact="true" :showSubtitle="false" />
    </template>

    <template #right>
      <b-button variant="outline-primary" @click="handleLogout">Wyloguj się</b-button>
    </template>
  </AppNavbar>
</template>

<style>
@use '@/styles/variables.scss' as *;
</style>
