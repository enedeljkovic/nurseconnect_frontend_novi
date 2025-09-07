<template>
  <div class="container my-5">
    <div class="text-start mb-3">
      <router-link to="/quizzes" class="btn btn-outline-primary">⬅ Natrag</router-link>
    </div>

    <div v-if="loading" class="alert alert-info">Učitavanje…</div>

    <div v-else-if="!quiz" class="alert alert-danger">Kviz nije pronađen.</div>

    <div v-else class="card shadow p-4">
      <h2 class="mb-4 text-primary">{{ quiz.naziv }}</h2>

      <!-- 👨‍🏫 Pregled za profesore -->
      <div v-if="isProfesor">
        <h4 class="text-info">👨‍🏫 Pregled kviza za profesore</h4>
        <div v-for="(p, i) in quiz.pitanja" :key="qKey(p, i)" class="mb-4">
          <h6 class="fw-bold">{{ i + 1 }}. {{ p.question }}</h6>

          <div v-if="p.type === 'hotspot' && p.image">
            <img :src="p.image" class="img-fluid mb-2" style="max-width:500px" />
            <p class="text-muted">Točne točke su definirane pri izradi kviza.</p>
          </div>

          <div v-else-if="p.type === 'image-choice'">
            <div class="d-flex gap-2 flex-wrap">
              <img v-for="opt in (p.options||[])" :key="opt.value ?? opt.url"
                   :src="opt.url" class="img-thumbnail" style="width:100px;" />
            </div>
            <p>✅ Točne slike: {{ formatOdgovor(p.correct) }}</p>
          </div>

          <div v-else-if="p.image">
            <img :src="p.image" class="img-fluid mb-2" style="max-width:500px" />
            <p>✅ Točan odgovor: {{ formatOdgovor(p.correct) }}</p>
          </div>

          <p v-else-if="p.type === 'truefalse'">
            ✅ Točan odgovor: {{ p.correct === 'T' ? 'Točno' : 'Netočno' }}
          </p>

          <p v-else>
            ✅ Točan odgovor: {{ formatOdgovor(p.correct) }}
          </p>
        </div>
      </div>

    
      <div v-else-if="alreadySolved && rezultat.length">
        <h4 class="text-success">✅ Već si riješio ovaj kviz!</h4>
        <p class="fw-bold">
          Točno odgovoreno: {{ brojTocnih }}/{{ rezultat.length }} ({{ postotak }}%)
        </p>

        <div v-for="(p, i) in quiz.pitanja" :key="qKey(p, i)" class="mb-4">
          <h6 class="fw-bold">{{ i + 1 }}. {{ p.question }}</h6>

          <div v-if="(p.type === 'image' || p.type === 'hotspot') && p.image">
            <img :src="p.image" class="img-fluid mb-2" style="max-width:500px;" />
          </div>

          <p>
            Tvoj odgovor:
            <span :class="{'text-success': rezultat[i], 'text-danger': !rezultat[i]}">
              {{ formatOdgovor(odgovori[i]) }}
            </span>
          </p>
          <p v-if="!rezultat[i]" class="text-info">
            ✅ Točan odgovor: {{ formatOdgovor(p.correct) }}
          </p>
        </div>
      </div>

      <form v-else @submit.prevent="submitAnswers">
        <div v-for="(p, i) in quiz.pitanja" :key="qKey(p, i)" class="mb-4 border rounded p-3">
          <p class="fw-bold">{{ i + 1 }}. {{ p.question }}</p>

          <div v-if="p.type === 'multiple' || p.type === 'image'">
            <label class="form-check" v-for="(opt, oi) in (p.options || [])" :key="optKey(opt, oi)">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="odgovori[i]"               
                :value="optKey(opt, oi)"            
              />
              <span class="form-check-label">
                {{ opt.text ?? opt.tekst ?? opt }}
              </span>
            </label>
          </div>

          <div v-else-if="p.type === 'truefalse'">
            <label class="form-check">
              <input
                class="form-check-input"
                type="radio"
                :name="`q-${qKey(p, i)}`"
                v-model="odgovori[i]"
                :value="'T'"
              />
              <span class="form-check-label">Točno</span>
            </label>
            <label class="form-check">
              <input
                class="form-check-input"
                type="radio"
                :name="`q-${qKey(p, i)}`"
                v-model="odgovori[i]"
                :value="'N'"
              />
              <span class="form-check-label">Netočno</span>
            </label>
          </div>

          <div v-else-if="p.type === 'image-choice'">
            <div class="d-flex gap-2 flex-wrap">
              <img
                v-for="opt in (p.options || [])"
                :key="opt.value ?? opt.url"
                :src="opt.url"
                class="img-thumbnail"
                style="width:120px; cursor:pointer"
                :class="{ 'border border-success': (odgovori[i] || []).includes(opt.value) }"
                @click="toggleImageChoice(i, opt.value)"
              />
            </div>
          </div>

          <div v-else-if="p.type === 'hotspot' && p.image">
            <div class="position-relative d-inline-block" @click="handleHotspotClick($event, i)">
              <img :src="p.image" class="img-fluid" style="max-width:500px; cursor:crosshair;" />
              <div
                v-if="odgovori[i]"
                class="position-absolute bg-primary rounded-circle"
                :style="{
                  width: hotspotRadius * 2 + 'px',
                  height: hotspotRadius * 2 + 'px',
                  top: odgovori[i].y - hotspotRadius + 'px',
                  left: odgovori[i].x - hotspotRadius + 'px',
                  border: '2px solid white'
                }"
              ></div>
            </div>
          </div>

          <div v-else class="text-muted">Nepodržan tip: {{ p.type }}</div>
        </div>

        <button type="submit" class="btn btn-success w-100 mt-3">Pošalji odgovore</button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../lib/api.js'

