<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlantsStore } from '@/stores/plants'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useReviewsStore } from '@/stores/reviews'
import { confirmDialog, toast } from '@/utils/alert'

const route = useRoute()
const router = useRouter()
const store = usePlantsStore()
const cart = useCartStore()
const auth = useAuthStore()
const rv = useReviewsStore()
const message = ref('')

onMounted(() => store.load())

const plant = computed(() => store.getById(Number(route.params.id)))
const reviewList = computed(() => (plant.value ? rv.forPlant(plant.value.id) : []))
const average = computed(() => (plant.value ? rv.average(plant.value.id) : 0))

const specs = computed(() => {
  const p = plant.value
  if (!p) return []
  return [
    { icon: 'fa-seedling', label: 'Vrsta', value: p.plant_type },
    { icon: 'fa-tag', label: 'Kategorija', value: p.category },
    { icon: 'fa-earth-europe', label: 'Podneblje', value: p.climate },
    { icon: 'fa-calendar-days', label: 'Sezona', value: p.season },
    { icon: 'fa-users', label: 'Ciljna grupa', value: p.target_audience },
    { icon: 'fa-sun', label: 'Svetlost', value: p.light_requirement },
    { icon: 'fa-droplet', label: 'Zalivanje', value: p.watering },
    { icon: 'fa-house-chimney', label: 'Namena', value: p.intended_use },
    { icon: 'fa-industry', label: 'Datum proizvodnje', value: p.production_date },
    {
      icon: 'fa-boxes-stacked',
      label: 'Na stanju / slobodno za rezervaciju',
      value: `${p.stock_quantity} / ${cart.maxFor(p.id, p.stock_quantity)}`,
    },
  ]
})

