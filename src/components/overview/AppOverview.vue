<script setup lang="ts">
import AppNavbarOverview from '@/components/overview/AppNavbarOverview.vue'
import Top4You from '@/components/overview/Top4You.vue'
import AppOverviewGrid from '@/components/overview/AppOverviewGrid.vue'
</script>

<template>
  <div class="page">
    <AppNavbarOverview />
    <main class="content">
      <img class="banner" src="../../resources/logo_clipped.PNG" alt="banner" />

      <section class="section">
        <h2 class="section-title first">Twoje TOP 10</h2>
        <Top4You />
      </section>

      <section class="section">
        <h2 class="section-title">Przeglądaj</h2>
        <AppOverviewGrid />
      </section>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.banner {
  width: 450px;
  height: auto;
  margin: 0 0 1.25rem 0;
}

.section {
  width: 100%;
  max-width: 1450px;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.section-title {
  width: 100%;
  margin: 0 0 0.5rem 0;
  padding: 0.25rem 0 1rem 0.75rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #00913f;
  font-size: 25px;
  font-weight: 700;
  color: $white;
}
</style>
