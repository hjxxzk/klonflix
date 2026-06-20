<script setup lang="ts"></script>

<template>
  <nav class="navbar">
    <div class="panel left">
      <slot name="left" />
    </div>

    <div class="panel right">
      <slot name="right" />
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  height: 70px;
  padding: 0 15px;
  display: flex;
  justify-content: space-between;
}

.panel {
  display: flex;
  align-items: center;
  gap: 2rem;
}
</style>
