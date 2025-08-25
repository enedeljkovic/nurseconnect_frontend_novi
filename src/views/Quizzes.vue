<template>
  <div class="container my-5">
    <!-- Natrag gumb na vrhu stranice -->
    <div class="text-start mb-3">
      <router-link to="/home" class="btn btn-outline-primary">
        ⬅ Natrag na početnu stranicu
      </router-link>
    </div>

    <h2 class="text-center mb-5 text-primary">🧠 Kvizovi po predmetima</h2>

    <!-- Odabir predmeta -->
    <div v-if="!selectedSubject" class="row g-4">
      <div
        v-for="predmet in predmeti"
        :key="predmet"
        class="col-12 col-md-6 col-lg-4"
      >
        <div
          class="card predmet-card shadow h-100"
          @click="selectSubject(predmet)"
        >
          <div class="card-body text-center d-flex flex-column justify-content-center">
            <h5 class="card-title fw-bold text-secondary">{{ predmet }}</h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Kvizovi za odabrani predmet -->
    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="text-success">{{ selectedSubject }}</h3>
        <div>
          <button
            v-if="mozeDodatiKviz"
            class="btn btn-primary me-2"
            @click="goToAddQuiz(selectedSubject)"
          >
            + Dodaj kviz
          </button>
          
        </div>
      </div>

      <div v-if="quizzes.length === 0" class="alert alert-warning text-center">
        📭 Nema kvizova za ovaj predmet.
      </div>

      <div class="row g-4">
        <div v-for="quiz in quizzes" :key="quiz.id" class="col-md-6">
          <div class="card quiz-card shadow-sm h-100">
            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <h5 class="card-title text-dark fw-bold">{{ quiz.naziv }}</h5>
                <p class="text-muted">{{ quiz.pitanja.length }} pitanja</p>
                <p class="text-muted"><strong>Razred:</strong> {{ quiz.razred }}</p>
              </div>

              <button
                v-if="!isProfesor"
                class="btn btn-outline-success mt-3"
                @click="goToQuiz(quiz.id)"
              >
                {{ solvedQuizzes[quiz.id] ? '👁 Pogledaj riješeni kviz' : '▶ Riješi kviz' }}
              </button>

              <button
                v-else
                class="btn btn-outline-info mt-3"
                @click="goToQuiz(quiz.id)"
              >
                👁 Pregled pitanja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import axios from 'axios';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'Quizzes',
  setup() {
    const predmeti = [
      'Psihologija', 'Načela poučavanja', 'Etika u sestrinstvu',
      'Anatomija i fiziologija', 'Bakteriologija, virologija i parazitologija', 'Biokemija',
      'Opća načela zdravlja i njege', 'Zdravstvena njega - opća',
      'Zdravstvena njega zdravog djeteta i adolescenta', 'Osnove fizikalne i radne terapije (izborni)',
      'Profesionalna komunikacija u sestrinstvu (izborni)', 'Sat razrednika'
    ];

    const quizzes = ref([]);
    const solvedQuizzes = ref({});
    const selectedSubject = ref(null);
    const router = useRouter();

    const user = JSON.parse(localStorage.getItem('user'));
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true');
    const profesorPredmeti = ref([]);
    const razred = ref(user?.razred || null);

    const mozeDodatiKviz = computed(() => {
      return isProfesor.value && selectedSubject.value && profesorPredmeti.value.includes(selectedSubject.value);
    });

    const fetchQuizzesForSubject = async (predmet) => {
      try {
        const res = await axios.get(`http://localhost:3001/quizzes/subject/${encodeURIComponent(predmet)}`);
        let allQuizzes = res.data;

        if (!isProfesor.value && razred.value) {
          allQuizzes = allQuizzes.filter(kviz => kviz.razred === razred.value);
        }

        quizzes.value = allQuizzes;
        await checkSolvedQuizzes(allQuizzes.map(q => q.id));
      } catch (error) {
        console.error('Greška pri dohvaćanju kvizova:', error);
      }
    };

    const checkSolvedQuizzes = async (quizIds) => {
      solvedQuizzes.value = {};
      for (const id of quizIds) {
        try {
          const res = await axios.get(`http://localhost:3001/solved/${user.id}/${id}`);
          solvedQuizzes.value[id] = res.data.solved;
        } catch (err) {
          console.error('Greška pri provjeri riješenih kvizova:', err);
        }
      }
    };

    const fetchProfesorPredmeti = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(`http://localhost:3001/profesori/${user.id}`);
        profesorPredmeti.value = res.data.Subjects.map(s => s.naziv);
        localStorage.setItem('profesorPredmeti', JSON.stringify(profesorPredmeti.value));
      } catch (err) {
        console.error('Greška pri dohvaćanju predmeta profesora:', err);
      }
    };

    const selectSubject = (predmet) => {
      selectedSubject.value = predmet;
      fetchQuizzesForSubject(predmet);
    };

    const goToAddQuiz = (predmet) => {
      router.push({ name: 'AddQuiz', query: { predmet } });
    };

    const goToQuiz = (id) => {
      router.push(`/quizzes/${id}`);
    };

    if (isProfesor.value) fetchProfesorPredmeti();

    return {
      predmeti,
      quizzes,
      solvedQuizzes,
      selectedSubject,
      isProfesor,
      mozeDodatiKviz,
      selectSubject,
      goToAddQuiz,
      goToQuiz
    };
  }
};
</script>





<style scoped>
.predmet-card {
  cursor: pointer;
  border: 2px solid #dce3ea;
  transition: 0.3s ease;
  border-radius: 12px;
}
.predmet-card:hover {
  background-color: #f8f9fa;
  transform: scale(1.03);
  border-color: #0d6efd;
}

.quiz-card {
  border-radius: 12px;
  transition: 0.3s ease;
}
.quiz-card:hover {
  transform: scale(1.02);
  background-color: #f5fcff;
}
</style>
