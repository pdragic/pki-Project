<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { rules } from '@/utils/validators'
import { toast, errorDialog } from '@/utils/alert'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const touched = reactive({ email: false, password: false })

const emailError = computed(() => rules.email(email.value))
const passwordError = computed(() => (password.value ? '' : 'Unesite šifru.'))

async function submit() {
  touched.email = true
  touched.password = true
  if (emailError.value || passwordError.value) return

  if (auth.login(email.value, password.value)) {
    toast(`Dobrodošli, ${auth.user?.name ?? ''}`)
    router.push((route.query.redirect as string) || '/')
  } else {
    await errorDialog('Prijava nije uspela', 'Pogrešan email ili šifra.')
  }
}
</script>

<template>
  <main class="page" style="max-width: 420px">
    <h1 class="mb-3"><i class="fa-solid fa-right-to-bracket"></i> Prijava</h1>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <label>
        <span><i class="fa-solid fa-envelope"></i> Email</span>
        <input v-model="email" type="email" autocomplete="email"
               :class="{ 'is-invalid': touched.email && emailError }"
               @blur="touched.email = true" />
        <div class="invalid-feedback">{{ emailError }}</div>
      </label>

      <label>
        <span><i class="fa-solid fa-lock"></i> Šifra</span>
        <input v-model="password" type="password" autocomplete="current-password"
               :class="{ 'is-invalid': touched.password && passwordError }"
               @blur="touched.password = true" />
        <div class="invalid-feedback">{{ passwordError }}</div>
      </label>

      <button type="submit" class="btn btn-success">
        <i class="fa-solid fa-right-to-bracket"></i> Prijavi se
      </button>
    </form>

    <p class="mt-3">Nemate nalog? <RouterLink to="/register">Registrujte se</RouterLink></p>
  </main>
</template>