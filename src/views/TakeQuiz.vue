<template>
  <div class="container my-5">
    <div v-if="quiz" class="card shadow p-4">
      <h2 class="mb-4 text-primary">{{ quiz.naziv }}</h2>

      <div v-if="isProfesor">
        <h4 class="text-info">👨‍🏫 Pregled kviza za profesore</h4>
        <div v-for="(pitanje, index) in quiz.pitanja" :key="index" class="mb-4">
          <h6 class="fw-bold">{{ index + 1 }}. {{ pitanje.question }}</h6>
          <div v-if="pitanje.type === 'hotspot' && pitanje.image">
            <img :src="pitanje.image" class="img-fluid mb-2" style="max-width:500px" />
            <p class="text-muted">Točne točke su označene tijekom izrade kviza.</p>
          </div>
          <div v-else-if="pitanje.type === 'image-choice'">
            <div class="d-flex gap-2 flex-wrap">
              <img v-for="opt in pitanje.options" :key="opt.value" :src="opt.url" class="img-thumbnail" style="width:100px;" />
            </div>
            <p>✅ Točne slike: {{ formatOdgovor(pitanje.correct) }}</p>
          </div>
          <div v-else-if="pitanje.image">
            <img :src="pitanje.image" class="img-fluid mb-2" style="max-width:500px" />
            <p>✅ Točan odgovor: {{ formatOdgovor(pitanje.correct) }}</p>
          </div>
          <p v-if="pitanje.type === 'truefalse'">✅ Točan odgovor: {{ pitanje.correct === 'T' ? 'Točno' : 'Netočno' }}</p>
          <p v-else-if="!pitanje.image && pitanje.type !== 'image-choice' && pitanje.type !== 'hotspot'">
            ✅ Točan odgovor: {{ formatOdgovor(pitanje.correct) }}
          </p>
        </div>
      </div>

      <div v-else-if="alreadySolved && rezultat.length">
        <h4 class="text-success">✅ Već si riješio ovaj kviz!</h4>
        <p class="fw-bold">
          Točno odgovoreno: {{ brojTocnih }}/{{ rezultat.length }} ({{ postotak }}%)
        </p>
        <div v-for="(pitanje, index) in quiz.pitanja" :key="index" class="mb-4">
          <h6 class="fw-bold">{{ index + 1 }}. {{ pitanje.question }}</h6>

          <div v-if="(pitanje.type === 'image' || pitanje.type === 'hotspot') && pitanje.image">
            <img :src="pitanje.image" class="img-fluid mb-2" style="max-width:500px;" />
          </div>

          <p>
            Tvoj odgovor:
            <span :class="{'text-success': rezultat[index], 'text-danger': !rezultat[index]}">
              {{ formatOdgovor(odgovori[index]) }}
            </span>
          </p>
          <p v-if="!rezultat[index]" class="text-info">
            ✅ Točan odgovor: {{ formatOdgovor(pitanje.correct) }}
          </p>
        </div>
      </div>

      <form v-else @submit.prevent="submitAnswers">
        <div v-for="(pitanje, index) in quiz.pitanja" :key="index" class="mb-4 border rounded p-3">
          <p class="fw-bold">{{ index + 1 }}. {{ pitanje.question }}</p>

          

          <div v-if="pitanje.type === 'multiple' || pitanje.type === 'image'">
            <div v-for="(opcija, i) in pitanje.options" :key="i" class="form-check">
              <input class="form-check-input" type="checkbox" :value="opcija" v-model="odgovori[index]" />
              <label class="form-check-label">{{ opcija }}</label>
            </div>
          </div>

          <div v-else-if="pitanje.type === 'truefalse'">
            <div class="form-check">
              <input class="form-check-input" type="radio" :value="'T'" v-model="odgovori[index]" />
              <label class="form-check-label">Točno</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" :value="'N'" v-model="odgovori[index]" />
              <label class="form-check-label">Netočno</label>
            </div>
          </div>

          <div v-else-if="pitanje.type === 'image-choice'">
            <div class="d-flex gap-2 flex-wrap">
              <img
                v-for="opt in pitanje.options"
                :key="opt.value"
                :src="opt.url"
                class="img-thumbnail"
                style="width:120px; cursor:pointer"
                :class="{ 'border border-success': odgovori[index]?.includes(opt.value) }"
                @click="toggleImageChoice(index, opt.value)"
              />
            </div>
          </div>

<div v-else-if="pitanje.type === 'hotspot' && pitanje.image">
  <div
    class="position-relative d-inline-block"
    @click="handleHotspotClick($event, index)"
  >
    <img
      :src="pitanje.image"
      class="img-fluid"
      style="max-width:500px; cursor:crosshair;"
    />
    <div
      v-if="odgovori[index]"
      class="position-absolute bg-primary rounded-circle"
      :style="{
        width: hotspotRadius * 2 + 'px',
        height: hotspotRadius * 2 + 'px',
        top: odgovori[index].y - hotspotRadius + 'px',
        left: odgovori[index].x - hotspotRadius + 'px',
        border: '2px solid white'
      }"
    ></div>
  </div>
