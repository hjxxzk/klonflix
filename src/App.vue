<script setup lang="ts"></script>
<template>
  <router-view />
</template>

<style lang="scss">
@use '@/styles/variables.scss' as *;
* {
  font-family: $font-family;
}

body {
  color: $white;
  background: $black;
}
</style>
