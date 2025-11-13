<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
