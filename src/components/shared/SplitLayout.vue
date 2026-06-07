<script setup lang="ts"></script>

<template>
  <div class="split">
    <div class="panel left">
      <slot name="left" />
    </div>

    <div class="panel right">
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.split {
  width: 100%;
  height: 100%;
  display: flex;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
</style>
