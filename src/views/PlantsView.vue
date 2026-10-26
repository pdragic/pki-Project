<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlantsStore } from '@/stores/plants'
import { averageRating } from '@/data/reviews'

const route = useRoute()
const store = usePlantsStore()
onMounted(() => store.load())

const f = reactive({
  name: String(route.query.q ?? ''),
  description: '',
  category: String(route.query.category ?? ''),
  climate: '',
  season: '',
  plantType: '',
  audience: '',
  dateFrom: '',
  dateTo: '',
  priceMin: null as number | null,
  priceMax: null as number | null,
  minRating: 0,
})

function reset() {
  Object.assign(f, {
    name: '', description: '', category: '', climate: '', season: '', plantType: '',
    audience: '', dateFrom: '', dateTo: '', priceMin: null, priceMax: null, minRating: 0,
  })
}

const filtered = computed(() =>
  store.plants.filter(p => {
    const has = (text: string, q: string) => text.toLowerCase().includes(q.trim().toLowerCase())
    if (f.name && !has(p.name + ' ' + p.latin_name, f.name)) return false
    if (f.description &&
      !has(`${p.description} ${p.planting_instructions} ${p.care_instructions}`, f.description)) return false
    if (f.category && p.category !== f.category) return false
    if (f.climate && p.climate !== f.climate) return false
    if (f.season && p.season !== f.season) return false
    if (f.plantType && p.plant_type !== f.plantType) return false
    if (f.audience && p.target_audience !== f.audience) return false
    if (f.dateFrom && p.production_date < f.dateFrom) return false
    if (f.dateTo && p.production_date > f.dateTo) return false
    if (f.priceMin !== null && p.price < f.priceMin) return false
    if (f.priceMax !== null && p.price > f.priceMax) return false
    if (f.minRating && averageRating(p.id) < f.minRating) return false
    return true
  }),
)
</script>

<template>
  <main class="page">
    <h1>Biljke</h1>

    <form class="filters" @submit.prevent>
      <label>Naziv <input v-model="f.name" placeholder="npr. Monstera" /></label>
      <label>Opis / sadnja / nega <input v-model="f.description" placeholder="npr. saksija" /></label>

      <label>Kategorija
        <select v-model="f.category">
          <option value="">Sve</option>
          <option v-for="v in store.unique('category')" :key="v">{{ v }}</option>
        </select>
      </label>
      <label>Podneblje
        <select v-model="f.climate">
          <option value="">Sva</option>
          <option v-for="v in store.unique('climate')" :key="v">{{ v }}</option>
        </select>
      </label>
      <label>Sezona
        <select v-model="f.season">
          <option value="">Sve</option>
          <option v-for="v in store.unique('season')" :key="v">{{ v }}</option>
        </select>
      </label>
      <label>Vrsta
        <select v-model="f.plantType">
          <option value="">Sve</option>
          <option v-for="v in store.unique('plant_type')" :key="v">{{ v }}</option>
        </select>
      </label>
      <label>Ciljna grupa
        <select v-model="f.audience">
          <option value="">Sve</option>
          <option v-for="v in store.unique('target_audience')" :key="v">{{ v }}</option>
        </select>
      </label>

      <label>Proizvedeno od <input v-model="f.dateFrom" type="date" /></label>
      <label>Proizvedeno do <input v-model="f.dateTo" type="date" /></label>
      <label>Cena od <input v-model.number="f.priceMin" type="number" min="0" /></label>
      <label>Cena do <input v-model.number="f.priceMax" type="number" min="0" /></label>
      <label>Minimalna ocena
        <select v-model.number="f.minRating">
          <option :value="0">Bilo koja</option>
          <option :value="3">3+ ★</option>
          <option :value="4">4+ ★</option>
          <option :value="5">5 ★</option>
        </select>
      </label>

      <button type="button" class="btn btn-outline-secondary" @click="reset">
        <i class="fa-solid fa-rotate-left"></i> Poništi filtere
      </button>
    </form>

    <p v-if="store.loading">Učitavanje...</p>
    <p v-else-if="store.error" role="alert">{{ store.error }}</p>
    <template v-else>
      <p>Pronađeno: {{ filtered.length }}</p>
      <p v-if="!filtered.length">Nema biljaka koje odgovaraju zadatim kriterijumima.</p>
      <div class="plant-grid">
        <RouterLink v-for="p in filtered" :key="p.id" :to="`/plants/${p.id}`" class="plant-card">
          <div class="plant-img"><img :src="p.image_url" :alt="p.image_alt" /></div>
          <div class="plant-body">
            <h3>{{ p.name }}</h3>
            <span class="muted small">
              <i class="fa-solid fa-tag"></i> {{ p.category }} ·
              <i class="fa-solid fa-earth-europe"></i> {{ p.climate }}
            </span>
            <div class="d-flex justify-content-between">
              <span class="price">{{ p.price }} {{ p.currency }}</span>
              <span class="stars"><i class="fa-solid fa-star"></i> {{ averageRating(p.id).toFixed(1) }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: .75rem;
  margin-bottom: 1rem;
}

.filters label {
  display: flex;
  flex-direction: column;
  font-size: .9rem;
  gap: .25rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.card {
  display: block;
  padding: .75rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
}

.card img {
  width: 100%;
  height: 140px;
  object-fit: contain;
}
</style>