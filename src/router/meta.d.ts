import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    loadingTitle?: string
    loadingText?: string
  }
}