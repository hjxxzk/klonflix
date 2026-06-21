<script setup lang="ts">
import AppNavbar from '@/components/shared/AppNavbar.vue'
import { BButton } from 'bootstrap-vue-3'
import { useRouter } from 'vue-router'
import AppBrandLogo from '@/components/home/AppBrandLogo.vue'

const router = useRouter()
</script>

<template>
  <AppNavbar>
    <template #left>
      <AppBrandLogo :compact="true" :showSubtitle="false" />
    </template>

    <template #right>
      <div class="d-flex gap-3">
        <b-button class="primary" variant="outline-primary" @click="router.push({ name: 'Login' })"
          >Zaloguj się</b-button
        >
        <b-button variant="primary" @click="router.push({ name: 'Register' })"
          >Rejestracja</b-button
        >
      </div>
    </template>
  </AppNavbar>
</template>

<style lang="scss" scoped></style>