async function reserve() {
  if (!plant.value) return
  const p = plant.value

  if (!auth.isLoggedIn) {
    const go = await confirmDialog({
      title: 'Prijava je potrebna',
      text: 'Da biste rezervisali biljku, potrebno je da se prijavite.',
      confirmText: 'Prijavi se',
      icon: 'info',
    })
    if (go) router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  // slobodno za rezervaciju = stanje minus već pristiglo
  const free = cart.maxFor(p.id, p.stock_quantity)
  if (free < 1) {
    toast('Nema više slobodnih komada ove biljke za rezervaciju.', 'warning')
    return
  }

  // biljka je već aktivno rezervisana: pitaj da li da se poveća količina
  const active = cart.getActive(p.id)
  if (active) {
    if (active.quantity >= free) {
      toast(`Najveća moguća količina za rezervaciju je ${free}.`, 'warning')
      return
    }

    const ok = await confirmDialog({
      title: 'Biljka je već rezervisana',
      text: `"${p.name}" je već u vašoj korpi (količina: ${active.quantity}). ` +
        `Da li želite da povećate količinu na ${active.quantity + 1}?`,
      confirmText: 'Povećaj količinu',
      icon: 'question',
    })
    if (!ok) return

    if (cart.setQuantity(active.id, active.quantity + 1)) {
      message.value = `Količina biljke "${p.name}" u korpi je povećana na ${active.quantity}.`
      toast('Količina je povećana.')
    }
    return
  }

  const rezervisanaRanije = cart.items.some(i => i.plantId === p.id)

  cart.add({
    plantId: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.image_url,
    quantity: 1,
    stock: p.stock_quantity,
    status: 'rezervisano',
  })

  message.value = rezervisanaRanije
    ? `Biljka "${p.name}" je ponovo rezervisana i dodata u korpu rezervacija.`
    : `Biljka "${p.name}" je rezervisana i dodata u korpu rezervacija.`
  toast('Biljka je rezervisana i dodata u korpu.')
}
</script>

<template>
  <main class="page detail-page">
    <p v-if="store.loading" class="muted"><i class="fa-solid fa-spinner fa-spin"></i> Učitavanje...</p>
    <p v-else-if="store.error" role="alert" class="text-danger">{{ store.error }}</p>
    <p v-else-if="!plant">
      Biljka nije pronađena. <RouterLink to="/plants">Nazad na listu</RouterLink>
    </p>

    <div v-else>
      <RouterLink to="/plants" class="muted text-decoration-none">
        <i class="fa-solid fa-arrow-left"></i> Nazad na biljke
      </RouterLink>

      <div class="layout">
        <div class="img-box"><img :src="plant.image_url" :alt="plant.image_alt" /></div>
        <div>
          <h1>{{ plant.name }}</h1>
          <p class="muted fst-italic">{{ plant.latin_name }}</p>
          <p class="stars">
            <i v-for="n in 5" :key="n"
              :class="[n <= Math.round(average) ? 'fa-solid' : 'fa-regular', 'fa-star']"></i>
            <span class="muted"> {{ average.toFixed(1) }} ({{ reviewList.length }} recenzija)</span>
          </p>
          <p>{{ plant.description }}</p>
          <p class="price">{{ plant.price }} {{ plant.currency }}</p>

          <button class="btn btn-success btn-lg"
            :disabled="!plant.is_available || cart.maxFor(plant.id, plant.stock_quantity) < 1" @click="reserve">
            <i class="fa-solid fa-cart-plus"></i>
            {{ plant.is_available && cart.maxFor(plant.id, plant.stock_quantity) > 0
              ? 'Rezerviši' : 'Trenutno nedostupno' }}
          </button>

          <div v-if="message" role="status"
            class="alert alert-success mt-3 d-flex justify-content-between align-items-center">
            <span><i class="fa-solid fa-circle-check"></i> {{ message }}</span>
            <RouterLink v-if="auth.isLoggedIn" to="/cart" class="btn btn-sm btn-outline-success">Idi u korpu
            </RouterLink>
          </div>
        </div>
      </div>

      <section class="block">
        <h2><i class="fa-solid fa-trowel"></i> Sadnja i nega</h2>
        <p><strong><i class="fa-solid fa-seedling"></i> Sadnja:</strong> {{ plant.planting_instructions }}</p>
        <p><strong><i class="fa-solid fa-hand-holding-droplet"></i> Nega:</strong> {{ plant.care_instructions }}</p>
      </section>

      <section class="block">
        <h2><i class="fa-solid fa-list-check"></i> Karakteristike</h2>
        <div class="specs">
          <div v-for="s in specs" :key="s.label" class="spec">
            <i class="fa-solid" :class="s.icon"></i>
            <div><small class="muted">{{ s.label }}</small>
              <div>{{ s.value }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 class="mb-0"><i class="fa-solid fa-comments"></i> Recenzije korisnika</h2>
          <button v-if="auth.isLoggedIn && rv.canReview(plant.id)" class="btn btn-sm btn-outline-warning"
            @click="rv.openReview(plant.id, plant.name)">
            <i class="fa-solid fa-pen"></i>
            {{ rv.mineFor(plant.id) ? 'Izmeni svoju recenziju' : 'Ostavi recenziju' }}
          </button>
        </div>
        <p class="muted small">
          Recenziju mogu da ostave samo kupci kojima je biljka stigla (status "pristiglo").
        </p>

        <article v-for="(r, i) in reviewList" :key="i" class="review" :class="{ own: r.own }">
          <div class="d-flex justify-content-between align-items-center">
            <strong>
              <i class="fa-solid fa-circle-user muted"></i> {{ r.author }}
              <span v-if="r.own" class="badge text-bg-success ms-1">Vaša recenzija</span>
            </strong>
            <span class="stars">
              <i v-for="n in 5" :key="n" :class="[n <= r.rating ? 'fa-solid' : 'fa-regular', 'fa-star']"></i>
            </span>
          </div>
          <p v-if="r.text" class="mb-0 mt-1">{{ r.text }}</p>
          <p v-else class="mb-0 mt-1 muted small">Bez komentara.</p>
          <small v-if="r.date" class="muted">{{ r.date }}</small>
        </article>
      </section>
    </div>
  </main>
</template>