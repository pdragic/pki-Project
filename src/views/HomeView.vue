<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlantsStore } from '@/stores/plants'
import { averageRating } from '@/data/reviews'

const router = useRouter()
const store = usePlantsStore()
const query = ref('')

onMounted(() => store.load())

const featured = computed(() => store.plants.slice(0, 4))

const categoryIcons: Record<string, string> = {
  'Sobne biljke': 'fa-house-chimney-window',
  'Baštenske biljke': 'fa-tree',
  'Rezano cveće': 'fa-spa',
}
const iconFor = (c: string) => categoryIcons[c] ?? 'fa-seedling'

function search() {
  router.push({ path: '/plants', query: { q: query.value.trim() } })
}
</script>

<template>
  <main class="page">
    <section class="hero">
      <i class="fa-solid fa-leaf hero-icon"></i>
      <h1>Dobrodošli u biljkaru</h1>
      <p>Pronađite i rezervišite biljke za dom i baštu.</p>
      <form class="search" @submit.prevent="search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input v-model="query" type="search" placeholder="Pretraži biljke po nazivu..." aria-label="Pretraga biljaka" />
        <button type="submit">Pretraži</button>
      </form>
    </section>

    <section class="block">
      <h2><i class="fa-solid fa-layer-group"></i> Kategorije</h2>
      <div class="chips">
        <RouterLink
          v-for="c in store.categories" :key="c"
          :to="{ path: '/plants', query: { category: c } }"
          class="btn btn-outline-success rounded-pill"
        >
          <i class="fa-solid" :class="iconFor(c)"></i> {{ c }}
        </RouterLink>
      </div>
    </section>

    <section class="block">
      <h2><i class="fa-solid fa-star"></i> Izdvajamo za vas</h2>
      <p v-if="store.loading" class="muted"><i class="fa-solid fa-spinner fa-spin"></i> Učitavanje...</p>
      <p v-else-if="store.error" class="text-danger">
        <i class="fa-solid fa-triangle-exclamation"></i> {{ store.error }}
      </p>
      <div v-else class="plant-grid">
        <RouterLink v-for="p in featured" :key="p.id" :to="`/plants/${p.id}`" class="plant-card">
          <div class="plant-img"><img :src="p.image_url" :alt="p.image_alt" /></div>
          <div class="plant-body">
            <h3>{{ p.name }}</h3>
            <span class="muted small"><i class="fa-solid fa-tag"></i> {{ p.category }}</span>
            <div class="d-flex justify-content-between">
              <span class="price">{{ p.price }} {{ p.currency }}</span>
              <span class="stars"><i class="fa-solid fa-star"></i> {{ averageRating(p.id).toFixed(1) }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
      <RouterLink to="/plants" class="btn btn-success mt-3">
        Pogledaj sve biljke <i class="fa-solid fa-arrow-right"></i>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 2.5rem 1rem;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%);
  box-shadow: 0 6px 24px rgba(0, 0, 0, .35);
}
.hero-icon { font-size: 2.5rem; opacity: .9; }
.hero h1 { margin: .5rem 0 .25rem; }
.hero p { opacity: .9; }

.search {
  display: flex;
  align-items: center;
  gap: .5rem;
  max-width: 520px;
  margin: 1.25rem auto 0;
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  border-radius: 999px;
  padding: .3rem .3rem .3rem 1rem;
}
.search input { flex: 1; background: transparent; color: inherit; border: 0; outline: 0; }
.search button { border: 0; border-radius: 999px; padding: .45rem 1.1rem; background: #2e7d32; color: #fff; cursor: pointer; }

.block { margin-top: 2rem; }
.block h2 { font-size: 1.3rem; margin-bottom: 1rem; }
.block h2 i { color: var(--leaf-light); margin-right: .35rem; }
.chips { display: flex; flex-wrap: wrap; gap: .5rem; }
</style>