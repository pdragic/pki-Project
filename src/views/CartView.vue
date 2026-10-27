<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore, type Reservation } from '@/stores/cart'
import { useReviewsStore } from '@/stores/reviews'
import { confirmDialog, toast } from '@/utils/alert'

const cart = useCartStore()
const rv = useReviewsStore()

type Filter = 'sve' | Reservation['status']
const filter = ref<Filter>('sve')

const tabs: { key: Filter; label: string; icon: string }[] = [
  { key: 'sve', label: 'Sve', icon: 'fa-layer-group' },
  { key: 'rezervisano', label: 'Rezervisano', icon: 'fa-clock' },
  { key: 'pristiglo', label: 'Pristiglo', icon: 'fa-box-open' },
  { key: 'otkazano', label: 'Otkazano', icon: 'fa-ban' },
]

const statusMeta = {
  rezervisano: { cls: 'text-bg-warning', icon: 'fa-clock' },
  pristiglo: { cls: 'text-bg-success', icon: 'fa-circle-check' },
  otkazano: { cls: 'text-bg-danger', icon: 'fa-circle-xmark' },
} as const

function countBy(k: Filter) {
  return k === 'sve' ? cart.items.length : cart.items.filter(i => i.status === k).length
}
function sumBy(status: Reservation['status']) {
  return cart.items
    .filter(i => i.status === status)
    .reduce((s, i) => s + i.price * i.quantity, 0)
}

const visible = computed(() =>
  filter.value === 'sve' ? cart.items : cart.items.filter(i => i.status === filter.value),
)

// u ukupno se računaju samo pristigle biljke
const unitsCount = computed(() =>
  cart.items
    .filter(i => i.status === 'pristiglo')
    .reduce((s, i) => s + i.quantity, 0),
)
const grandTotal = computed(() => sumBy('pristiglo'))

// najveća količina koja sme da se rezerviše (stanje minus već pristiglo)
function maxOf(i: Reservation) {
  return cart.maxFor(i.plantId, i.stock)
}
function atLimit(i: Reservation) {
  return i.quantity >= maxOf(i)
}

async function ask(item: Reservation, action: 'order' | 'cancel' | 'remove') {
  const cfg = {
    order: {
      title: 'Potvrda narudžbine',
      text: `Da li ste sigurni da želite da naručite biljku "${item.name}"?`,
      confirmText: 'Naruči',
      danger: false,
      done: `Biljka "${item.name}" je uspešno naručena.`,
    },
    cancel: {
      title: 'Otkazivanje rezervacije',
      text: `Da li ste sigurni da želite da otkažete rezervaciju biljke "${item.name}"?`,
      confirmText: 'Otkaži rezervaciju',
      danger: true,
      done: `Rezervacija biljke "${item.name}" je otkazana.`,
    },
    remove: {
      title: 'Brisanje iz korpe',
      text: `Da li ste sigurni da želite da obrišete "${item.name}" iz korpe? Ova radnja se ne može poništiti.`,
      confirmText: 'Obriši',
      danger: true,
      done: `Biljka "${item.name}" je obrisana iz korpe.`,
    },
  }[action]

  if (!(await confirmDialog(cfg))) return

  if (action === 'order') cart.simulateArrival(item.id)
  else if (action === 'cancel') cart.cancel(item.id)
  else cart.remove(item.id)

  toast(cfg.done, action === 'order' ? 'success' : 'info')
}
</script>

