import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  address: string
  favorites?: string
  password: string
}

const USERS_KEY = 'biljkara_users'
const SESSION_KEY = 'biljkara_session'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage nije dostupan, aplikacija nastavlja da radi u memoriji
  }
}

const norm = (email: string) => email.trim().toLowerCase()

export const useAuthStore = defineStore('auth', () => {
  const users = ref<User[]>(read<User[]>(USERS_KEY, []))

  // sesija čuva samo id prijavljenog korisnika
  const sessionId = read<string | null>(SESSION_KEY, null)
  const user = ref<User | null>(users.value.find(u => u.id === sessionId) ?? null)

  const isLoggedIn = computed(() => user.value !== null)

  // svaka izmena (registracija, izmena profila) se odmah snima
  watch(users, v => write(USERS_KEY, v), { deep: true })
  watch(() => user.value?.id ?? null, id => write(SESSION_KEY, id))

  function register(data: Omit<User, 'id'>): boolean {
    if (users.value.some(u => norm(u.email) === norm(data.email))) return false
    const newUser: User = { ...data, id: crypto.randomUUID(), email: data.email.trim() }
    users.value.push(newUser)
    // uzimamo objekat iz niza, da izmene profila menjaju isti zapis
    user.value = users.value[users.value.length - 1] ?? null
    return true
  }

  function login(email: string, password: string): boolean {
    const found = users.value.find(
      u => norm(u.email) === norm(email) && u.password === password,
    )
    if (!found) return false
    user.value = found
    return true
  }

  function changePassword(current: string, next: string): boolean {
    if (!user.value || user.value.password !== current) return false
    user.value.password = next
    return true
  }

  function logout() {
    user.value = null
  }

  return { users, user, isLoggedIn, register, login, logout, changePassword }
})