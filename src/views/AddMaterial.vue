<template>
  <div class="container my-5">
    <router-link :to="{ name: 'SubjectMaterials', params: { predmet } }" class="btn btn-outline-secondary mb-3">
      ⬅ Natrag na materijale
    </router-link>
    <h2 class="text-primary mb-4">Dodaj novi materijal za predmet: {{ predmet }}</h2>

    <form @submit.prevent="submitMaterial" class="bg-white p-4 shadow rounded">
      <div class="mb-3">
        <label class="form-label">Naziv materijala</label>
        <input v-model="naziv" type="text" class="form-control" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Opis materijala</label>
        <textarea v-model="opis" class="form-control" required></textarea>
      </div>

      <div class="mb-3">
        <label class="form-label">Razred</label>
        <select v-model="razred" class="form-select" required>
          <option disabled value="">Odaberi razred</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Slika (opcionalno – URL)</label>
        <input v-model="imageUrl" type="text" class="form-control" placeholder="https://..." />
      </div>

      <div class="mb-3">
        <label class="form-label">PDF datoteka</label>
        <input type="file" @change="handleFile" class="form-control" accept=".pdf" />
      </div>

      <button type="submit" class="btn btn-primary w-100">✅ Dodaj materijal</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api.js'


function normalizeSubject(s) {
  if (!s) return s
  try { s = decodeURIComponent(s) } catch {}
  return s.replace(/\s*\(.*?\)\s*$/i, '').trim()
}

export default {
  name: 'AddMaterial',
  setup() {
    const route   = useRoute()
    const router  = useRouter()

    const predmet = normalizeSubject(route.query.predmet || '')
    const naziv   = ref('')
    const opis    = ref('')
    const imageUrl= ref('')
    const file    = ref(null)
    const razred  = ref('') 

    const handleFile = (e) => { file.value = e.target.files[0] }

    const submitMaterial = async () => {
      try {
        let fileUrl = null

        if (file.value) {
          const formData = new FormData()
          formData.append('file', file.value)
          const res = await api.post('/upload', formData)     
          fileUrl = res.data.fileUrl || null
        }

        await api.post('/materials', {
          naziv: naziv.value,
          opis:  opis.value,
          imageUrl: imageUrl.value || null,
          fileUrl,
          subject: predmet,            
          razred:  razred.value || null
        })

        router.push({ name: 'SubjectMaterials', params: { predmet: encodeURIComponent(predmet) } })
      } catch (err) {
        console.error('Greška pri dodavanju materijala:', err)
        alert('❌ Greška pri dodavanju materijala.')
      }
    }

    return { naziv, opis, imageUrl, file, predmet, razred, handleFile, submitMaterial }
  }
}
</script>


<style scoped>
.add-material {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #cce;
  border-radius: 1rem;
  background-color: #fefefe;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.material-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.material-form input,
.material-form textarea,
.material-form select {
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

.upload-info {
  font-size: 0.9rem;
  margin-top: 1rem;
  color: #444;
}
</style>




