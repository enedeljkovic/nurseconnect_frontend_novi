<template>
  <div class="container my-5">
    <h2 class="text-center mb-4">{{ predmet }} - kvizovi</h2>

    <!-- Dodaj kviz (samo profesor) -->
    <div class="text-end mb-3" v-if="isProfesor">
      <button class="btn btn-primary" @click="dodajNoviKviz">+ Dodaj kviz</button>
    </div>

    <div v-if="quizzes.length === 0" class="alert alert-info">
      Trenutno nema kvizova za ovaj predmet.
    </div>

    <ul class="list-group" v-else>
      <li
        v-for="quiz in quizzes"
        :key="quiz.id"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        <div>
          <h5 class="mb-1">{{ quiz.naziv }}</h5>
          <small>{{ (quiz.pitanja && quiz.pitanja.length) || 0 }} pitanja</small>
          <div class="text-muted">Razred: {{ quiz.razred }}</div>
        </div>

        <div class="d-flex gap-2">
          <!-- UČENIK: Riješi ako nije riješen, inače Pregled -->
          <button
            v-if="!isProfesor && !solvedQuizzes[quiz.id]"
            class="btn btn-outline-success"
            @click="otvoriKviz(quiz.id)"
          >
            ▶ Riješi kviz
          </button>
          <button
            v-else-if="!isProfesor && solvedQuizzes[quiz.id]"
            class="btn btn-outline-info"
            @click="otvoriKviz(quiz.id)"
          >
            👁 Pregled pitanja
          </button>

          <!-- PROFESOR: Pregled + Obriši -->
          <button
            v-if="isProfesor"
            class="btn btn-outline-info"
            @click="otvoriKviz(quiz.id)"
          >
            👁 Pregled pitanja
          </button>

          <button
            v-if="isProfesor"
            class="btn btn-outline-danger"
            @click="removeQuiz(quiz)"
            title="Obriši kviz"
          >
            🗑 Obriši
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'SubjectQuizzes',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const quizzes = ref([]);
    const solvedQuizzes = ref({}); // { [quizId]: true/false }
    const predmet = decodeURIComponent(route.params.subject || route.params.predmet || '');
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Ako koristiš svoj api wrapper, slobodno zamijeni sve "axios" pozive s njim.
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    // ---- API pozivi ----
    const fetchQuizzes = async () => {
      try {
        // ispravno filtriranje po predmetu
        const res = await axios.get(`${API_BASE}/quizzes/subject/${encodeURIComponent(predmet)}`);
        quizzes.value = Array.isArray(res.data) ? res.data : [];

        // nakon što dohvatimo listu, provjeri za svakog je li riješen (samo za učenika)
        if (!isProfesor.value && user?.id) {
          await checkSolvedForAll();
        }
      } catch (error) {
        console.error('Greška pri dohvaćanju kvizova:', error);
      }
    };

    const checkSolvedForAll = async () => {
      const map = {};
      for (const q of quizzes.value) {
        try {
          const r = await axios.get(`${API_BASE}/quizzes/${q.id}/solved/${user.id}`);
          map[q.id] = !!r.data?.alreadySolved;
        } catch (err) {
          map[q.id] = false; // u sumnji – tretiraj kao neriješeno
        }
      }
      solvedQuizzes.value = map;
    };

    const dodajNoviKviz = () => {
      router.push(`/add-quiz?predmet=${encodeURIComponent(predmet)}`);
    };

    const otvoriKviz = (id) => {
      router.push(`/quizzes/${id}`);
    };

    const removeQuiz = async (quiz) => {
      if (!confirm('Sigurno obrisati ovaj kviz?')) return;
      try {
        await axios.delete(`${API_BASE}/quizzes/${quiz.id}`, {
          data: { profesorId: user?.id }
        });
        quizzes.value = quizzes.value.filter(q => q.id !== quiz.id);
        // očisti i solved cache
        const copy = { ...solvedQuizzes.value };
        delete copy[quiz.id];
        solvedQuizzes.value = copy;
      } catch (err) {
        console.error('Greška pri brisanju kviza:', err);
        alert('Greška: brisanje nije uspjelo.');
      }
    };

    onMounted(fetchQuizzes);

    return { quizzes, predmet, isProfesor, solvedQuizzes, dodajNoviKviz, otvoriKviz, removeQuiz };
  }
};
</script>
