<template>
  <div class="container my-5">
    <div class="text-start mb-3">
      <router-link to="/home" class="btn btn-outline-primary">⬅ Natrag na početnu stranicu</router-link>
    </div>

    <h2 class="text-center mb-5 text-primary">🧠 Kvizovi po predmetima</h2>

    <!-- Popis predmeta -->
    <div v-if="!selectedSubject" class="row g-4">
      <div v-for="predmet in predmeti" :key="predmet" class="col-12 col-md-6 col-lg-4">
        <div class="card predmet-card shadow h-100" @click="selectSubject(predmet)">
          <div class="card-body text-center d-flex flex-column justify-content-center">
            <h5 class="card-title fw-bold text-secondary">{{ predmet }}</h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Kvizovi odabranog predmeta -->
    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="text-success">{{ selectedSubject }}</h3>
        <button
          v-if="mozeDodatiKviz"
          class="btn btn-primary"
          @click="goToAddQuiz(selectedSubject)"
        >+ Dodaj kviz</button>
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
                <p class="text-muted">{{ (quiz.pitanja && quiz.pitanja.length) || 0 }} pitanja</p>
                <p class="text-muted"><strong>Razred:</strong> {{ quiz.razred }}</p>
              </div>

              <!-- Učenik -->
              <button
                v-if="!isProfesor"
                class="btn btn-outline-success mt-3"
                @click="goToQuiz(quiz.id)"
              >
                {{ solvedQuizzes[quiz.id] ? '👁 Pogledaj riješeni kviz' : '▶ Riješi kviz' }}
              </button>

              <!-- Profesor -->
              <div v-else class="d-flex gap-2 mt-3">
                <button class="btn btn-outline-info" @click="goToQuiz(quiz.id)">👁 Pregled pitanja</button>
                <button class="btn btn-outline-danger" @click="removeQuiz(quiz)" title="Obriši kviz">🗑 Obriši</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../lib/api.js'  // koristi tvoj lib (bez localhosta)

export default {
  name: 'Quizzes',
  setup() {
    const predmeti = [
      'Psihologija', 'Načela poučavanja', 'Etika u sestrinstvu',
      'Anatomija i fiziologija', 'Bakteriologija, virologija i parazitologija', 'Biokemija',
      'Opća načela zdravlja i njege', 'Zdravstvena njega - opća',
      'Zdravstvena njega zdravog djeteta i adolescenta', 'Osnove fizikalne i radne terapije (izborni)',
      'Profesionalna komunikacija u sestrinstvu (izborni)', 'Sat razrednika'
    ]

    const quizzes = ref([])
    const solvedQuizzes = ref({})        // { [quizId]: true/false }
    const selectedSubject = ref(null)

    const router = useRouter()
    const user = JSON.parse(localStorage.getItem('user'))
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true')
    const profesorPredmeti = ref([])
    const razred = ref(user?.razred || null)

    const mozeDodatiKviz = computed(() =>
      isProfesor.value &&
      selectedSubject.value &&
      profesorPredmeti.value.includes(selectedSubject.value)
    )

    // ---- NOVO: dohvat rješenih kvizova u jednom potezu ----
    async function loadSolvedForUser() {
      if (!user?.id) {
        solvedQuizzes.value = {}
        return
      }
      try {
        const { data, status } = await api.get(`/api/v1/progress/${user.id}`, { validateStatus: () => true })
        const ids = status >= 200 && status < 300 ? (data?.solvedQuizIds || []) : []
        const map = {}
        for (const id of ids) map[id] = true
        solvedQuizzes.value = map
      } catch {
        solvedQuizzes.value = {}
      }
    }

    async function fetchQuizzesForSubject(predmet) {
      try {
        const { data, status } = await api.get(`/quizzes/subject/${encodeURIComponent(predmet)}`, { validateStatus: () => true })
        let list = status >= 200 && status < 300 ? (data || []) : []
        if (!isProfesor.value && razred.value) list = list.filter(k => k.razred === razred.value)
        quizzes.value = list

        // nakon što znamo koji su kvizovi vidljivi, označi koji su riješeni
        await loadSolvedForUser()
      } catch {
        quizzes.value = []
      }
    }

    async function fetchProfesorPredmeti() {
      if (!user?.id) return
      try {
        const { data, status } = await api.get(`/profesori/${user.id}`, { validateStatus: () => true })
        profesorPredmeti.value = status >= 200 && status < 300
          ? (data?.Subjects || []).map(s => s.naziv)
          : []
        localStorage.setItem('profesorPredmeti', JSON.stringify(profesorPredmeti.value))
      } catch {
        profesorPredmeti.value = []
      }
    }

    function selectSubject(predmet) {
      selectedSubject.value = predmet
      fetchQuizzesForSubject(predmet)
    }
    function goToAddQuiz(predmet) {
      router.push({ name: 'AddQuiz', query: { predmet } })
    }
    function goToQuiz(id) {
      router.push(`/quizzes/${id}`)
    }

    async function removeQuiz(quiz) {
      if (!isProfesor.value) return
      if (!confirm('Sigurno obrisati ovaj kviz?')) return
      const res = await api.delete(`/quizzes/${quiz.id}`, { validateStatus: () => true })
      if (res.status >= 200 && res.status < 300) {
        quizzes.value = quizzes.value.filter(q => q.id !== quiz.id)
        const copy = { ...solvedQuizzes.value }
        delete copy[quiz.id]
        solvedQuizzes.value = copy
      } else {
        alert('Greška: brisanje nije uspjelo.')
      }
    }

    if (isProfesor.value) fetchProfesorPredmeti()

    return {
      predmeti,
      quizzes,
      solvedQuizzes,
      selectedSubject,
      isProfesor,
      mozeDodatiKviz,
      selectSubject,
      goToAddQuiz,
      goToQuiz,
      removeQuiz
    }
  }
}
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


