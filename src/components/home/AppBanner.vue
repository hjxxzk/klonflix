<script setup lang="ts">
import { BButton } from 'bootstrap-vue-3'
import { useRouter } from 'vue-router'
import AppBrandLogo from '@/components/home/AppBrandLogo.vue'

const router = useRouter()

function goToRegister() {
  void router.push({ name: 'Register' })
}
</script>

<template>
  <section class="banner">
    <div class="background-grid" aria-hidden="true" />
    <div class="glow glow-left" aria-hidden="true" />
    <div class="glow glow-right" aria-hidden="true" />

    <div class="banner-content">
      <span class="eyebrow"> Filmy i seriale bez ograniczeń </span>

      <AppBrandLogo class="logo" />

      <h1>
        Magia kina na Twoim ekranie.
        <span>Za darmo.</span>
      </h1>

      <p class="description">
        Odkrywaj filmy i seriale, twórz własną watchlistę i oglądaj ulubione historie w jednym
        miejscu.
      </p>

      <div class="actions">
        <BButton class="register-button" variant="primary" size="lg" @click="goToRegister">
          <span>Rozpocznij za darmo</span>
          <span class="arrow" aria-hidden="true">→</span>
        </BButton>

        <RouterLink class="login-link" :to="{ name: 'Login' }"> Mam już konto </RouterLink>
      </div>

      <div class="benefits">
        <span>
          <span class="check" aria-hidden="true">✓</span>
          Bez opłat
        </span>

        <span>
          <span class="check" aria-hidden="true">✓</span>
          Szybka rejestracja
        </span>

        <span>
          <span class="check" aria-hidden="true">✓</span>
          Filmy i seriale
        </span>
      </div>
    </div>

    <div class="scroll-indicator" aria-hidden="true">
      <span />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.banner {
  position: relative;
  display: flex;
  width: 100%;
  min-height: calc(100vh - 70px);
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem 6rem;
  overflow: hidden;
  color: $white;
  font-family: $font-family;
  background:
    radial-gradient(circle at 50% 20%, rgba($primary, 0.11), transparent 26rem),
    linear-gradient(180deg, rgba($accent, 0.94), $black 82%);
  isolation: isolate;
}

.banner::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 180px;
  z-index: -1;
  content: '';
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, $black);
}

.background-grid {
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background-image:
    linear-gradient(rgba($primary, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba($primary, 0.025) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at center, black, transparent 75%);
}

.banner-content {
  position: relative;
  z-index: 2;
  display: flex;
  width: min(100%, 850px);
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 24px;
  padding: 0.45rem 0.8rem;
  color: $primary;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 999px;
  text-transform: uppercase;

  &::before {
    width: 6px;
    height: 6px;
    content: '';
    background: $primary;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba($primary, 0.8);
  }
}

.logo {
  margin-bottom: 28px;
}

h1 {
  max-width: 760px;
  margin: 0;
  color: #f8faf9;
  font-size: clamp(2.15rem, 5vw, 4.4rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.055em;

  span {
    color: $primary;
    text-shadow: 0 0 35px rgba($primary, 0.22);
  }
}

.description {
  max-width: 620px;
  margin: 1.4rem 0 0;
  color: rgba($white, 0.74);
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  line-height: 1.75;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

:deep(.register-button) {
  display: inline-flex;
  min-width: 215px;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.85rem 1.4rem;
  color: $black;
  font-family: $font-family;
  font-size: 1rem;
  font-weight: 800;
  background: $primary;
  border-color: $primary;
  border-radius: 12px;
  box-shadow:
    0 14px 36px rgba($primary, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover,
  &:focus {
    color: $black;
    background: $secondary;
    border-color: $secondary;
    box-shadow:
      0 18px 42px rgba($primary, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    transform: translateY(-3px);
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 4px;
  }
}

.arrow {
  font-size: 1.2rem;
  transition: transform 160ms ease;
}

:deep(.register-button:hover) .arrow {
  transform: translateX(4px);
}

.login-link {
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.25rem;
  color: $primary;
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  background: rgba($primary, 0.025);
  border: 1px solid rgba($primary, 0.34);
  border-radius: 12px;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;

  &:hover {
    color: $black;
    background: $primary;
    border-color: $primary;
    transform: translateY(-3px);
  }

  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 4px;
  }
}

.benefits {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 1.5rem;
  margin-top: 2rem;
  color: rgba($white, 0.62);
  font-size: 0.78rem;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
}

.check {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-size: 0.68rem;
  font-weight: 900;
  background: rgba($primary, 0.08);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 50%;
}

.glow {
  position: absolute;
  z-index: -1;
  width: 400px;
  height: 400px;
  pointer-events: none;
  background: rgba($primary, 0.1);
  filter: blur(100px);
  border-radius: 50%;
}

.glow-left {
  bottom: -230px;
  left: -130px;
}

.glow-right {
  top: -230px;
  right: -130px;
}

.scroll-indicator {
  position: absolute;
  bottom: 1.75rem;
  left: 50%;
  display: flex;
  width: 24px;
  height: 38px;
  justify-content: center;
  padding-top: 7px;
  border: 1px solid rgba($white, 0.2);
  border-radius: 999px;
  transform: translateX(-50%);

  span {
    width: 4px;
    height: 8px;
    background: $primary;
    border-radius: 999px;
    animation: scroll-indicator 1.7s ease-in-out infinite;
  }
}

@keyframes scroll-indicator {
  0% {
    opacity: 0;
    transform: translateY(0);
  }

  35% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(13px);
  }
}

@media (max-width: 720px) {
  .banner {
    min-height: calc(100vh - 60px);
    padding: 3rem 1.25rem 5rem;
  }

  .logo {
    width: min(100%, 360px);
    margin-top: 1.5rem;
  }

  h1 {
    font-size: clamp(2rem, 11vw, 3.2rem);
  }

  .actions {
    width: 100%;
    flex-direction: column;
  }

  :deep(.register-button),
  .login-link {
    width: min(100%, 330px);
  }

  .benefits {
    max-width: 330px;
  }

  .scroll-indicator {
    display: none;
  }
}

@media (max-width: 420px) {
  .eyebrow {
    font-size: 0.59rem;
    letter-spacing: 0.12em;
  }

  .description {
    font-size: 0.9rem;
  }

  .benefits {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-indicator span {
    animation: none;
  }

  :deep(.register-button),
  .login-link,
  .arrow {
    transition: none;
  }
}
</style>
