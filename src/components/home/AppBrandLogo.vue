<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
    showSubtitle?: boolean
  }>(),
  {
    compact: false,
    showSubtitle: true,
  }
)
</script>

<template>
  <div
    class="brand"
    :class="{ compact }"
    role="img"
    aria-label="Klonflix — filmy pełnometrażowe z YouTube"
  >
    <div class="brand-icon" aria-hidden="true">
      <span class="letter-k">
        <span class="k-stem" />
        <span class="k-arm k-arm-top" />
        <span class="k-arm k-arm-bottom" />
      </span>
    </div>

    <div class="brand-content">
      <span class="brand-name" v-if="showSubtitle">klonflix</span>

      <span v-if="showSubtitle" class="brand-subtitle"> Filmy pełnometrażowe z YouTube </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.brand {
  --icon-size: 104px;
  --brand-font-size: 5.3rem;

  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: clamp(1.25rem, 3vw, 2rem);
  color: $primary;
  font-family: $font-family;
}

.brand-icon {
  position: relative;
  display: flex;
  width: var(--icon-size);
  height: var(--icon-size);
  flex: 0 0 var(--icon-size);
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(circle at 50% 35%, rgba($primary, 0.13), rgba($black, 0.98) 70%);
  border: 1.5px solid $primary;
  border-radius: 24%;
  box-shadow:
    0 0 0 1px rgba($primary, 0.07),
    0 0 18px rgba($primary, 0.3),
    inset 0 0 24px rgba($primary, 0.07);
}

.brand-icon::before {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), transparent 38%);
}

.brand-icon::after {
  position: absolute;
  right: 12%;
  bottom: 5%;
  left: 12%;
  height: 10%;
  content: '';
  pointer-events: none;
  background: rgba($primary, 0.3);
  filter: blur(12px);
  border-radius: 50%;
}

.letter-k {
  position: relative;
  display: block;
  width: 55%;
  height: 58%;
  filter: drop-shadow(0 0 7px rgba($primary, 0.35));
}

.k-stem {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6%;
  width: 25%;
  background: linear-gradient(180deg, lighten($primary, 4%), $primary);
  border-radius: 2px;
}

.k-arm {
  position: absolute;
  left: 26%;
  width: 68%;
  height: 24%;
  background: linear-gradient(90deg, $primary, lighten($primary, 5%));
  border-radius: 2px;
  transform-origin: left center;
}

.k-arm-top {
  top: 43%;
  transform: rotate(-43deg);
}

.k-arm-bottom {
  top: 46%;
  transform: rotate(43deg);
}

.brand-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.brand-name {
  color: $primary;
  font-size: var(--brand-font-size);
  font-weight: 800;
  line-height: 0.86;
  letter-spacing: -0.065em;
  text-shadow: 0 0 22px rgba($primary, 0.12);
  white-space: nowrap;
}

.brand-subtitle {
  margin-top: 1rem;
  padding-left: 0.35rem;
  color: rgba($white, 0.82);
  font-size: clamp(0.55rem, 1.15vw, 0.72rem);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: clamp(0.22em, 0.8vw, 0.52em);
  text-transform: uppercase;
  white-space: nowrap;
}

.brand.compact {
  --icon-size: 46px;
  --brand-font-size: 2.3rem;

  gap: 0.8rem;

  .brand-icon {
    border-radius: 16px;
  }

  .brand-subtitle {
    margin-top: 0.4rem;
    font-size: 0.42rem;
    letter-spacing: 0.26em;
  }
}

@media (hover: hover) {
  .brand-icon {
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease;
  }

  .letter-k {
    transition: transform 180ms ease;
  }

  .brand:hover {
    .brand-icon {
      box-shadow:
        0 0 0 1px rgba($primary, 0.12),
        0 0 30px rgba($primary, 0.42),
        inset 0 0 28px rgba($primary, 0.1);
      transform: translateY(-2px);
    }

    .letter-k {
      transform: scale(1.04);
    }
  }
}

@media (max-width: 720px) {
  .brand:not(.compact) {
    --icon-size: 72px;
    --brand-font-size: clamp(2.8rem, 12vw, 4.3rem);

    gap: 1rem;
  }

  .brand-subtitle {
    margin-top: 0.7rem;
    letter-spacing: 0.2em;
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .brand:not(.compact) {
    --icon-size: 56px;
    --brand-font-size: clamp(2.25rem, 11vw, 3.1rem);
  }

  .brand-subtitle {
    max-width: 220px;
    margin-top: 0.5rem;
    font-size: 0.43rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-icon,
  .letter-k {
    transition: none;
  }
}
</style>
