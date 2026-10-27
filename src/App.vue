<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { confirmDialog, toast } from '@/utils/alert'
import ChatAgent from '@/components/ChatAgent.vue'

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
  <ChatAgent />
</template>

