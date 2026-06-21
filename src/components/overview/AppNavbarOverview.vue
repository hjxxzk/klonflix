<script setup lang="ts">
import { computed, ref } from 'vue'
import { BButton } from 'bootstrap-vue-3'
import { useRouter } from 'vue-router'
import AppNavbar from '@/components/shared/AppNavbar.vue'
import AppBrandLogo from '@/components/home/AppBrandLogo.vue'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const auth = useAuthStore()
const searchPhrase = ref('')
const canSearch = computed(() => {
  return searchPhrase.value.trim().length > 0
})
async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'Home' })
}
function handleSearch() {
  const phrase = searchPhrase.value.trim()
  if (!phrase) {
    return
  }
  void router.push({ path: '/search', query: { phrase } })
}
</script>
<template>
  <AppNavbar>
    <template #left>
      <div class="navbar-left">
        <RouterLink class="brand-link" to="/overview" aria-label="Przejdź do strony głównej">
          <AppBrandLogo compact :show-subtitle="false" />
        </RouterLink>
        <nav class="navbar-tabs" aria-label="Główna nawigacja">
          <RouterLink class="navbar-tab" to="/overview">
            <span aria-hidden="true">Strona główna</span>
          </RouterLink>
          <RouterLink class="navbar-tab" to="/watchlist">
            <span aria-hidden="true">Watchlista</span>
          </RouterLink>
        </nav>
      </div>
    </template>
    <template #right>
      <div class="navbar-right">
        <form class="search-form" role="search" @submit.prevent="handleSearch">
          <label class="visually-hidden" for="library-search"> Wyszukaj film lub serial </label>
          <div class="search-field">
            <span class="search-icon" aria-hidden="true"> ⌕ </span>
            <input
              id="library-search"
              v-model="searchPhrase"
              class="search-input"
              type="search"
              name="phrase"
              placeholder="Wyszukaj film lub serial..."
              autocomplete="off"
            />
            <button
              v-if="searchPhrase"
              type="button"
              class="clear-search"
              aria-label="Wyczyść wyszukiwanie"
              @click="searchPhrase = ''"
            >
              ×
            </button>
          </div>
          <BButton class="search-button" variant="primary" type="submit" :disabled="!canSearch">
            Szukaj
          </BButton>
        </form>
        <span class="navbar-divider" aria-hidden="true" />
        <BButton
          class="logout-button"
          variant="outline-primary"
          type="button"
          @click="handleLogout"
        >
          Wyloguj się
        </BButton>
      </div>
    </template>
  </AppNavbar>
