<script setup lang="ts">
import AppNavbarOverview from '@/components/overview/AppNavbarOverview.vue'
import Top4You from '@/components/overview/Top4You.vue'
import AppOverviewGrid from '@/components/overview/AppOverviewGrid.vue'
import AppBrandLogo from '@/components/home/AppBrandLogo.vue'
</script>
<template>
  <div class="page">
    <AppNavbarOverview />
    <main class="content">
      <section class="hero">
        <div class="hero-glow hero-glow-left" />
        <div class="hero-glow hero-glow-right" />
        <div class="hero-content">
          <span class="hero-eyebrow"> Twoja biblioteka rozrywki </span>
          <AppBrandLogo class="logo" />
          <p class="hero-description">
            Odkrywaj filmy i seriale dopasowane do Ciebie. Wybierz coś dobrego i rozpocznij
            oglądanie.
          </p>
          <a class="hero-action" href="#browse-section">
            Przeglądaj bibliotekę <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <div class="sections">
        <section class="section top-section">
          <header class="section-header">
            <div>
              <span class="section-eyebrow"> Wybrane dla Ciebie </span>
              <h2 class="section-title">Twoja topka</h2>
            </div>
            <span class="section-decoration" />
          </header>
          <Top4You />
        </section>
        <section id="browse-section" class="section browse-section">
          <header class="section-header">
            <div>
              <span class="section-eyebrow"> Cała kolekcja </span>
              <h2 class="section-title">Przeglądaj</h2>
            </div>
            <span class="section-decoration" />
          </header>
          <AppOverviewGrid />
        </section>
      </div>
    </main>
  </div>
</template>
<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.logo {
  margin: 20px 0 20px 0;
}

.page {
  min-height: 100vh;
  color: $white;
  font-family: $font-family;
  background:
    radial-gradient(circle at 75% 10%, rgba($primary, 0.1), transparent 32rem),
    radial-gradient(circle at 10% 45%, rgba($secondary, 0.07), transparent 34rem), $black;
}
.content {
  width: 100%;
  overflow: hidden;
}
.hero {
  position: relative;
  display: flex;
  min-height: 390px;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem 4rem;
  overflow: hidden;
  background: linear-gradient(180deg, rgba($accent, 0.72), rgba($black, 0.98));
  border-bottom: 1px solid rgba($primary, 0.12);
}
.hero::before {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background-image:
    linear-gradient(rgba($primary, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba($primary, 0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, black, transparent 85%);
}
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  width: min(100%, 760px);
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.hero-eyebrow,
.section-eyebrow {
  color: $primary;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}
.banner {
  width: min(100%, 470px);
  height: auto;
  margin: 1.25rem 0 1rem;
  filter: drop-shadow(0 18px 45px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 30px rgba($primary, 0.12));
}
.hero-description {
  max-width: 570px;
  margin: 0;
  color: rgba($white, 0.76);
  font-size: clamp(0.95rem, 2vw, 1.08rem);
  line-height: 1.7;
}
.hero-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  margin-top: 1.5rem;
  padding: 0.7rem 1.1rem;
  color: $primary;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.24);
  border-radius: 999px;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
  &:hover {
    color: $black;
    background: $primary;
    border-color: $primary;
    transform: translateY(-2px);
  }
  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 3px;
  }
}
.hero-glow {
  position: absolute;
  width: 320px;
  height: 320px;
  pointer-events: none;
  background: rgba($primary, 0.1);
  filter: blur(85px);
  border-radius: 50%;
}
.hero-glow-left {
  bottom: -180px;
  left: -80px;
}
.hero-glow-right {
  top: -200px;
  right: -60px;
}
.sections {
  width: min(100% - 3rem, 1450px);
  margin: 0 auto;
  padding: 1rem 0 4rem;
}
.section {
  width: 100%;
  padding-top: 3rem;
  scroll-margin-top: 6rem;
}
.section-header {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  margin-bottom: 1.4rem;
}
.section-title {
  margin: 0.3rem 0 0;
  color: #f4f7f5;
  font-size: clamp(1.55rem, 3vw, 2.2rem);
  font-weight: 750;
  letter-spacing: -0.04em;
}
.section-decoration {
  height: 1px;
  flex: 1;
  margin-bottom: 0.45rem;
  background: linear-gradient(90deg, rgba($primary, 0.55), transparent);
}
.browse-section {
  padding-top: 4rem;
}
@media (max-width: 720px) {
  .hero {
    min-height: 330px;
    padding: 3rem 1.25rem 4rem;
  }
  .banner {
    width: min(100%, 350px);
  }
  .sections {
    width: min(100% - 2rem, 1450px);
  }
  .section {
    padding-top: 2.5rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero-action {
    transition: none;
  }
  html {
    scroll-behavior: auto;
  }
}
</style>
