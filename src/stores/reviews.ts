import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { getReviews } from '@/data/reviews'
import { reviewDialog, toast } from '@/utils/alert'

export interface UserReview {
  plantId: number
  userId: string
  author: string
  rating: number
  text: string
  date: string
}

export interface ShownReview {
  author: string
  rating: number
  text: string
  date?: string
  own: boolean
}

const KEY = 'biljkara_reviews'

function readAll(): UserReview[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as UserReview[]) : []
  } catch {
    return []
  }
}

export const useReviewsStore = defineStore('reviews', () => {
  const auth = useAuthStore()
  const cart = useCartStore()
  const list = ref<UserReview[]>(readAll())

  watch(
    list,
    v => {
      try {
        localStorage.setItem(KEY, JSON.stringify(v))
      } catch {
      }
    },
    { deep: true },
  )

  function mineFor(plantId: number) {
    return list.value.find(r => r.plantId === plantId && r.userId === auth.user?.id)
  }

  function canReview(plantId: number) {
    return cart.items.some(i => i.plantId === plantId && i.status === 'pristiglo')
  }

  function save(plantId: number, rating: number, text: string) {
    if (!auth.user) return
    const date = new Date().toISOString().slice(0, 10)
    const existing = mineFor(plantId)
    if (existing) {
      existing.rating = rating
      existing.text = text
      existing.date = date
      existing.author = auth.user.name
    } else {
      list.value.push({
        plantId, userId: auth.user.id, author: auth.user.name, rating, text, date,
      })
    }
  }

  function forPlant(plantId: number): ShownReview[] {
    const real: ShownReview[] = list.value
      .filter(r => r.plantId === plantId)
      .map(r => ({
        author: r.author, rating: r.rating, text: r.text, date: r.date,
        own: r.userId === auth.user?.id,
      }))
      .sort((a, b) => Number(b.own) - Number(a.own))

    const simulated: ShownReview[] = getReviews(plantId).map(r => ({ ...r, own: false }))
    return [...real, ...simulated]
  }

  function average(plantId: number): number {
    const r = forPlant(plantId)
    return r.reduce((s, x) => s + x.rating, 0) / r.length
  }

  async function openReview(plantId: number, plantName: string): Promise<boolean> {
    if (!canReview(plantId)) {
      toast('Recenziju možete ostaviti tek kada biljka pristigne.', 'info')
      return false
    }
    const existing = mineFor(plantId)
    const res = await reviewDialog({
      title: existing ? `Izmena recenzije: ${plantName}` : `Ocenite: ${plantName}`,
      rating: existing?.rating,
      text: existing?.text,
    })
    if (!res) return false
    save(plantId, res.rating, res.text)
    toast(existing ? 'Recenzija je ažurirana.' : 'Hvala na oceni!')
    return true
  }

  return { list, mineFor, canReview, save, forPlant, average, openReview }
})

export function averageRating(plantId: number): number {
  return useReviewsStore().average(plantId)
}