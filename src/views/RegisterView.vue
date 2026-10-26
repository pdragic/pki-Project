<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { rules } from '@/utils/validators'
import { toast, errorDialog, successDialog } from '@/utils/alert'

const auth = useAuthStore()
const router = useRouter()

const keys = ['name', 'email', 'phone', 'address', 'password', 'confirm'] as const
type Key = (typeof keys)[number]

const form = reactive<Record<Key, string>>({
  name: '', email: '', phone: '', address: '', password: '', confirm: '',
})
const touched = reactive<Record<Key, boolean>>({
  name: false, email: false, phone: false, address: false, password: false, confirm: false,
})

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
const isValid = computed(() => keys.every(k => errors.value[k] === ''))

async function submit() {
  keys.forEach(k => (touched[k] = true))
  if (!isValid.value) {
    toast('Proverite označena polja.', 'error')
    return
  }

  const ok = auth.register({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
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
  <main class="page" style="max-width: 460px">
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

      <button type="submit" class="btn btn-success">
        <i class="fa-solid fa-user-plus"></i> Registruj se
      </button>
    </form>

    <p class="mt-3">Već imate nalog? <RouterLink to="/login">Prijavite se</RouterLink></p>
  </main>
</template>