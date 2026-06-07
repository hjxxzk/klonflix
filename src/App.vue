<script setup lang="ts"></script>
<template>
  <router-view />
</template>

<style lang="scss">
@use '@/styles/variables.scss' as *;
* {
  font-family: $font-family;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

body {
  color: $white;
  background: $black;
}
</style>