<template>
  <main class="page cart-page">
    <h1 class="mb-3"><i class="fa-solid fa-basket-shopping"></i> Korpa rezervacija</h1>

    <div v-if="!cart.items.length" class="empty">
      <i class="fa-solid fa-cart-shopping"></i>
      <h2>Vaša korpa je prazna</h2>
      <p class="muted">Rezervišite biljke i one će se pojaviti ovde.</p>
      <RouterLink to="/plants" class="btn btn-success">
        <i class="fa-solid fa-seedling"></i> Pregledaj biljke
      </RouterLink>
    </div>

    <div v-else class="row g-4">
      <div class="col-lg-8">
        <ul class="nav nav-pills mb-3 flex-wrap gap-1">
          <li v-for="t in tabs" :key="t.key" class="nav-item">
            <button class="nav-link" :class="{ active: filter === t.key }" @click="filter = t.key">
              <i class="fa-solid" :class="t.icon"></i> {{ t.label }}
              <span class="badge rounded-pill text-bg-secondary ms-1">{{ countBy(t.key) }}</span>
            </button>
          </li>
        </ul>

        <p v-if="!visible.length" class="muted">
          <i class="fa-solid fa-filter-circle-xmark"></i> Nema stavki sa ovim statusom.
        </p>

        <article v-for="i in visible" :key="i.id" class="card item mb-3"
                 :class="{ cancelled: i.status === 'otkazano' }">
          <div class="item-grid">
            <div class="thumb"><img :src="i.imageUrl" :alt="i.name" /></div>

            <div class="info">
              <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <RouterLink :to="`/plants/${i.plantId}`" class="name">{{ i.name }}</RouterLink>
                <span class="badge" :class="statusMeta[i.status].cls">
                  <i class="fa-solid" :class="statusMeta[i.status].icon"></i> {{ i.status }}
                </span>
              </div>

              <div class="muted small">{{ i.price }} RSD po komadu</div>

              <div v-if="i.status === 'rezervisano'" class="qty" role="group" aria-label="Količina">
                <button class="btn btn-sm btn-outline-secondary" :disabled="i.quantity <= 1"
                        aria-label="Smanji količinu" @click="cart.setQuantity(i.id, i.quantity - 1)">
                  <i class="fa-solid fa-minus"></i>
                </button>
                <span class="qty-value">{{ i.quantity }}</span>
                <button class="btn btn-sm btn-outline-secondary" :disabled="atLimit(i)"
                        aria-label="Povećaj količinu" @click="cart.setQuantity(i.id, i.quantity + 1)">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
              <div v-else class="small">Količina: {{ i.quantity }}</div>

              <div v-if="i.status === 'rezervisano' && atLimit(i)" class="small text-warning">
                <i class="fa-solid fa-circle-info"></i>
                Najveća moguća količina je {{ maxOf(i) }}
                (na stanju {{ i.stock }}<template v-if="cart.arrivedQty(i.plantId)">,
                već pristiglo {{ cart.arrivedQty(i.plantId) }}</template>).
              </div>

              <div v-if="i.status === 'pristiglo'" class="rate">
                <span class="muted small">Vaša ocena:</span>
                <span class="stars">
                  <i v-for="n in 5" :key="n"
                     :class="[(rv.mineFor(i.plantId)?.rating ?? 0) >= n ? 'fa-solid' : 'fa-regular', 'fa-star']"></i>
                </span>
                <button class="btn btn-sm btn-outline-warning ms-1" @click="rv.openReview(i.plantId, i.name)">
                  <i class="fa-solid fa-pen"></i>
                  {{ rv.mineFor(i.plantId) ? 'Izmeni recenziju' : 'Oceni' }}
                </button>
              </div>
              <div v-if="i.status === 'pristiglo' && rv.mineFor(i.plantId)?.text" class="small muted fst-italic">
                „{{ rv.mineFor(i.plantId)?.text }}“
              </div>
            </div>

            <div class="side">
              <div class="d-flex flex-column gap-1 mt-auto">
                <RouterLink :to="`/plants/${i.plantId}`" class="btn btn-sm btn-primary">
                  <i class="fa-solid fa-circle-info"></i> Detalji
                </RouterLink>

                <template v-if="i.status === 'rezervisano'">
                  <button class="btn btn-sm btn-success" @click="ask(i, 'order')">
                    <i class="fa-solid fa-bag-shopping"></i> Naruči
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="ask(i, 'cancel')">
                    <i class="fa-solid fa-ban"></i> Otkaži
                  </button>
                </template>
                <button v-else class="btn btn-sm btn-outline-danger" @click="ask(i, 'remove')">
                  <i class="fa-solid fa-trash"></i> Obriši
                </button>
              </div>
            </div>
          </div>

          <div class="item-footer">
            <span class="muted">Ukupno za stavku:</span>
            <strong>{{ i.price * i.quantity }} RSD</strong>
            <span class="muted small">({{ i.quantity }} × {{ i.price }} RSD)</span>
          </div>
        </article>
      </div>

      <aside class="col-lg-4">
        <div class="card summary">
          <div class="card-body">
            <h2 class="h5 mb-3"><i class="fa-solid fa-receipt"></i> Pregled rezervacija</h2>

            <div class="sum-row">
              <span><i class="fa-solid fa-clock text-warning"></i> Rezervisano</span>
              <span>{{ sumBy('rezervisano') }} RSD</span>
            </div>
            <div class="sum-row">
              <span><i class="fa-solid fa-circle-check text-success"></i> Pristiglo</span>
              <span>{{ sumBy('pristiglo') }} RSD</span>
            </div>
            <div class="sum-row muted">
              <span><i class="fa-solid fa-circle-xmark text-danger"></i> Otkazano (ne računa se)</span>
              <span class="text-decoration-line-through">{{ sumBy('otkazano') }} RSD</span>
            </div>

            <hr />
            <div class="sum-row muted">
              <span>Ukupno komada (pristiglo)</span><span>{{ unitsCount }}</span>
            </div>
            <div class="sum-row total">
              <span>Ukupno</span><span>{{ grandTotal }} RSD</span>
            </div>
            <p class="muted small mb-0 mt-1">
              U ukupno se računaju samo pristigle biljke.
            </p>

            <RouterLink to="/plants" class="btn btn-outline-success w-100 mt-3">
              <i class="fa-solid fa-plus"></i> Dodaj još biljaka
            </RouterLink>
          </div>
        </div>
      </aside>
    </div>
  </main>
</template>