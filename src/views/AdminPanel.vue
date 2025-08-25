<template>
  <div class="container my-5">
    <h2 class="mb-4 text-center text-primary">🛠️ Admin Panel</h2>

    <div class="row g-4">
      <div class="col-md-4" v-for="card in cards" :key="card.title">
        <div class="card h-100 shadow-sm text-center p-4" @click="navigate(card.route)" style="cursor: pointer;">
          <div class="card-body">
            <h5 class="card-title">{{ card.title }}</h5>
            <p class="card-text text-muted">{{ card.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'AdminPanel',
  setup() {
    const router = useRouter();

    const cards = [
      {
        title: '👤 Upravljanje studentima',
        description: 'Dodavanje i brisanje studenata',
        route: '/admin/students'
      },
      {
        title: '📚 Upravljanje materijalima',
        description: 'Uredi ili izbriši materijale',
        route: '/admin/materials'
      },
      {
        title: '📝 Upravljanje kvizovima',
        description: 'Uredi ili izbriši kvizove',
        route: '/admin/quizzes'
      },
      {
        title: '🧑‍🏫 Upravljanje profesorima',
        description: 'Dodaj i poveži profesore s predmetima',
        route: '/admin/professors'
      },
      {
        title: '⚙️ Postavke',
        description: 'Postavke sustava i profila (uskoro)',
        route: '/admin/settings'
      }
    ];

    const navigate = (route) => {
      router.push(route);
    };

    return { cards, navigate };
  }
};
</script>


<style scoped>
.card:hover {
  background-color: #f0f8ff;
  transform: scale(1.03);
  transition: 0.3s ease;
}
</style>
