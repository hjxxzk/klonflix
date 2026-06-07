<script setup lang="ts">
import AppNavbar from '@/components/shared/AppNavbar.vue'
import { BButton } from 'bootstrap-vue-3'
</script>

<template>
  <AppNavbar>
    <template #left>
      <img src="../../resources/logo.png" alt="logo" width="40" height="40" />
    </template>

    <template #right>
      <div class="d-flex gap-3">
        <b-button class="primary" variant="outline-primary" href="/login">Zaloguj się</b-button>
        <b-button variant="primary" href="/register">Rejestracja</b-button>
      </div>
    </template>
  </AppNavbar>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

:deep(.btn-primary) {
  background-color: $primary;
  border-color: $primary;
  color: black;

  &:hover {
    background-color: $secondary;
    border-color: $secondary;
    color: black;
  }
}

:deep(.btn-outline-primary) {
  color: $primary;
  border-color: $primary;

  &:hover {
    background-color: $primary;
    border-color: $primary;
    color: black;
  }
}
</style>
