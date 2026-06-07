<script setup lang="ts">
import AppNavbar from '@/components/shared/AppNavbar.vue'
import { BButton } from 'bootstrap-vue-3'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <AppNavbar>
    <template #left>
      <img src="../../resources/logo.png" alt="logo" width="40" height="40" />
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
