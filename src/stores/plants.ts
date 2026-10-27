import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PlantApi, type Plant } from '@/services/plantApi'
import { showLoading, hideLoading, confirmDialog } from '@/utils/alert'

export const usePlantsStore = defineStore('plants', () => {
  const plants = ref<Plant[]>([])
  const loading = ref(false)
  const error = ref('')

  async function load(force = false) {
    if (loading.value) return
    if (plants.value.length && !force) return

    loading.value = true
    error.value = ''
    const token = showLoading()

    try {
      plants.value = await PlantApi.getAll()
      await hideLoading(token)
    } catch {
      await hideLoading(token, 0)
      error.value = 'Biljke trenutno nije moguće učitati. Pokušajte ponovo.'

      const retry = await confirmDialog({
        title: 'Učitavanje nije uspelo',
        text: 'Biljke trenutno nije moguće učitati. Proverite internet vezu.',
        confirmText: 'Pokušaj ponovo',
        icon: 'error',
      })
      loading.value = false
      if (retry) await load(true)
      return
    } finally {
      loading.value = false
    }
  }

  function getById(id: number) {
    return plants.value.find(p => p.id === id)
  }

  function unique(key: 'category' | 'climate' | 'season' | 'plant_type' | 'target_audience') {
    return [...new Set(plants.value.map(p => p[key]))].sort()
  }

  const categories = computed(() => unique('category'))

  return { plants, loading, error, load, getById, unique, categories }
})