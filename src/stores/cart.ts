import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

export interface Reservation {
  id: string
  plantId: number
  name: string
  price: number
  imageUrl: string
  quantity: number
  stock?: number // stock_quantity iz API-ja
  status: 'rezervisano' | 'pristiglo' | 'otkazano'
  rating?: number // samo kad je 'pristiglo'
}

const cartKey = (userId: string) => `biljkara_cart_${userId}`

function readCart(userId?: string): Reservation[] {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(cartKey(userId))
    const list = raw ? (JSON.parse(raw) as Partial<Reservation>[]) : []
    // stare stavke (bez id) dobijaju id, da ništa ne pukne
    return list.map(r => ({ ...r, id: r.id ?? crypto.randomUUID() }) as Reservation)
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore()
  const items = ref<Reservation[]>(readCart(auth.user?.id))

  watch(
    () => auth.user?.id,
    id => { items.value = readCart(id) },
  )

  watch(
    items,
    v => {
      if (!auth.user) return
      try {
        localStorage.setItem(cartKey(auth.user.id), JSON.stringify(v))
      } catch {
        // ignorisi
      }
    },
    { deep: true },
  )

  const count = computed(() => items.value.length)
  const total = computed(() =>
    items.value
      .filter(i => i.status !== 'otkazano')
      .reduce((s, i) => s + i.price * i.quantity, 0))

  // koliko komada te biljke je već pristiglo
  function arrivedQty(plantId: number) {
    return items.value
      .filter(i => i.plantId === plantId && i.status === 'pristiglo')
      .reduce((s, i) => s + i.quantity, 0)
  }

  // najveća količina koja sme da bude rezervisana (stanje minus pristiglo)
  function maxFor(plantId: number, stock?: number) {
    if (stock === undefined) return Infinity
    return Math.max(0, stock - arrivedQty(plantId))
  }

  function getActive(plantId: number) {
    return items.value.find(i => i.plantId === plantId && i.status === 'rezervisano')
  }

  function hasActive(plantId: number) {
    return getActive(plantId) !== undefined
  }

  function add(r: Omit<Reservation, 'id'>): boolean {
    if (hasActive(r.plantId)) return false
    if (r.quantity > maxFor(r.plantId, r.stock)) return false
    items.value.push({ ...r, id: crypto.randomUUID() })
    return true
  }

  function find(id: string) {
    return items.value.find(i => i.id === id)
  }

  // vraća false ako nova količina nije dozvoljena (manja od 1 ili veća od slobodnog stanja)
  function setQuantity(id: string, q: number): boolean {
    const it = find(id)
    if (!it || it.status !== 'rezervisano' || q < 1) return false
    if (q > maxFor(it.plantId, it.stock)) return false
    it.quantity = q
    return true
  }
  function cancel(id: string) {
    const it = find(id)
    if (it && it.status === 'rezervisano') it.status = 'otkazano'
  }
  function remove(id: string) {
    const it = find(id)
    if (it && it.status !== 'rezervisano') {
      items.value = items.value.filter(i => i.id !== id)
    }
  }
  function rate(id: string, rating: number) {
    const it = find(id)
    if (it && it.status === 'pristiglo') it.rating = rating
  }
  // samo za demonstraciju prototipa
  function simulateArrival(id: string) {
    const it = find(id)
    if (it && it.status === 'rezervisano') it.status = 'pristiglo'
  }

  return {
    items, count, total,
    arrivedQty, maxFor, getActive, hasActive, add,
    setQuantity, cancel, remove, rate, simulateArrival,
  }
})