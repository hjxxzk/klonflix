<script setup lang="ts">
import AppNavbarOverview from '@/components/overview/AppNavbarOverview.vue'
</script>

<template>
  <div class="page">
    <AppNavbarOverview />
    <main class="content">
      <h1>tu jestem</h1>
    </main>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
</style>
