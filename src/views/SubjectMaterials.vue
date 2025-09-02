<template>
  <div class="container my-5">
    <!-- Gumb za povratak -->
    <div class="text-start mb-3">
      <router-link to="/materials" class="btn btn-outline-primary">
        ⬅ Natrag na početnu stranicu
      </router-link>
    </div>

    <!-- Naslov predmeta -->
    <h2 class="text-success mb-4">{{ selectedSubject }}</h2>

    <!-- Ako nema materijala -->
    <div v-if="materijali.length === 0" class="alert alert-warning text-center">
      📭 Nema materijala za ovaj predmet.
    </div>

    <!-- Lista materijala -->
    <div class="row g-4" v-else>
      <div v-for="m in materijali" :key="m.id" class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <h5 class="card-title">{{ m.naziv }}</h5>
            <p class="card-text">{{ m.opis }}</p>
            <p class="text-muted"><strong>Razred:</strong> {{ m.razred }}</p>
            <button
              v-if="m.fileUrl"
              class="btn btn-sm btn-outline-primary"
              @click="downloadAndMarkRead(m)"
            >
              📎 Preuzmi datoteku
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
  import { api } from '../lib/api.js'


const API = import.meta.env.VITE_API_URL   
const route = useRoute()
const router = useRouter()
const predmet    = ref(decodeURIComponent(route.params.predmet))
const materijali = ref([])
const user       = JSON.parse(localStorage.getItem('user') || '{}')
const isProfesor = ref(localStorage.getItem('isProfesor')==='true')
const predajePredmet = ref(false)

async function fetchMaterijali() {
 
  const res = await axios.get(`${API}/materials/subject/${encodeURIComponent(predmet.value)}`, {
    params: { t: Date.now() } 
  })

 
  materijali.value = isProfesor.value
    ? res.data
    : res.data.filter(m => m.razred === user.razred)
}

async function checkDozvola() {
  if (!isProfesor.value) return
  const res = await axios.get(`${API}/profesori/${user.id}`)
  predajePredmet.value = res.data.Subjects.map(s => s.naziv).includes(predmet.value)
}

async function downloadAndMarkRead(m) {
  try {
    await axios.post(`${API}/api/v1/progress/${user.id}/read/${m.id}`)
    window.dispatchEvent(new CustomEvent('progress-updated'))
    window.open(m.fileUrl, '_blank')
  } catch (err) {
    console.error('Greška pri označavanju pročitanog materijala:', err)
  }
}

function goToAddMaterial() {
  router.push({ name:'AddMaterial', query:{ predmet: predmet.value }})
}

onMounted(() => {
  fetchMaterijali().catch(console.error)
  checkDozvola().catch(console.error)
})
</script>





<style scoped>
.subject-materials {
  max-width: 850px;
  margin: 2rem auto;
  padding: 1rem;
}
.back-button {
  display: inline-block;
  margin-bottom: 1rem;
  color: #0077B6;
  text-decoration: none;
  font-weight: 500;
}
.back-button:hover {
  text-decoration: underline;
}
.section-title {
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
}
.material-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  border: 1px solid #cce;
  padding: 1rem;
  border-radius: 0.8rem;
  background-color: #fefefe;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.material-form h3 {
  margin: 0;
  color: #0077B6;
}
.material-form input,
.material-form textarea {
  padding: 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
}
.material-form button {
  padding: 0.6rem;
  background-color: #0077B6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
.material-form button:hover {
  background-color: #005f8a;
}
.material-list {
  list-style-type: none;
  padding: 0;
}
.material-item {
  background-color: #f1fefc;
  border: 1px solid #cce;
  border-radius: 0.8rem;
  padding: 1rem;
  margin-bottom: 1rem;
}
.material-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}
.material-download {
  display: inline-block;
  margin-top: 0.5rem;
  color: #0077B6;
  font-weight: 500;
  text-decoration: none;
}
.material-download:hover {
  text-decoration: underline;
}
.upload-info {
  font-size: 0.9rem;
  color: #444;
}
.no-materials {
  color: #666;
  font-style: italic;
  margin-top: 1rem;
}
.not-allowed {
  text-align: center;
  color: #888;
  margin: 1rem 0 2rem;
}
</style>




