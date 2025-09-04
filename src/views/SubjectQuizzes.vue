<template>
  <div class="container my-5">
    <h2 class="text-center mb-4">{{ predmet }} - kvizovi</h2>

   
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
          
          <button
            v-if="!isProfesor"
            class="btn btn-outline-success"
            @click="rjesiKviz(quiz.id)"
          >
            Riješi kviz
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
    const predmet = decodeURIComponent(route.params.subject || route.params.predmet || '');
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true');

    
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const API_BASE = 'http://localhost:3001'; 

    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(`${API_BASE}/quizzes?predmet=${encodeURIComponent(predmet)}`);
        quizzes.value = res.data;
      } catch (error) {
        console.error('Greška pri dohvaćanju kvizova:', error);
      }
    };

    const dodajNoviKviz = () => {
      router.push(`/add-quiz?predmet=${encodeURIComponent(predmet)}`);
    };

    const rjesiKviz = (id) => {
      router.push(`/quizzes/${id}`);
    };

  
    const removeQuiz = async (quiz) => {
      if (!confirm('Sigurno obrisati ovaj kviz?')) return;
      try {
        await axios.delete(`${API_BASE}/quizzes/${quiz.id}`, {
         
          data: { profesorId: user?.id }
        });
       
        quizzes.value = quizzes.value.filter(q => q.id !== quiz.id);
      } catch (err) {
        console.error('Greška pri brisanju kviza:', err);
        alert('Greška: brisanje nije uspjelo.');
      }
    };

    onMounted(fetchQuizzes);

    return { quizzes, predmet, rjesiKviz, dodajNoviKviz, isProfesor, removeQuiz };
  }
};
</script>