export default {
  name: 'TakeQuiz',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const quizId = Number(route.params.id)

    const quiz = ref(null)
    const loading = ref(true)

    const odgovori = ref([])    
    const rezultat = ref([])    
    const alreadySolved = ref(false)

    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const hotspotRadius = 20
    const startedAt = Date.now()

    const brojTocnih = computed(() => rezultat.value.filter(Boolean).length)
    const postotak = computed(() =>
      rezultat.value.length ? Math.round((brojTocnih.value / rezultat.value.length) * 100) : 0
    )

    const qKey = (q, i) => String(q.id ?? `i${i}`)
    const optKey = (opt, i) => opt?.value ?? opt?.id ?? opt ?? i

    async function fetchQuiz() {
      try {
       
        const q = await api.get(`/api/v1/quizzes/${quizId}`)
        quiz.value = q.data

        
        odgovori.value = quiz.value.pitanja.map((p) => {
          if (p.type === 'multiple' || p.type === 'image' || p.type === 'image-choice') return []
          if (p.type === 'truefalse') return null
          if (p.type === 'hotspot') return null
          return null
        })

        
        if (isProfesor.value) return

      
        try {
          let r
          try {
            r = await api.get(`/api/v1/quizzes/${quizId}/solved/${user.id}`)
          } catch {
            r = await api.get(`/api/v1/solved/${user.id}/${quizId}`)
          }
          if (r?.data?.solved && Array.isArray(r.data.rezultat)) {
            alreadySolved.value = true
            rezultat.value = r.data.rezultat
          
            if (Array.isArray(r.data.odgovori)) {
              odgovori.value = r.data.odgovori
            } else {
             
              odgovori.value = quiz.value.pitanja.map(p => p.correct)
            }
          }
        } catch {
          
        }
      } catch (err) {
        console.error('Greška pri dohvaćanju kviza:', err)
      } finally {
        loading.value = false
      }
    }

    async function submitAnswers() {
      try {
        if (isProfesor.value) return 
       
        const check = await api.post(`/api/v1/quizzes/${quizId}/check-answers`, {
          odgovori: odgovori.value,
          studentId: user.id
        })
        rezultat.value = check.data?.rezultat || []

        
        const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
        const payload = {
          studentId: user.id,
          result: brojTocnih.value,
          total: rezultat.value.length || (quiz.value?.pitanja?.length ?? 0),
          durationSec
        }
        try {
          await api.post(`/api/v1/quizzes/${quizId}/spremi-rezultat`, payload)
        } catch (e) {
         
          console.debug('Spremanje rezultata nije uspjelo (OK ako ruta ne postoji):', e?.response?.status)
        }

        
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

    function toggleImageChoice(qi, val) {
      if (!Array.isArray(odgovori.value[qi])) odgovori.value[qi] = []
      const idx = odgovori.value[qi].indexOf(val)
      if (idx >= 0) odgovori.value[qi].splice(idx, 1)
      else odgovori.value[qi].push(val)
    }

    function handleHotspotClick(ev, qi) {
      const rect = ev.currentTarget.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      odgovori.value[qi] = { x, y }
    }

    function formatOdgovor(odg) {
      if (Array.isArray(odg)) return odg.join(', ')
      if (typeof odg === 'object' && odg?.x != null && odg?.y != null)
        return `(${Math.round(odg.x)}, ${Math.round(odg.y)})`
      if (odg === 'T') return 'Točno'
      if (odg === 'N') return 'Netočno'
      return odg
    }

    onMounted(fetchQuiz)

    return {
      quiz,
      loading,
      isProfesor,

      odgovori,
      rezultat,
      alreadySolved,

      brojTocnih,
      postotak,

      submitAnswers,
      toggleImageChoice,
      handleHotspotClick,

      hotspotRadius,

      qKey,
      optKey,
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

