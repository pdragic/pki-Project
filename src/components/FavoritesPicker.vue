<script setup lang="ts">
defineProps<{ options: string[] }>()
const model = defineModel<string[]>({ required: true })

function toggle(v: string) {
  model.value = model.value.includes(v)
    ? model.value.filter(x => x !== v)
    : [...model.value, v]
}
</script>

<template>
  <div class="fav-chips" role="group" aria-label="Omiljene vrste biljaka">
    <p v-if="!options.length" class="muted small mb-0">
      <i class="fa-solid fa-spinner fa-spin"></i> Učitavanje vrsta...
    </p>
    <button
      v-for="o in options" :key="o" type="button"
      class="btn btn-sm rounded-pill"
      :class="model.includes(o) ? 'btn-success' : 'btn-outline-success'"
      :aria-pressed="model.includes(o)"
      @click="toggle(o)"
    >
      <i :class="[model.includes(o) ? 'fa-solid' : 'fa-regular', 'fa-heart']"></i> {{ o }}
    </button>
  </div>
</template>