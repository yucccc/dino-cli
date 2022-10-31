<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<script lang="ts">
export default {
  name: 'ButtonSfc',
}
</script>

<template>
  <button>sfc  {{ msg }} - {{ count }}</button>
</template>

<style scoped>
  button {
    border: 1px solid;
  }
</style>
