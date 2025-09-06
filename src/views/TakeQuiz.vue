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
import api from '../lib/api.js'   // ⬅ koristi lib, nema localhosta

export default {
  name: 'TakeQuiz',
  setup() {
    const route = useRoute()
    const quizId = Number(route.params.id)
    const quiz = ref(null)
    const odgovori = ref([])
    const rezultat = ref([])
    const alreadySolved = ref(false)

    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // mjerenje trajanja i vremena po pitanju
    const startTs = Date.now()
    const perQuestionMs = ref([])     // [ms, ms, ...]
    const qStart = ref(null)

    function markQuestionStart() { qStart.value = Date.now() }
    function markQuestionEnd(index) {
      if (qStart.value != null) {
        const ms = Date.now() - qStart.value
        perQuestionMs.value[index] = (perQuestionMs.value[index] || 0) + ms
        qStart.value = null
      }
    }

    async function getQuiz() {
      try {
        const res = await api.get(`/quizzes/${quizId}`)
        quiz.value = res.data

        // inicijalizacija odgovora
        odgovori.value = quiz.value.pitanja.map(p => {
          if (p.type === 'truefalse') return ''
          if (p.type === 'hotspot')   return null
          return []
        })

        // ako je učenik, provjeri je li već rješavao (probaj obje rute)
        if (!isProfesor.value && user?.id) {
          try {
            const s1 = await api.get(`/solved/${user.id}/${quizId}`)
            if (s1.data?.solved) {
              alreadySolved.value = true
              rezultat.value = s1.data.rezultat || []
              odgovori.value = quiz.value.pitanja.map(p => p.correct)
            }
          } catch (e1) {
            // fallback na staru rutu
            try {
              const s2 = await api.get(`/quizzes/${quizId}/solved/${user.id}`)
              if (s2.data?.alreadySolved) {
                alreadySolved.value = true
                rezultat.value = s2.data.rezultat || []
                odgovori.value = (s2.data.quiz?.pitanja || []).map(p => p.correct)
              }
            } catch (e2) {
              console.warn('Provjera riješenosti: ni jedna ruta ne postoji (još).', e2)
            }
          }
        }

        markQuestionStart()
      } catch (err) {
        console.error('Greška pri dohvaćanju kviza:', err)
      }
    }

    async function submitAnswers() {
      try {
        // zatvori mjerenje zadnjeg pitanja
        markQuestionEnd(Math.max(0, (quiz.value?.pitanja?.length || 1) - 1))

        const payload = {
          odgovori: odgovori.value,
          studentId: user?.id,
          durationSec: Math.round((Date.now() - startTs) / 1000),
          perQuestionMs: perQuestionMs.value
        }

        // prvo probaj bez /api/v1, pa fallback na /api/v1
        try {
          const res = await api.post(`/quizzes/${quizId}/check-answers`, payload)
          rezultat.value = res.data.rezultat || []
          alreadySolved.value = true
        } catch (e1) {
          // ako backend ipak ima prefiksan API
          const res = await api.post(`/api/v1/quizzes/${quizId}/check-answers`, payload)
          rezultat.value = res.data.rezultat || []
          alreadySolved.value = true
        }
      } catch (err) {
        if (err?.response?.status === 403) {
          alert('❌ Dosegnut je maksimalan broj pokušaja.')
        } else {
          console.error('Greška pri slanju odgovora:', err)
        }
      }
    }

    // helperi za UI
    const brojTocnih = computed(() => rezultat.value.filter(Boolean).length)
    const postotak = computed(() =>
      rezultat.value.length ? Math.round((brojTocnih.value / rezultat.value.length) * 100) : 0
    )

    function toggleImageChoice(qi, val) {
      if (!Array.isArray(odgovori.value[qi])) odgovori.value[qi] = []
      const i = odgovori.value[qi].indexOf(val)
      if (i >= 0) odgovori.value[qi].splice(i, 1)
      else odgovori.value[qi].push(val)
      // brojimo vrijeme ovog pitanja
      markQuestionEnd(qi)
      markQuestionStart()
    }

    function handleHotspotClick(ev, qi) {
      const rect = ev.currentTarget.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      odgovori.value[qi] = { x, y }
      markQuestionEnd(qi)
      markQuestionStart()
    }

    function formatOdgovor(odg) {
      if (Array.isArray(odg)) return odg.join(', ')
      if (odg && typeof odg === 'object' && odg.x != null && odg.y != null)
        return `(${Math.round(odg.x)}, ${Math.round(odg.y)})`
      return odg ?? ''
    }

    onMounted(getQuiz)

    return {
      quiz,
      odgovori,
      rezultat,
      alreadySolved,
      brojTocnih,
      postotak,
      submitAnswers,
      toggleImageChoice,
      handleHotspotClick,
      formatOdgovor
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




