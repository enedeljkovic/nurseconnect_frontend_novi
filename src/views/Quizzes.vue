<template>
  <div class="container my-5">

    <div class="text-start mb-3">
      <router-link to="/home" class="btn btn-outline-primary">
        ⬅ Natrag na početnu stranicu
      </router-link>
    </div>

    <h2 class="text-center mb-5 text-primary">🧠 Kvizovi po predmetima</h2>

    <!-- Odabir predmeta -->
    <div v-if="!selectedSubject" class="row g-4">
      <div v-for="predmet in predmeti" :key="predmet" class="col-12 col-md-6 col-lg-4">
        <div class="card predmet-card shadow h-100" @click="selectSubject(predmet)">
          <div class="card-body text-center d-flex flex-column justify-content-center">
            <h5 class="card-title fw-bold text-secondary">{{ predmet }}</h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista kvizova -->
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

              <!-- Učenik -->
              <button
                v-if="!isProfesor"
                class="btn btn-outline-success mt-3"
                @click="openQuiz(quiz)"
              >
                {{ solvedQuizzes[quiz.id] ? '👁 Pogledaj riješeni kviz' : '▶ Riješi kviz' }}
              </button>

              <!-- Profesor -->
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
    const solvedQuizzes = ref({}) // { [quizId]: true }
    const selectedSubject = ref(null)
    const router = useRouter()

    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true')
    const profesorPredmeti = ref([])
    const razred = ref(user?.razred || null)

    const mozeDodatiKviz = computed(() =>
      isProfesor.value && selectedSubject.value && profesorPredmeti.value.includes(selectedSubject.value)
    )

    // ✅ helper: probaj /api/v1 pa legacy
    async function getEither(v1Path, legacyPath) {
      try {
        return await api.get(v1Path)
      } catch (e) {
        if (e?.response?.status === 404) return await api.get(legacyPath)
        throw e
      }
    }

    async function fetchQuizzesForSubject(predmet) {
      try {
        const { data } = await getEither(
          `/api/v1/quizzes/subject/${encodeURIComponent(predmet)}`,
          `/quizzes/subject/${encodeURIComponent(predmet)}`
        )
        let all = data || []
        if (!isProfesor.value && razred.value) {
          all = all.filter(k => k.razred === razred.value)
        }
        quizzes.value = all
        await checkSolvedForStudent(all.map(q => q.id)) // ✅ punimo mapu riješenih
      } catch (e) {
        console.error('Greška pri dohvaćanju kvizova:', e)
      }
    }

    // ✅ NOVO: masovno dohvaćanje riješenih preko /progress/:studentId
    async function checkSolvedForStudent(quizIds) {
      solvedQuizzes.value = {}
      if (!user?.id || isProfesor.value) return

      try {
        const { data } = await getEither(
          `/api/v1/progress/${user.id}`,
          `/api/v1/progress/${user.id}` // imaš samo v1, ali ostavljam format
        )
        const solvedIds = new Set(data?.solvedQuizIds || [])
        for (const id of quizIds) {
          solvedQuizzes.value[id] = solvedIds.has(id)
        }
        // fallback: ako ništa nije vraćeno, probaj stare per-kviz rute
        if ([...solvedIds].length === 0) {
          await fallbackPerQuizSolved(quizIds)
        }
      } catch (e) {
        // ako progress nije dostupan, per-kviz fallback
        await fallbackPerQuizSolved(quizIds)
      }
    }

    // ✅ fallback na stare rute /quizzes/:id/solved/:studentId i /solved/:studentId/:id
    async function fallbackPerQuizSolved(quizIds) {
      for (const id of quizIds) {
        try {
          let r
          try {
            r = await getEither(
              `/api/v1/quizzes/${id}/solved/${user.id}`,
              `/quizzes/${id}/solved/${user.id}`
            )
          } catch {
            r = await getEither(
              `/api/v1/solved/${user.id}/${id}`,
              `/solved/${user.id}/${id}`
            )
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
        const { data } = await getEither(
          `/api/v1/profesori/${user.id}`,
          `/profesori/${user.id}`
        )
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

    // ✅ otvaranje kviza s dodatnim „safety checkom” za učenika
    async function openQuiz(quiz, forceMode = null) {
      // Profesor – uvijek preview
      if (isProfesor.value || forceMode === 'preview') {
        router.push({ path: `/quizzes/${quiz.id}`, query: { mode: 'preview' } })
        return
      }

      // ako već znamo da je riješen → review
      if (solvedQuizzes.value[quiz.id]) {
        router.push({ path: `/quizzes/${quiz.id}`, query: { mode: 'review' } })
        return
      }

      // brzi check na /progress (kako gumb ne bi lagao ni u rubnim slučajevima)
      try {
        const { data } = await getEither(
          `/api/v1/progress/${user.id}`,
          `/api/v1/progress/${user.id}`
        )
        const solvedIds = new Set(data?.solvedQuizIds || [])
        if (solvedIds.has(quiz.id)) {
          solvedQuizzes.value[quiz.id] = true
          router.push({ path: `/quizzes/${quiz.id}`, query: { mode: 'review' } })
          return
        }
      } catch { /* ignoriši – idemo na solve */ }

      // inače – rješavanje
      router.push({ path: `/quizzes/${quiz.id}` })
    }

    if (isProfesor.value) fetchProfesorPredmeti()

    async function removeQuiz(quiz) {
      if (!isProfesor.value) return
      if (!confirm('Sigurno obrisati ovaj kviz?')) return
      try {
        await getEither(
          `/api/v1/quizzes/${quiz.id}`,
          `/quizzes/${quiz.id}`
        ) // provjera postojanja (opcionalno)
        await api.delete(`/quizzes/${quiz.id}`) // legacy delete ako koristiš bez v1
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
