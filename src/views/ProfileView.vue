<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { rules } from '@/utils/validators'
import { confirmDialog, toast } from '@/utils/alert'

const auth = useAuthStore()

// ---------- podaci profila ----------
// radimo na kopiji, original se menja tek kad korisnik klikne "Sačuvaj"
const original = auth.user ? { ...auth.user } : null
const form = reactive({
  name: original?.name ?? '',
  email: original?.email ?? '',
  phone: original?.phone ?? '',
  address: original?.address ?? '',
})
const error = ref('')

function submit() {
  error.value = ''
  if (!auth.user) return

  const err =
    rules.name(form.name) || rules.email(form.email) ||
    rules.phone(form.phone) || rules.address(form.address)
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

  Object.assign(auth.user, { ...form, email: form.email.trim() })
  toast('Podaci profila su uspešno sačuvani.')
}

// ---------- izmena šifre ----------
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
  <main class="page" style="max-width: 520px">
    <h1 class="mb-3"><i class="fa-solid fa-circle-user"></i> Moj profil</h1>

    <template v-if="auth.user">
      <!-- podaci profila -->
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

        <div v-if="error" role="alert" class="alert alert-danger mb-0">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
        </div>

        <button type="submit" class="btn btn-success">
          <i class="fa-solid fa-floppy-disk"></i> Sačuvaj izmene
        </button>
      </form>

      <hr class="my-4" />

      <!-- izmena šifre -->
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