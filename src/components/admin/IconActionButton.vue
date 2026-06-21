<script setup lang="ts">
defineProps<{
  label: string
  variant?: 'default' | 'danger'
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="icon-action"
    :class="variant === 'danger' ? 'icon-action--danger' : 'icon-action--default'"
    :aria-label="label"
    @click.stop="$emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    transform: scale(1.06);
  }
}

.icon-action--default {
  background: rgba($black, 0.72);
  color: $white;

  &:hover {
    background: rgba($primary, 0.9);
    color: $black;
  }
}

.icon-action--danger {
  background: rgba($black, 0.72);
  color: $white;

  &:hover {
    background: rgba(#ef4444, 0.92);
    color: $white;
  }
}
</style>
