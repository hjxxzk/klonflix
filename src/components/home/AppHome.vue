<script setup lang="ts">
import AppNavbarHome from '@/components/home/AppNavbarHome.vue'
import AppBanner from '@/components/home/AppBanner.vue'
</script>

<template>
  <div class="page">
    <AppNavbarHome />
    <main class="content">
      <AppBanner />
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    height: 100%;
    width: 13%;
    pointer-events: none;
    z-index: 1;
  }

  &::before {
    left: 0;
    background: linear-gradient(to right, $primary, rgba(0, 0, 0, 0));
  }

  &::after {
    right: 0;
    background: linear-gradient(to left, $primary, rgba(0, 0, 0, 0));
  }
}
</style>
