<template>
  <div class="container my-5">

    <div class="text-start mb-3">
      <router-link to="/home" class="btn btn-outline-primary">
        ⬅ Natrag na početnu stranicu
      </router-link>
    </div>

    <h2 class="text-center mb-5 text-primary">🧠 Kvizovi po predmetima</h2>

 
    <div v-if="!selectedSubject" class="row g-4">
      <div v-for="predmet in predmeti" :key="predmet" class="col-12 col-md-6 col-lg-4">
        <div class="card predmet-card shadow h-100" @click="selectSubject(predmet)">
          <div class="card-body text-center d-flex flex-column justify-content-center">
            <h5 class="card-title fw-bold text-secondary">{{ predmet }}</h5>
          </div>
        </div>
      </div>
    </div>

 
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
                <p class="text-muted">{{ (quiz.pitanja && quiz.pitanja.length) || 0 }} pitanja</p>
                <p class="text-muted"><strong>Razred:</strong> {{ quiz.razred }}</p>
              </div>

              
              <button
                v-if="!isProfesor"
                class="btn btn-outline-success mt-3"
                @click="openQuiz(quiz)"
              >
                {{ solvedQuizzes[quiz.id] ? '👁 Pogledaj riješeni kviz' : '▶ Riješi kviz' }}
              </button>

            
              <div v-else class="d-flex gap-2 mt-3">
                <button class="btn btn-outline-info" @click="openQuiz(quiz, 'preview')">
                  👁 Pregled pitanja
                </button>
                <button class="btn btn-outline-danger" @click="removeQuiz(quiz)" title="Obriši kviz">
                  🗑 Obriši
                </button>
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
import api from '../lib/api.js'

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
    const solvedQuizzes = ref({})
    const selectedSubject = ref(null)
    const router = useRouter()

    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true')
    const profesorPredmeti = ref([])
    const razred = ref(user?.razred || null)

    const mozeDodatiKviz = computed(() =>
      isProfesor.value && selectedSubject.value && profesorPredmeti.value.includes(selectedSubject.value)
    )

    async function fetchQuizzesForSubject(predmet) {
      try {
        const { data } = await api.get(`/quizzes/subject/${encodeURIComponent(predmet)}`)
        let all = data || []
        if (!isProfesor.value && razred.value) {
          all = all.filter(k => k.razred === razred.value)
        }
        quizzes.value = all
        await checkSolvedQuizzes(all.map(q => q.id))
      } catch (e) {
        console.error('Greška pri dohvaćanju kvizova:', e)
      }
    }

    
    async function checkSolvedQuizzes(quizIds) {
      solvedQuizzes.value = {}
      if (!user?.id || isProfesor.value) return
      for (const id of quizIds) {
        try {
          let r
          try {
            r = await api.get(`/quizzes/${id}/solved/${user.id}`)
          } catch {
            r = await api.get(`/solved/${user.id}/${id}`)
          }
          solvedQuizzes.value[id] = !!r?.data?.solved
        } catch {
          solvedQuizzes.value[id] = false
        }
      }
    }

    async function fetchProfesorPredmeti() {
      if (!user?.id) return
      try {
        const { data } = await api.get(`/profesori/${user.id}`)
        profesorPredmeti.value = (data?.Subjects || []).map(s => s.naziv)
        localStorage.setItem('profesorPredmeti', JSON.stringify(profesorPredmeti.value))
      } catch (e) {
        console.error('Greška pri dohvaćanju predmeta profesora:', e)
      }
    }

    function selectSubject(predmet) {
      selectedSubject.value = predmet
      fetchQuizzesForSubject(predmet)
    }

    function goToAddQuiz(predmet) {
      router.push({ name: 'AddQuiz', query: { predmet } })
    }

   
    function openQuiz(quiz, forceMode = null) {
     
      if (isProfesor.value || forceMode === 'preview') {
        router.push({ path: `/quizzes/${quiz.id}`, query: { mode: 'preview' } })
        return
      }
     
      if (solvedQuizzes.value[quiz.id]) {
        router.push({ path: `/quizzes/${quiz.id}`, query: { mode: 'review' } })
      } else {
        router.push({ path: `/quizzes/${quiz.id}` })
      }
    }

    if (isProfesor.value) fetchProfesorPredmeti()

    async function removeQuiz(quiz) {
      if (!isProfesor.value) return
      if (!confirm('Sigurno obrisati ovaj kviz?')) return
      try {
        await api.delete(`/quizzes/${quiz.id}`)
        quizzes.value = quizzes.value.filter(q => q.id !== quiz.id)
      } catch (e) {
        console.error('Greška pri brisanju kviza:', e)
        alert('Greška: brisanje nije uspjelo.')
      }
    }

    return {
      predmeti,
      quizzes,
      solvedQuizzes,
      selectedSubject,
      isProfesor,
      mozeDodatiKviz,
      selectSubject,
      goToAddQuiz,
      openQuiz,
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
