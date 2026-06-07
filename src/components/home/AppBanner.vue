<script setup lang="ts">
import { BButton } from 'bootstrap-vue-3'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="banner">
    <img src="../../resources/logo_clipped.PNG" alt="banner" />
    <h1>Magia kina na Twoim ekranie. Za darmo.</h1>
    <b-button
      class="primary"
      @click="router.push({ name: 'Register' })"
      variant="primary"
      size="lg"
      href="/register"
      >Rozpocznij</b-button
    >
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.banner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2rem 1rem;
}

.banner img {
  max-width: 45%;
  width: 100%;
  height: auto;
}
</style>