</div>


        </div>

        <button type="submit" class="btn btn-success w-100 mt-3">Pošalji odgovore</button>
      </form>
    </div>
  </div>
</template>


<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '../lib/api.js' // KORISTI JEDAN KLIJENT

export default {
  name: 'TakeQuiz',
  setup () {
    const route = useRoute()
    const quizId = Number(route.params.id)

    const quiz = ref(null)
    const odgovori = ref([])
    const rezultat = ref([])
    const alreadySolved = ref(false)

    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // mjerenje trajanja
    let startTs = Date.now()

    // helper: provjera “riješeno već”
    async function fetchSolvedFallback(quizId, studentId) {
      // 1) nova ruta
      try {
        return await api.get(`/quizzes/${quizId}/solved/${studentId}`)
      } catch (e) {
        if (e?.response?.status !== 404) throw e
      }
      // 2) stara ruta (ako postoji na tvojoj instanci)
      return await api.get(`/solved/${studentId}/${quizId}`)
    }

    // dohvat kviza + provjera je li već riješen
    const fetchQuiz = async () => {
      try {
        const q = await api.get(`/quizzes/${quizId}`)
        quiz.value = q.data

        if (!isProfesor.value) {
          try {
            const solved = await fetchSolvedFallback(quizId, user.id)
            if (solved?.data?.solved) {
              alreadySolved.value = true
              rezultat.value = solved.data.rezultat || []
              // pokaži točne odgovore
              odgovori.value = (quiz.value.pitanja || []).map(p => p.correct)
              return
            }
          } catch (e) {
            // ako 404, nastavljamo kao da nije riješeno
            if (e?.response?.status !== 404) {
              console.error('Greška provjere riješenosti:', e)
            }
          }

          // inicijalna struktura odgovora
          odgovori.value = (quiz.value.pitanja || []).map(p => {
            if (p.type === 'truefalse') return ''
            if (p.type === 'hotspot') return null
            return [] // multiple/single
          })
        }

        // reset starta mjerenja
        startTs = Date.now()
      } catch (err) {
        console.error('Greška pri dohvaćanju kviza:', err)
      }
    }

    // slanje odgovora + fallback ruta
    const submitAnswers = async () => {
      const payload = {
        odgovori: odgovori.value,
        studentId: user.id,
        durationSec: Math.round((Date.now() - startTs) / 1000) || null,
        // perQuestionMs može ostati null ako ga ne mjeriš po pitanju
        perQuestionMs: null
      }

      try {
        let res
        try {
          // 1) glavna ruta
          res = await api.post(`/quizzes/${quizId}/check-answers`, payload)
        } catch (e) {
          if (e?.response?.status !== 404) throw e
          // 2) eventualni prefiks ako si negdje u proxyju koristio /api/v1
          res = await api.post(`/api/v1/quizzes/${quizId}/check-answers`, payload)
        }

        rezultat.value = res.data?.rezultat || []
        alreadySolved.value = true
      } catch (err) {
        if (err?.response?.status === 403) {
          alert('❌ Dosegnut je maksimalan broj pokušaja.')
        } else {
          console.error('Greška pri slanju odgovora:', err)
          alert('Greška pri slanju odgovora.')
        }
      }
    }

    // pomoćne funkcije za UI
    const toggleImageChoice = (qi, val) => {
      if (!Array.isArray(odgovori.value[qi])) odgovori.value[qi] = []
      const i = odgovori.value[qi].indexOf(val)
      if (i >= 0) odgovori.value[qi].splice(i, 1)
      else odgovori.value[qi].push(val)
    }

    const handleHotspotClick = (ev, qi) => {
      const rect = ev.currentTarget.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      odgovori.value[qi] = { x, y }
    }

    const brojTocnih = computed(() => rezultat.value.filter(Boolean).length)
    const postotak = computed(() =>
      rezultat.value.length
        ? Math.round((brojTocnih.value / rezultat.value.length) * 100)
        : 0
    )

    const formatOdgovor = (odg) => {
      if (Array.isArray(odg)) return odg.join(', ')
      if (odg && typeof odg === 'object' && odg.x != null && odg.y != null) {
        return `(${Math.round(odg.x)}, ${Math.round(odg.y)})`
      }
      return odg
    }

    onMounted(fetchQuiz)

    return {
      quiz,
      odgovori,
      rezultat,
      alreadySolved,
      brojTocnih,
      postotak,
      submitAnswers,
      formatOdgovor,
      isProfesor,
      toggleImageChoice,
      handleHotspotClick
    }
  }
}
</script>







<style scoped>
.take-quiz-page {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  background-color: #fefefe;
  border-radius: 10px;
}

.quiz-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #0077b6;
}

.question-card {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #d6e9f8;
  border-radius: 10px;
  background-color: #f0f9ff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.question-text {
  font-weight: bold;
  margin-bottom: 1rem;
}

.results {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
</style>

