<template>
  <div id="app">
    <!-- Glavni sadržaj aplikacije -->
    <router-view />
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const router = useRouter()

    const isLoggedIn = computed(() => !!localStorage.getItem('user'))
    const showNav = computed(() => route.path !== '/login')

    onMounted(() => {
      if (!isLoggedIn.value && route.path !== '/login') {
        router.push('/login')
      }
    })

    return { showNav, isLoggedIn }
  }
}
</script>

<style>
/* Možeš obrisati ovaj dio ako više ne koristiš nav */
</style>
