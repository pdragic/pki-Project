<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlantsStore } from '@/stores/plants'
import { rules } from '@/utils/validators'
import { toast, errorDialog, successDialog } from '@/utils/alert'
import FavoritesPicker from '@/components/FavoritesPicker.vue'

const auth = useAuthStore()
const plants = usePlantsStore()
const router = useRouter()

onMounted(() => plants.load())

const keys = ['name', 'email', 'phone', 'address', 'password', 'confirm'] as const
type Key = (typeof keys)[number]

const form = reactive<Record<Key, string>>({
  name: '', email: '', phone: '', address: '', password: '', confirm: '',
})
const touched = reactive<Record<Key, boolean>>({
  name: false, email: false, phone: false, address: false, password: false, confirm: false,
})

const favorites = ref<string[]>([])
const favTouched = ref(false)
// ako se vrste nisu učitale (API nedostupan), ne blokiramo registraciju
const favError = computed(() =>
  plants.categories.length && !favorites.value.length
    ? 'Izaberite bar jednu omiljenu vrstu biljaka.'
    : '',
)

const fields: { key: Key; label: string; icon: string; type: string; auto: string }[] = [
  { key: 'name', label: 'Ime i prezime', icon: 'fa-user', type: 'text', auto: 'name' },
  { key: 'email', label: 'Email', icon: 'fa-envelope', type: 'email', auto: 'email' },
  { key: 'phone', label: 'Telefon', icon: 'fa-phone', type: 'tel', auto: 'tel' },
  { key: 'address', label: 'Adresa', icon: 'fa-location-dot', type: 'text', auto: 'street-address' },
  { key: 'password', label: 'Šifra', icon: 'fa-lock', type: 'password', auto: 'new-password' },
  { key: 'confirm', label: 'Potvrda šifre', icon: 'fa-lock', type: 'password', auto: 'new-password' },
]

const errors = computed<Record<Key, string>>(() => ({
  name: rules.name(form.name),
  email: rules.email(form.email),
  phone: rules.phone(form.phone),
  address: rules.address(form.address),
  password: rules.password(form.password),
  confirm: form.confirm === form.password ? '' : 'Šifre se ne poklapaju.',
}))

const showError = (k: Key) => touched[k] && errors.value[k] !== ''
const isValid = computed(() => keys.every(k => errors.value[k] === '') && favError.value === '')

async function submit() {
  keys.forEach(k => (touched[k] = true))
  favTouched.value = true
  if (!isValid.value) {
    toast('Proverite označena polja.', 'error')
    return
  }

  const ok = auth.register({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    favorites: [...favorites.value],
    password: form.password,
  })

  if (!ok) {
    await errorDialog('Registracija nije uspela', 'Nalog sa ovim emailom već postoji.')
    return
  }
  await successDialog('Dobrodošli!', 'Vaš nalog je uspešno kreiran.')
  router.push('/')
}
</script>

<template>
  <main class="page page-form">
    <h1 class="mb-3"><i class="fa-solid fa-user-plus"></i> Registracija</h1>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <label v-for="f in fields" :key="f.key">
        <span><i class="fa-solid" :class="f.icon"></i> {{ f.label }}</span>
        <input
          v-model="form[f.key]"
          :type="f.type"
          :autocomplete="f.auto"
          :class="{ 'is-invalid': showError(f.key) }"
          @blur="touched[f.key] = true"
        />
        <div class="invalid-feedback">{{ errors[f.key] }}</div>
      </label>

      <div class="d-flex flex-column gap-2">
        <span><i class="fa-solid fa-heart"></i> Omiljene vrste biljaka</span>
        <FavoritesPicker v-model="favorites" :options="plants.categories" />
        <div v-if="favTouched && favError" class="text-danger small">{{ favError }}</div>
      </div>

      <button type="submit" class="btn btn-success">
        <i class="fa-solid fa-user-plus"></i> Registruj se
      </button>
    </form>

    <p class="mt-3">Već imate nalog? <RouterLink to="/login">Prijavite se</RouterLink></p>
  </main>
</template>