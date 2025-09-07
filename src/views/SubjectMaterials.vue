<template>
  <div class="container my-5">
    <!-- Back + Dodaj -->
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

    <!-- Naslov predmeta -->
    <h2 class="text-success mb-4">{{ predmet }}</h2>

    <!-- Ako nema materijala -->
    <div v-if="materijali && materijali.length === 0" class="alert alert-warning text-center">
      📭 Nema materijala za ovaj predmet.
    </div>

    <!-- Lista materijala -->
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

            <!-- Kontrole samo za profesora koji predaje predmet -->
            <div
              v-if="isProfesor && predajePredmet"
              class="mt-2 d-inline-flex gap-2"
            >
              <button
                class="btn btn-sm btn-outline-secondary me-2"
                @click="openEdit(m)"
              >
                ✏️ Uredi
              </button>

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

    <!-- Modal: Uredi materijal -->
    <div v-if="showEdit" class="modal fade show d-block" style="background:rgba(0,0,0,.35)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Uredi materijal</h5>
            <button class="btn-close" @click="showEdit=false"></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Naziv</label>
              <input v-model="editForm.naziv" class="form-control">
            </div>

            <div class="mb-3">
              <label class="form-label">Opis</label>
              <textarea v-model="editForm.opis" class="form-control"></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Razred</label>
              <input v-model="editForm.razred" class="form-control">
            </div>

            <div class="mb-3">
              <label class="form-label">Slika (URL)</label>
              <input v-model="editForm.imageUrl" class="form-control" placeholder="https://...">
            </div>

            <div class="mb-3">
              <label class="form-label">PDF/PPTX (ako želiš zamijeniti)</label>
              <input type="file" class="form-control" accept=".pdf,.ppt,.pptx" @change="onFile">
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-light" @click="showEdit=false">Odustani</button>
            <button class="btn btn-primary" @click="saveEdit">Spremi</button>
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

/* -------------------- helperi: v1 prefer + fallback -------------------- */
async function getEither(v1, legacy){
  try { return await api.get(v1) }
  catch(e){ if (e?.response?.status === 404) return await api.get(legacy); throw e }
}
async function postEither(v1, legacy, body){
  try { return await api.post(v1, body) }
  catch(e){ if (e?.response?.status === 404) return await api.post(legacy, body); throw e }
}
async function patchEither(v1, legacy, body){
  try { return await api.patch(v1, body) }
  catch(e){ if (e?.response?.status === 404) return await api.patch(legacy, body); throw e }
}
async function putEither(v1, legacy, body){
  try { return await api.put(v1, body) }
  catch(e){ if (e?.response?.status === 404) return await api.put(legacy, body); throw e }
}
async function deleteEither(v1, legacy){
  try { return await api.delete(v1) }
  catch(e){ if (e?.response?.status === 404) return await api.delete(legacy); throw e }
}
/* ---------------------------------------------------------------------- */

async function fetchMaterijali () {
  try {
    if (isProfesor.value) {
      // profesor vidi i skrivene u svom predmetu
      const { data } = await getEither(
        `/api/v1/materials?includeHidden=1`,
        `/materials?includeHidden=1`
      )
      materijali.value = (Array.isArray(data) ? data : [])
        .filter(m => normalizeSubject(m.subject) === predmet.value)
    } else {
      // učenik: po predmetu + njegov razred
      if (!user?.razred) { materijali.value = []; return }
      const { data } = await getEither(
        `/api/v1/materials/subject/${encodeURIComponent(predmet.value)}/razred/${encodeURIComponent(user.razred)}`,
        `/materials/subject/${encodeURIComponent(predmet.value)}/razred/${encodeURIComponent(user.razred)}`
      )
      materijali.value = Array.isArray(data) ? data : []
    }
  } catch (err) {
    console.error('Greška kod dohvaćanja materijala:', err)
    materijali.value = []
  }
}

async function checkDozvola () {
  try {
    if (!isProfesor.value || !user?.id) return
    const { data } = await getEither(
      `/api/v1/profesori/${user.id}`,
      `/profesori/${user.id}`
    )
    predajePredmet.value =
      Array.isArray(data?.Subjects) &&
      data.Subjects.some(s => normalizeSubject(s.naziv) === predmet.value)
  } catch (e) {
    console.error('Greška checkDozvola:', e)
    predajePredmet.value = false
  }
}

async function toggleHide(m) {
  try {
    const next = !m.isHidden
    await patchEither(
      `/api/v1/materials/${m.id}/hide`,
      `/materials/${m.id}/hide`,
      { isHidden: next }
    )
    m.isHidden = next
  } catch (err) {
    console.error('Greška pri sakrivanju/otkrivanju:', err)
    alert('Greška: nije uspjelo sakriti/otkriti materijal.')
  }
}

async function removeMaterial(m) {
  if (!confirm('Sigurno obrisati materijal?')) return
  try {
    await deleteEither(
      `/api/v1/materials/${m.id}`,
      `/materials/${m.id}`
    )
    materijali.value = materijali.value.filter(x => x.id !== m.id)
  } catch (err) {
    console.error('Greška pri brisanju:', err)
    alert('Greška: brisanje nije uspjelo.')
  }
}

async function downloadAndMarkRead(m) {
  try {
    if (user?.id) {
      await api.post(`/api/v1/progress/${user.id}/read/${m.id}`)
      window.dispatchEvent(new CustomEvent('progress-updated'))
    }
    const url = m.downloadUrl || m.fileUrl
    if (!url) {
      alert('Nema URL-a za preuzimanje.')
      return
    }
    window.open(url, '_blank')  
  } catch (err) {
    console.error('Greška pri označavanju pročitanog materijala:', err)
  }
}


function goToAddMaterial () {
  router.push({ name: 'AddMaterial', query: { predmet: encodeURIComponent(predmet.value) } })
}

/* ====== UREDI MATERIJAL (state) ====== */
const showEdit = ref(false)
const editItem = ref(null)
const editForm = ref({ naziv:'', opis:'', razred:'', imageUrl:'', file:null })

function openEdit(m){
  editItem.value = m
  editForm.value = {
    naziv: m.naziv || '',
    opis: m.opis || '',
    razred: m.razred || '',
    imageUrl: m.imageUrl || '',
    file: null
  }
  showEdit.value = true
}

function onFile(e){
  editForm.value.file = e.target.files?.[0] || null
}

async function saveEdit(){
  try{
    // upload fajla (Cloudinary) → dobijamo fileUrl + publicId
    let fileUrl = editItem.value.fileUrl || null
    let cloudinaryPublicId = editItem.value.cloudinaryPublicId || null   // ⬅️ NOVO

    if (editForm.value.file){
      const fd = new FormData()
      fd.append('file', editForm.value.file)
      const up = await postEither('/api/v1/upload', '/upload', fd)
      fileUrl = up.data.fileUrl || fileUrl
      cloudinaryPublicId = up.data.publicId || cloudinaryPublicId        // ⬅️ NOVO
    }

    const payload = {
      naziv: editForm.value.naziv,
      opis: editForm.value.opis,
      imageUrl: editForm.value.imageUrl || null,
      fileUrl,
      cloudinaryPublicId,                                                // ⬅️ NOVO
      razred: editForm.value.razred || editItem.value.razred,
    }

    const { data } = await putEither(
      `/api/v1/materials/${editItem.value.id}`,
      `/materials/${editItem.value.id}`,
      payload
    )

    Object.assign(editItem.value, data)
    showEdit.value = false
  } catch(err){
    console.error(err)
    alert('Greška pri spremanju.')
  }
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

















