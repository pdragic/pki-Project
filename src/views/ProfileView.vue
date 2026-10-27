<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlantsStore } from '@/stores/plants'
import { rules } from '@/utils/validators'
import { confirmDialog, toast } from '@/utils/alert'
import FavoritesPicker from '@/components/FavoritesPicker.vue'

const auth = useAuthStore()
const plants = usePlantsStore()
onMounted(() => plants.load())

const original = auth.user ? { ...auth.user } : null
const form = reactive({
  name: original?.name ?? '',
  email: original?.email ?? '',
  phone: original?.phone ?? '',
  address: original?.address ?? '',
})
const favorites = ref<string[]>([...(original?.favorites ?? [])])
const error = ref('')

const favError = computed(() =>
  plants.categories.length && !favorites.value.length
    ? 'Izaberite bar jednu omiljenu vrstu biljaka.'
    : '',
)

function submit() {
  error.value = ''
  if (!auth.user) return

  const err =
    rules.name(form.name) || rules.email(form.email) ||
    rules.phone(form.phone) || rules.address(form.address) || favError.value
  if (err) {
    error.value = err
    return
  }

  const emailTaken = auth.users.some(
    u => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== auth.user!.id,
  )
  if (emailTaken) {
    error.value = 'Nalog sa ovim emailom već postoji.'
    return
  }

  Object.assign(auth.user, {
    ...form,
    email: form.email.trim(),
    favorites: [...favorites.value],
  })
  toast('Podaci profila su uspešno sačuvani.')
}

const pw = reactive({ current: '', next: '', confirm: '' })
const pwError = ref('')

async function askChangePassword() {
  pwError.value = ''

  const err = rules.password(pw.next)
  if (err) { pwError.value = err; return }
  if (pw.next !== pw.confirm) { pwError.value = 'Nova šifra i potvrda se ne poklapaju.'; return }
  if (pw.next === pw.current) { pwError.value = 'Nova šifra mora biti različita od trenutne.'; return }

  const ok = await confirmDialog({
    title: 'Promena šifre',
    text: 'Da li ste sigurni da želite da promenite šifru?',
    confirmText: 'Promeni šifru',
  })
  if (!ok) return

  if (!auth.changePassword(pw.current, pw.next)) {
    pwError.value = 'Trenutna šifra nije tačna.'
    return
  }
  toast('Šifra je uspešno promenjena.')
  pw.current = ''
  pw.next = ''
  pw.confirm = ''
}
</script>

<template>
  <main class="page page-form">
    <h1 class="mb-3"><i class="fa-solid fa-circle-user"></i> Moj profil</h1>

    <template v-if="auth.user">
      <form class="auth-form" novalidate @submit.prevent="submit">
        <h2 class="h5 mb-0"><i class="fa-solid fa-id-card"></i> Lični podaci</h2>

        <label>
          <span><i class="fa-solid fa-user"></i> Ime i prezime</span>
          <input v-model="form.name" autocomplete="name" />
        </label>
        <label>
          <span><i class="fa-solid fa-envelope"></i> Email</span>
          <input v-model="form.email" type="email" autocomplete="email" />
        </label>
        <label>
          <span><i class="fa-solid fa-phone"></i> Telefon</span>
          <input v-model="form.phone" type="tel" autocomplete="tel" />
        </label>
        <label>
          <span><i class="fa-solid fa-location-dot"></i> Adresa</span>
          <input v-model="form.address" autocomplete="street-address" />
        </label>

        <div class="d-flex flex-column gap-2">
          <span><i class="fa-solid fa-heart"></i> Omiljene vrste biljaka</span>
          <FavoritesPicker v-model="favorites" :options="plants.categories" />
        </div>

        <div v-if="error" role="alert" class="alert alert-danger mb-0">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
        </div>

        <button type="submit" class="btn btn-success">
          <i class="fa-solid fa-floppy-disk"></i> Sačuvaj izmene
        </button>
      </form>

      <hr class="my-4" />

      <form class="auth-form" novalidate @submit.prevent="askChangePassword">
        <h2 class="h5 mb-0"><i class="fa-solid fa-key"></i> Promena šifre</h2>

        <label>
          <span>Trenutna šifra</span>
          <input v-model="pw.current" type="password" autocomplete="current-password" required />
        </label>
        <label>
          <span>Nova šifra</span>
          <input v-model="pw.next" type="password" autocomplete="new-password" required />
        </label>
        <label>
          <span>Potvrda nove šifre</span>
          <input v-model="pw.confirm" type="password" autocomplete="new-password" required />
        </label>

        <div v-if="pwError" role="alert" class="alert alert-danger mb-0">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ pwError }}
        </div>

        <button type="submit" class="btn btn-outline-success">
          <i class="fa-solid fa-lock"></i> Promeni šifru
        </button>
      </form>
    </template>
  </main>
</template>