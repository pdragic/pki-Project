<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { tree, START, type Ctx, type Option } from '@/data/agentTree'

interface Msg {
  from: 'agent' | 'user'
  text: string
}

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()

const open = ref(false)
const typing = ref(false)
const messages = ref<Msg[]>([])
const current = ref<string>(START)
const body = ref<HTMLElement | null>(null)

const ctx = computed<Ctx>(() => ({
  loggedIn: auth.isLoggedIn,
  name: auth.user?.name?.split(' ')[0] ?? '',
  cartCount: cart.count,
}))

const options = computed(() => tree[current.value]?.options ?? [])

function textOf(id: string): string {
  const t = tree[id]?.text ?? ''
  return typeof t === 'function' ? t(ctx.value) : t
}

async function scrollDown() {
  await nextTick()
  body.value?.scrollTo({ top: body.value.scrollHeight, behavior: 'smooth' })
}

// agent "kuca" kratko, pa odgovara
async function say(id: string) {
  typing.value = true
  await scrollDown()
  await new Promise(r => setTimeout(r, 450))
  typing.value = false
  current.value = id
  messages.value.push({ from: 'agent', text: textOf(id) })
  scrollDown()
}

function toggle() {
  open.value = !open.value
  if (open.value && !messages.value.length) say(START)
}

function reset() {
  messages.value = []
  say(START)
}

async function choose(o: Option) {
  if (typing.value) return
  messages.value.push({ from: 'user', text: o.label })

  if (o.to) {
    router.push(o.to)
    await say(o.next ?? 'again2')
    return
  }
  if (o.next) await say(o.next)
}
</script>

<template>
  <button class="chat-fab" :aria-expanded="open" aria-label="Pomoćnik" @click="toggle">
    <i class="fa-solid" :class="open ? 'fa-xmark' : 'fa-comments'"></i>
  </button>

  <section v-if="open" class="chat" role="dialog" aria-label="Pomoćnik Biljko">
    <header class="chat-head">
      <span><i class="fa-solid fa-robot"></i> Biljko, pomoćnik</span>
      <div>
        <button class="icon-btn" aria-label="Počni iznova" title="Počni iznova" @click="reset">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button class="icon-btn" aria-label="Zatvori" @click="open = false">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </header>

    <div ref="body" class="chat-body" role="log" aria-live="polite">
      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.from">{{ m.text }}</div>
      <div v-if="typing" class="msg agent typing" aria-label="Agent kuca">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div class="chat-options">
      <button
        v-for="o in options" :key="o.label"
        class="btn btn-sm btn-outline-success"
        :disabled="typing"
        @click="choose(o)"
      >{{ o.label }}</button>
    </div>
  </section>
</template>