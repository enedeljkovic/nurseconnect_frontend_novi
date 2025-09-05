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
              <h5 class="mb-1">{{ k.naziv }} <small class="text-muted">({{ k.razred }})</small></h5>
              <div class="text-muted">
                Pokušaja: <strong>{{ k.pokusaji.length }}</strong>
                &nbsp;|&nbsp; Prosjek: <strong>{{ avgPerc(k) }}%</strong>
                <span v-if="k.pokusaji.length">
                  &nbsp;|&nbsp; Zadnji: <strong>{{ fmtDate(k.pokusaji[0].solvedAt || k.pokusaji[0].solvedat) }}</strong>
                </span>
              </div>
            </div>
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
   
    const sumRes = await api.get(`/profesori/${user.id}/quiz-statistics`)
    const summary = Array.isArray(sumRes.data) ? sumRes.data : []

   
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

.no-attempts {
  color: #888;
  margin-top: 1rem;
  font-style: italic;
}

</style>
