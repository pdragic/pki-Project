<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore, type Reservation } from '@/stores/cart'
import { confirmDialog, toast } from '@/utils/alert'

const cart = useCartStore()

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
  <main class="page">
    <h1 class="mb-3"><i class="fa-solid fa-basket-shopping"></i> Korpa rezervacija</h1>

    <!-- prazna korpa -->
    <div v-if="!cart.items.length" class="empty">
      <i class="fa-solid fa-cart-shopping"></i>
      <h2>Vaša korpa je prazna</h2>
      <p class="muted">Rezervišite biljke i one će se pojaviti ovde.</p>
      <RouterLink to="/plants" class="btn btn-success">
        <i class="fa-solid fa-seedling"></i> Pregledaj biljke
      </RouterLink>
    </div>

    <div v-else class="row g-4">
      <!-- leva kolona: stavke -->
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

              <!-- količina: samo u statusu 'rezervisano' -->
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

              <!-- ocena: samo u statusu 'pristiglo' -->
              <div v-if="i.status === 'pristiglo'" class="rate">
                <span class="muted small">Vaša ocena:</span>
                <button v-for="n in 5" :key="n" class="star-btn"
                        :aria-label="`Oceni sa ${n}`" @click="cart.rate(i.id, n)">
                  <i :class="[i.rating && n <= i.rating ? 'fa-solid' : 'fa-regular', 'fa-star']"></i>
                </button>
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

          <!-- cena stavke, na dnu kartice -->
          <div class="item-footer">
            <span class="muted">Ukupno za stavku:</span>
            <strong>{{ i.price * i.quantity }} RSD</strong>
            <span class="muted small">({{ i.quantity }} × {{ i.price }} RSD)</span>
          </div>
        </article>
      </div>

      <!-- desna kolona: pregled -->
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

<style scoped>
.empty { text-align: center; padding: 3rem 1rem; background: var(--bs-tertiary-bg); border: 1px dashed var(--bs-border-color); border-radius: 16px; }
.empty > i { font-size: 3rem; color: var(--leaf-light); margin-bottom: .75rem; }

.item { background: var(--bs-tertiary-bg); }
.item.cancelled { opacity: .6; }
.item-grid { display: grid; grid-template-columns: 96px 1fr auto; gap: 1rem; padding: 1rem; }
.thumb { background: #eef6ee; border-radius: 10px; display: flex; align-items: center; justify-content: center; height: 96px; }
.thumb img { width: 100%; height: 100%; object-fit: contain; padding: .35rem; }
.info { display: flex; flex-direction: column; gap: .4rem; }
.name { font-weight: 600; font-size: 1.1rem; text-decoration: none; }
.side { display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; min-width: 150px; }

.item-footer {
  display: flex;
  justify-content: center;
  align-items: baseline;
  flex-wrap: wrap;
  gap: .5rem;
  padding: .6rem 1rem;
  border-top: 1px solid var(--bs-border-color);
}
.item-footer strong { font-size: 1.15rem; color: var(--leaf-light); }

.qty { display: inline-flex; align-items: center; gap: .5rem; }
.qty-value { min-width: 2rem; text-align: center; font-weight: 600; }

.rate { display: flex; align-items: center; gap: .15rem; }
.star-btn { background: none; border: 0; color: #ffc107; font-size: 1.15rem; cursor: pointer; padding: 0 .1rem; }
.star-btn:hover { transform: scale(1.2); }

.summary { position: sticky; top: 1rem; background: var(--bs-tertiary-bg); }
.sum-row { display: flex; justify-content: space-between; padding: .3rem 0; }
.sum-row.total { font-size: 1.3rem; font-weight: 700; color: var(--leaf-light); }

@media (max-width: 575px) {
  .item-grid { grid-template-columns: 72px 1fr; }
  .thumb { height: 72px; }
  .side { grid-column: 1 / -1; align-items: stretch; }
}
</style>