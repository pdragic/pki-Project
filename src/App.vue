<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { confirmDialog, toast } from '@/utils/alert'

const cart = useCartStore()
const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

async function askLogout() {
  menuOpen.value = false
  const ok = await confirmDialog({
    title: 'Odjava',
    text: 'Da li ste sigurni da želite da se odjavite?',
    confirmText: 'Odjavi me',
    danger: true,
  })
  if (!ok) return
  auth.logout()
  router.push('/')
  toast('Uspešno ste se odjavili.', 'info')
}
</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="brand" @click="menuOpen = false">
      <i class="fa-solid fa-leaf"></i> Biljkara
    </RouterLink>

    <button class="burger" :aria-expanded="menuOpen" aria-label="Meni" @click="menuOpen = !menuOpen">
      <i class="fa-solid" :class="menuOpen ? 'fa-xmark' : 'fa-bars'"></i>
    </button>

    <nav :class="{ open: menuOpen }" @click="menuOpen = false">
      <RouterLink to="/"><i class="fa-solid fa-house"></i> Početna</RouterLink>
      <RouterLink to="/plants"><i class="fa-solid fa-seedling"></i> Biljke</RouterLink>
      <RouterLink to="/cart">
        <i class="fa-solid fa-cart-shopping"></i> Korpa
        <span v-if="cart.count" class="badge-count">{{ cart.count }}</span>
      </RouterLink>

      <template v-if="auth.isLoggedIn">
        <RouterLink to="/profile"><i class="fa-solid fa-circle-user"></i> {{ auth.user?.name }}</RouterLink>
        <button class="link" @click.stop="askLogout">
          <i class="fa-solid fa-right-from-bracket"></i> Odjava
        </button>
      </template>
      <template v-else>
        <RouterLink to="/login"><i class="fa-solid fa-right-to-bracket"></i> Prijava</RouterLink>
        <RouterLink to="/register" class="cta"><i class="fa-solid fa-user-plus"></i> Registracija</RouterLink>
      </template>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
.topbar { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1rem; background: #1b5e20; position: relative; }
.brand { color: #fff; font-weight: 700; font-size: 1.2rem; text-decoration: none; }
nav { display: flex; align-items: center; gap: 1.1rem; }
nav a, .link { color: #fff; text-decoration: none; background: none; border: 0; cursor: pointer; font: inherit; opacity: .9; }
nav a:hover, .link:hover { opacity: 1; }
nav a.router-link-exact-active { opacity: 1; text-decoration: underline; text-underline-offset: 6px; }
.cta { padding: .3rem .8rem; border: 1px solid #fff; border-radius: 8px; }
.badge-count { background: #fff; color: #1b5e20; border-radius: 999px; padding: 0 .45rem; font-size: .8rem; margin-left: .25rem; font-weight: 700; }
.burger { display: none; background: none; border: 0; color: #fff; font-size: 1.4rem; cursor: pointer; }

@media (max-width: 700px) {
  .burger { display: block; }
  nav { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; align-items: flex-start; background: #1b5e20; padding: 1rem; z-index: 10; }
  nav.open { display: flex; }
}
</style>