</template>
<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
}
.navbar-left {
  min-width: 0;
  gap: clamp(1rem, 3vw, 2.5rem);
}
.navbar-right {
  justify-content: flex-end;
  gap: 1rem;
}
.brand-link {
  display: inline-flex;
  flex: 0 0 auto;
  color: inherit;
  text-decoration: none;
  border-radius: 14px;
  &:focus-visible {
    outline: 3px solid rgba($primary, 0.3);
    outline-offset: 4px;
  }
}
.navbar-tabs {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.navbar-tab {
  position: relative;
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  color: rgba($white, 0.7);
  font-size: 0.86rem;
  font-weight: 650;
  text-decoration: none;
  border-radius: 9px;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
  &::after {
    position: absolute;
    right: 0.9rem;
    bottom: 3px;
    left: 0.9rem;
    height: 2px;
    content: '';
    background: $primary;
    border-radius: 999px;
    opacity: 0;
    transform: scaleX(0.3);
    transition:
      opacity 160ms ease,
      transform 160ms ease;
  }
  &:hover {
    color: #fff;
    background: rgba($primary, 0.06);
  }
  &:focus-visible {
    outline: 2px solid rgba($primary, 0.35);
    outline-offset: 2px;
  }
  &.router-link-active {
    color: $primary;
    background: rgba($primary, 0.08);
    &::after {
      opacity: 1;
      transform: scaleX(1);
    }
  }
}
.search-form {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.search-field {
  position: relative;
  display: flex;
  width: clamp(210px, 24vw, 360px);
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 0.85rem;
  z-index: 1;
  color: rgba($white, 0.46);
  font-size: 1.15rem;
  pointer-events: none;
}
.search-input {
  width: 100%;
  min-height: 42px;
  padding: 0.65rem 2.5rem 0.65rem 2.55rem;
  color: #f5f7f6;
  font-family: $font-family;
  font-size: 0.84rem;
  background: linear-gradient(135deg, rgba($accent, 0.9), rgba($black, 0.85));
  border: 1px solid rgba($white, 0.09);
  border-radius: 10px;
  outline: none;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
  &::placeholder {
    color: rgba($white, 0.42);
  }
  &:hover {
    border-color: rgba($primary, 0.24);
  }
  &:focus {
    background: rgba($accent, 0.95);
    border-color: rgba($primary, 0.62);
    box-shadow:
      0 0 0 3px rgba($primary, 0.1),
      0 8px 24px rgba(0, 0, 0, 0.22);
  }
  &::-webkit-search-cancel-button {
    display: none;
  }
}
.clear-search {
  position: absolute;
  right: 0.65rem;
  display: flex;
  width: 25px;
  height: 25px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: rgba($white, 0.58);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
  &:hover {
    color: $primary;
    background: rgba($primary, 0.08);
  }
  &:focus-visible {
    outline: 2px solid rgba($primary, 0.35);
  }
}
:deep(.search-button) {
  min-height: 42px;
  padding-right: 1rem;
  padding-left: 1rem;
  color: $black;
  font-family: $font-family;
  font-size: 0.82rem;
  font-weight: 750;
  background: $primary;
  border-color: $primary;
  border-radius: 9px;
  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    color: $black;
    background: $secondary;
    border-color: $secondary;
  }
  &:disabled {
    color: rgba($black, 0.65);
    background: rgba($primary, 0.42);
    border-color: transparent;
  }
}
.navbar-divider {
  width: 1px;
  height: 30px;
  background: linear-gradient(to bottom, transparent, rgba($white, 0.2), transparent);
}
:deep(.logout-button) {
  min-height: 42px;
  padding-right: 1rem;
  padding-left: 1rem;
  color: $primary;
  font-family: $font-family;
  font-size: 0.82rem;
  font-weight: 700;
  background: transparent;
  border-color: rgba($primary, 0.55);
  border-radius: 9px;
  &:hover,
  &:focus {
    color: $black;
    background: $primary;
    border-color: $primary;
  }
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
}
@media (max-width: 1100px) {
  .navbar-left {
    gap: 1rem;
  }
  .navbar-tab {
    padding-right: 0.65rem;
    padding-left: 0.65rem;
    .tab-icon {
      display: none;
    }
  }
  .search-field {
    width: clamp(180px, 21vw, 280px);
  }
}
@media (max-width: 850px) {
  .navbar-left,
  .navbar-right {
    width: 100%;
  }
  .navbar-left {
    justify-content: space-between;
  }
  .navbar-right {
    margin-top: 0.75rem;
  }
  .search-form {
    min-width: 0;
    flex: 1;
  }
  .search-field {
    width: auto;
    flex: 1;
  }
}
@media (max-width: 620px) {
  .navbar-left {
    align-items: flex-start;
    flex-direction: column;
  }
  .navbar-tabs {
    width: 100%;
  }
  .navbar-tab {
    flex: 1;
    justify-content: center;
  }
  .navbar-right {
    align-items: stretch;
    flex-direction: column;
  }
  .search-form {
    width: 100%;
  }
  :deep(.search-button) {
    flex: 0 0 auto;
  }
  .navbar-divider {
    display: none;
  }
  :deep(.logout-button) {
    width: 100%;
  }
}
@media (max-width: 420px) {
  .search-form {
    align-items: stretch;
    flex-direction: column;
  }
  :deep(.search-button) {
    width: 100%;
  }
}
</style>
