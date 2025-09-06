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
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'TakeQuiz',
  setup() {
    const route = useRoute();
    const router = useRouter();

    // --- ID zaštita ---
    const idParam = route.params.id;
    const quizId = Number(idParam);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      alert('Neispravan ID kviza.');
      router.replace('/quizzes');
    }

    const quiz = ref(null);
    const odgovori = ref([]);
    const rezultat = ref([]);
    const alreadySolved = ref(false);
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Baza backenda (ako imaš VITE_API_BASE_URL koristi njega)
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL ||
      'https://nurseconnect-backend-novi.onrender.com';

    // helper: GET s fallbackom na /api/v1
    async function getWithFallback(path) {
      const url1 = `${API_BASE}${path}`;
      console.log('[GET]', url1);
      try {
        return await axios.get(url1);
      } catch (e) {
        if (e?.response?.status === 404) {
          const url2 = `${API_BASE}/api/v1${path}`;
          console.log('[GET fallback]', url2);
          return await axios.get(url2);
        }
        throw e;
      }
    }

    // helper: POST s fallbackom na /api/v1
    async function postWithFallback(path, body) {
      const url1 = `${API_BASE}${path}`;
      console.log('[POST]', url1, body);
      try {
        return await axios.post(url1, body);
      } catch (e) {
        if (e?.response?.status === 404) {
          const url2 = `${API_BASE}/api/v1${path}`;
          console.log('[POST fallback]', url2, body);
          return await axios.post(url2, body);
        }
        throw e;
      }
    }

    // mjerenje trajanja
    const startTime = Date.now();
    const perQuestionMs = ref([]); // može ostati prazno; backend prima null

    const fetchQuiz = async () => {
      try {
        // 1) Dohvati kviz
        const q = await getWithFallback(`/quizzes/${quizId}`);
        quiz.value = q.data;

        // 2) Ako je učenik, provjeri je li već rješavao
        if (!isProfesor.value && user?.id) {
          try {
            const solved = await getWithFallback(`/solved/${user.id}/${quizId}`);
            if (solved.data?.solved) {
              alreadySolved.value = true;
              rezultat.value = solved.data.rezultat || [];
              // pokaži točne odgovore za pregled
              odgovori.value = (quiz.value.pitanja || []).map(p => p.correct);
              return;
            }
          } catch (e) {
            // 404 za /solved nije kritičan—samo znači da nema zapisa
            if (e?.response?.status !== 404) throw e;
          }
        }

        // 3) Inicijaliziraj prazne odgovore
        odgovori.value = (quiz.value.pitanja || []).map(p => {
          if (p.type === 'truefalse') return '';
          if (p.type === 'hotspot') return null;
          return [];
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          alert('Kviz nije pronađen ili je obrisan.');
          return router.replace('/quizzes');
        }
        console.error('Greška pri dohvaćanju kviza:', err);
        alert('Ne mogu dohvatiti kviz. Pokušaj ponovno.');
        router.replace('/quizzes');
      }
    };

    const submitAnswers = async () => {
      try {
        const durationSec = Math.round((Date.now() - startTime) / 1000);
        const body = {
          odgovori: odgovori.value,
          studentId: user?.id,
          durationSec,
          perQuestionMs: perQuestionMs.value?.length ? perQuestionMs.value : null,
        };
        const res = await postWithFallback(`/quizzes/${quizId}/check-answers`, body);
        rezultat.value = res.data?.rezultat || [];
        alreadySolved.value = true;
      } catch (err) {
        if (err?.response?.status === 403) {
          alert('❌ Dosegnut je maksimalan broj pokušaja.');
        } else if (err?.response?.status === 404) {
          alert('Kviz nije pronađen (možda je obrisan).');
          router.replace('/quizzes');
        } else {
          console.error('Greška pri slanju odgovora:', err);
          alert('Ne mogu poslati odgovore.');
        }
      }
    };

    const toggleImageChoice = (qi, val) => {
      if (!odgovori.value[qi]) odgovori.value[qi] = [];
      const i = odgovori.value[qi].indexOf(val);
      if (i >= 0) odgovori.value[qi].splice(i, 1);
      else odgovori.value[qi].push(val);
    };

    const handleHotspotClick = (ev, qi) => {
      const rect = ev.currentTarget.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      odgovori.value[qi] = { x, y };
    };

    const brojTocnih = computed(() => rezultat.value.filter(Boolean).length);
    const postotak = computed(() =>
      rezultat.value.length ? Math.round((brojTocnih.value / rezultat.value.length) * 100) : 0
    );

    const formatOdgovor = (odg) => {
      if (Array.isArray(odg)) return odg.join(', ');
      if (odg && typeof odg === 'object' && odg.x != null && odg.y != null) {
        return `(${Math.round(odg.x)}, ${Math.round(odg.y)})`;
      }
      return odg ?? '';
    };

    onMounted(fetchQuiz);

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
      handleHotspotClick,
    };
  }
};
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


