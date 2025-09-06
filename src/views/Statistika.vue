<template>
  <div class="container my-5">
    <h2 class="mb-4">📊 Detaljna statistika kvizova</h2>

    <div v-if="loading" class="alert alert-info">Učitavanje...</div>
    <div v-else-if="kvizovi.length === 0" class="alert alert-warning">
      Nema kvizova ili pokušaja.
    </div>

    <div v-else class="vstack gap-4">
      <div v-for="k in kvizovi" :key="k.id" class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h5 class="mb-1">
                {{ k.naziv }} <small class="text-muted">({{ k.razred }})</small>
              </h5>
              <div class="text-muted">
                Pokušaja: <strong>{{ k.pokusaji.length }}</strong>
                &nbsp;|&nbsp; Prosjek: <strong>{{ avgPerc(k) }}%</strong>
                <span v-if="k.pokusaji.length">
                  &nbsp;|&nbsp; Zadnji:
                  <strong>{{ fmtDate(k.pokusaji[0].solvedAt || k.pokusaji[0].solvedat) }}</strong>
                </span>
              </div>
            </div>

            <!-- NOVO: gumb za detalje -->
            <button class="btn btn-outline-secondary btn-sm"
                    @click="openDetails(k.id)">
              📊 Detalji
            </button>
          </div>

          <div v-if="k.pokusaji.length" class="table-responsive mt-3">
            <table class="table table-sm table-hover align-middle">
              <thead>
                <tr>
                  <th>Učenik</th>
                  <th>Rezultat</th>
                  <th>Trajanje</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in k.pokusaji" :key="p.id">
                  <td>{{ (p.student?.ime || '-') }} {{ (p.student?.prezime || '') }}</td>
                  <td>{{ percent(p) }}% ({{ p.result }}/{{ p.total }})</td>
                  <td>{{ fmtDur(p.durationSec) }}</td>
                  <td>{{ fmtDate(p.solvedAt || p.solvedat) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-muted mt-2">Nema pokušaja za ovaj kviz.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- NOVO: Drawer/Modal s detaljima po pitanjima -->
  <div v-if="showDetails"
       class="position-fixed top-0 start-0 w-100 h-100"
       style="background: rgba(0,0,0,.35); z-index: 1050;"
       @click.self="closeDetails">

    <div class="bg-white shadow rounded-3 p-3 p-md-4 position-absolute top-0 end-0 h-100"
         style="width: min(900px, 95vw); overflow:auto">

      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="m-0">
          📊 Statistika — <span v-if="details?.quiz">{{ details.quiz.naziv }}</span>
        </h4>
        <button class="btn btn-outline-secondary btn-sm" @click="closeDetails">✕</button>
      </div>

      <div v-if="detailsLoading" class="alert alert-info">Učitavanje detalja…</div>
      <div v-else-if="detailsError" class="alert alert-danger">{{ detailsError }}</div>

      <div v-else-if="details">
        <!-- Sažetak -->
        <div class="row g-3 mb-4">
          <div class="col-sm-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="text-muted">Pokušaja</div>
                <div class="h4 m-0">{{ details.summary?.attempts ?? 0 }}</div>
              </div>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="text-muted">Prosječni rezultat</div>
                <div class="h4 m-0">{{ details.summary?.avgScore ?? 0 }}%</div>
              </div>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="text-muted">Prosj. trajanje</div>
                <div class="h4 m-0">
                  <span v-if="details.summary?.avgDurationSec != null">
                    {{ details.summary.avgDurationSec }} s
                  </span>
                  <span v-else>—</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pitanja -->
        <div class="card shadow-sm">
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:56px">#</th>
                  <th>Pitanje</th>
                  <th class="text-nowrap">Točnost</th>
                  <th class="text-nowrap">Prosj. vrijeme</th>
                  <th>Top krive opcije</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="q in (details.questions || [])" :key="q.index">
                  <td class="fw-semibold">{{ q.index + 1 }}</td>
                  <td>
                    <div class="fw-semibold">{{ q.text }}</div>
                    <div class="text-muted small">{{ q.type }}</div>
                  </td>
                  <td>{{ q.correctRate }}%</td>
                  <td>
                    <span v-if="q.avgTimeMs != null">{{ Math.round(q.avgTimeMs) }} ms</span>
                    <span v-else>—</span>
                  </td>
                  <td>
                    <span v-if="q.topWrong?.length">
                      <span v-for="w in q.topWrong" :key="w.option" class="badge bg-light text-dark me-1">
                        {{ w.option }} × {{ w.count }}
                      </span>
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                </tr>
                <tr v-if="!(details.questions?.length)">
                  <td colspan="5" class="text-center text-muted py-4">Nema podataka.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api.js'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const kvizovi = ref([])
const loading = ref(true)

function percent(p) {
  const r = Number(p?.result ?? 0)
  const t = Number(p?.total ?? 0)
  if (!t) return 0
  return Math.round((r / t) * 100)
}
function avgPerc(k) {
  if (!k?.pokusaji?.length) return 0
  const sum = k.pokusaji.reduce((acc, p) => acc + percent(p), 0)
  return Math.round(sum / k.pokusaji.length)
}
function fmtDur(sec) {
  const s = Number(sec || 0)
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const rem = s % 60
  return m ? `${m}m ${rem}s` : `${rem}s`
}
function fmtDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return String(d) }
}

onMounted(async () => {
  try {
    // 1) Sažetak po kvizovima kojeg već koristiš
    const sumRes = await api.get(`/profesori/${user.id}/quiz-statistics`)
    const summary = Array.isArray(sumRes.data) ? sumRes.data : []

    // 2) Pokušaji po kvizu (postojeći endpoint)
    const detalji = await Promise.all(
      summary.map(async (kviz) => {
        try {
          const detRes = await api.get(`/api/v1/quiz/${kviz.id}/detalji`)
          return { ...kviz, pokusaji: detRes.data?.pokusaji || [] }
        } catch {
          return { ...kviz, pokusaji: [] }
        }
      })
    )

    kvizovi.value = detalji
  } catch (err) {
    console.error('Greška pri dohvaćanju detaljne statistike:', err)
    kvizovi.value = []
  } finally {
    loading.value = false
  }
})

/* ===== NOVO: detaljni prikaz po pitanjima ===== */
const showDetails = ref(false)
const detailsLoading = ref(false)
const detailsError = ref('')
const details = ref(null) // { quiz, summary, questions: [...] }

async function openDetails(kvizId) {
  showDetails.value = true
  detailsLoading.value = true
  detailsError.value = ''
  details.value = null
  try {
    const { data } = await api.get(`/quizzes/${kvizId}/stats-detaljno`)
    details.value = data
  } catch (e) {
    console.error(e)
    detailsError.value = 'Ne mogu dohvatiti detalje.'
  } finally {
    detailsLoading.value = false
  }
}
function closeDetails() {
  showDetails.value = false
  details.value = null
  detailsError.value = ''
}
</script>

<style scoped>
.statistika-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f9ffff;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.1);
}

.quiz-card {
  background: white;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 10px;
  border-left: 5px solid #0077cc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.quiz-title {
  color: #0077cc;
  margin-bottom: 0.5rem;
}

.quiz-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.quiz-table th,
.quiz-table td {
  border: 1px solid #ccc;
  padding: 0.75rem;
  text-align: left;
}

.quiz-table th {
  background-color: #e6f2ff;
}

.quiz-table tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>
