<template>
  <div class="container my-5">
   
    <div class="d-flex justify-content-between align-items-center mb-3">
      <router-link to="/materials" class="btn btn-outline-primary">
        ⬅ Natrag na početnu stranicu
      </router-link>

      
      <button
        v-if="isProfesor && predajePredmet"
        class="btn btn-success"
        @click="goToAddMaterial"
      >
        ＋ Dodaj materijal
      </button>
    </div>

  
    <h2 class="text-success mb-4">{{ predmet }}</h2>

    <div v-if="materijali.length === 0" class="alert alert-warning text-center">
      📭 Nema materijala za ovaj predmet.
    </div>

    
    <div class="row g-4" v-else>
      <div v-for="m in materijali" :key="m.id" class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-center gap-2">
              <h5 class="card-title mb-0">{{ m.naziv }}</h5>
              
              <span v-if="m.isHidden" class="badge bg-warning text-dark">skriveno</span>
            </div>

            <p class="card-text mt-2">{{ m.opis }}</p>
            <p class="text-muted mb-3">
              <strong>Razred:</strong> {{ m.razred }}
            </p>

            <button
              v-if="m.fileUrl"
              class="btn btn-sm btn-outline-primary me-2"
              @click="downloadAndMarkRead(m)"
            >
              📎 Preuzmi datoteku
            </button>

           
            <div
              v-if="isProfesor && predajePredmet"
              class="mt-2 d-inline-flex gap-2"
            >
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="toggleHide(m)"
              >
                {{ m.isHidden ? 'Otkrij' : 'Sakrij' }}
              </button>

              <button
                class="btn btn-sm btn-outline-danger"
                @click="removeMaterial(m)"
              >
                🗑 Obriši
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../lib/api.js'
  const API = axios.create({
  baseURL: import.meta.env.VITE_API || 'https://nurseconnect-backend-novi.onrender.com',
  withCredentials: true,
});


function normalizeSubject(s){
  if (!s) return s
  try { s = decodeURIComponent(s) } catch {}
  return s.replace(/\s*\(.*?\)\s*$/,'').trim()
}

const route = useRoute()
const router = useRouter()

const predmet = ref(normalizeSubject(route.params.predmet))
const materijali = ref([])
const user = JSON.parse(localStorage.getItem('user') || '{}')
const isProfesor = ref(localStorage.getItem('isProfesor') === 'true')
const predajePredmet = ref(false)

async function fetchMaterijali() {
  try {
    const q = isProfesor.value ? '?includeHidden=1' : '';
    const url = `/materials/subject/${encodeURIComponent(predmet.value)}/razred/${encodeURIComponent(user.razred)}${q}`;
    const { data } = await API.get(url);
    materijali.value = data; 
  } catch (err) {
    console.error('Greška kod dohvaćanja materijala:', err);
    materijali.value = [];
  }
}


async function checkDozvola () {
  if (!isProfesor.value || !user.id) return
  const { data } = await api.get(`/profesori/${user.id}`)
  predajePredmet.value = Array.isArray(data?.Subjects) && data.Subjects.map(s => s.naziv).includes(predmet.value)
}

function goToAddMaterial () {
  router.push({ name: 'AddMaterial', query: { predmet: encodeURIComponent(predmet.value) } })
}

onMounted(() => {
  fetchMaterijali().catch(console.error)
  checkDozvola().catch(console.error)
})

watch(() => route.params.predmet, v => {
  predmet.value = normalizeSubject(v)
  fetchMaterijali().catch(console.error)
  checkDozvola().catch(console.error)
})

  async function toggleHide(m) {
  try {
    const next = !m.isHidden;
    await API.patch(`/materials/${m.id}/hide`, { isHidden: next });
    m.isHidden = next; 
  } catch (err) {
    console.error('Greška pri sakrivanju/otkrivanju:', err);
    alert('Greška: nije uspjelo sakriti/otkriti materijal.');
  }
}

async function removeMaterial(m) {
  if (!confirm('Sigurno obrisati materijal?')) return;
  try {
    await API.delete(`/materials/${m.id}`);
    materijali.value = materijali.value.filter(x => x.id !== m.id);
  } catch (err) {
    console.error('Greška pri brisanju:', err);
    alert('Greška: brisanje nije uspjelo.');
  }
}

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






