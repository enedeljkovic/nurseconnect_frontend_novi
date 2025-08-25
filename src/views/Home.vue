<template>
  <div class="home-container">
    <header class="home-header">
      <h1>NurseConnect</h1>
      <p class="tagline">Igram se i učim</p>
    </header>

    <section class="cards-section">
      <div
        class="card"
        v-for="(card, index) in prikazaneKartice"
        :key="index"
        @click="goTo(card.route)"
      >
        <i :class="card.icon"></i>
        <span>{{ card.label }}</span>
      </div>
    </section>

    <section v-if="!isProfesor" class="progress-section">
      <h2>Napredak</h2>

      <div class="progress-block">
        <p><strong>Materijali:</strong> {{ procentMaterijala }}%</p>
        <div class="progress-bar">
          <div class="bar-fill" :style="{ width: procentMaterijala + '%' }"></div>
        </div>
        <p class="small">{{ procitaniMaterijali.length }} / {{ sviMaterijali.length }} pročitano</p>
      </div>

      <div class="progress-block">
        <p><strong>Kvizovi:</strong> {{ procentKvizova }}%</p>
        <div class="progress-bar">
          <div class="bar-fill" :style="{ width: procentKvizova + '%' }"></div>
        </div>
        <p class="small">{{ rijeseniKvizovi.length }} / {{ sviKvizovi.length }} riješeno</p>
      </div>
    </section>

    <section v-if="isProfesor" class="profesor-statistika">
      <h2>Statistika kvizova</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <i class="fas fa-folder-plus"></i>
          <div>
            <p class="stat-value">{{ brojKvizova }}</p>
            <p class="stat-label">Dodani kvizovi</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-check-double"></i>
          <div>
            <p class="stat-value">{{ brojPokusaja }}</p>
            <p class="stat-label">Riješeni pokušaji</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="fas fa-percentage"></i>
          <div>
            <p class="stat-value">{{ prosjek }}%</p>
            <p class="stat-label">Prosječna uspješnost</p>
          </div>
        </div>
      </div>
    </section>
    
<div class="logout-wrapper">
  <button @click="confirmLogout" class="logout-btn">
    <i class="fas fa-sign-out-alt"></i> Odjava
  </button>
</div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios               from 'axios'
import { useRouter }       from 'vue-router'

const router   = useRouter()
const goTo     = page => router.push(`/${page}`)

const isProfesor = localStorage.getItem('isProfesor') === 'true'
const user       = JSON.parse(localStorage.getItem('user') || '{}')
const mojRazred  = user.razred

const sviMaterijali       = ref([])
const procitaniMaterijali = ref([])
const procentMaterijala   = ref(0)
const sviKvizovi          = ref([])
const rijeseniKvizovi     = ref([])
const procentKvizova      = ref(0)

const brojKvizova  = ref(0)
const brojPokusaja = ref(0)
const prosjek      = ref(0)


const karticeUcenik = [
  { label: 'Profil',     route: 'profile',        icon: 'fas fa-user' },
  { label: 'Materijali', route: 'materials',      icon: 'fas fa-book' },
  { label: 'Kvizovi',    route: 'quizzes',        icon: 'fas fa-question-circle' }
]
const karticeProfesor = [
  ...karticeUcenik,
  { label: 'Statistika kvizova', route: 'quiz-statistics', icon: 'fas fa-chart-bar' },
  { label: 'Chat s profesorima',  route: 'chat',            icon: 'fas fa-comments' }
]
const prikazaneKartice = isProfesor ? karticeProfesor : karticeUcenik


async function fetchProgress() {
  const [resM, resQ, resP] = await Promise.all([
    axios.get('http://localhost:3001/materials'),
    axios.get('http://localhost:3001/quizzes'),
    axios.get(`http://localhost:3001/api/v1/progress/${user.id}`)
  ])

  
  sviMaterijali.value = resM.data.filter(m => m.razred === mojRazred)
  procitaniMaterijali.value = sviMaterijali.value.filter(m =>
    resP.data.readMaterialIds.includes(m.id)
  )
  procentMaterijala.value = sviMaterijali.value.length
    ? Math.round(procitaniMaterijali.value.length / sviMaterijali.value.length * 100)
    : 0

  
  sviKvizovi.value = resQ.data.filter(k => k.razred === mojRazred)
  rijeseniKvizovi.value = sviKvizovi.value.filter(k =>
    resP.data.solvedQuizIds.includes(k.id)
  )
  procentKvizova.value = sviKvizovi.value.length
    ? Math.round(rijeseniKvizovi.value.length / sviKvizovi.value.length * 100)
    : 0

  
  if (isProfesor) {
    const resStat = await axios.get(`http://localhost:3001/profesori/${user.id}/quiz-statistics`)
    const podaci = resStat.data

    brojKvizova.value  = podaci.length
    brojPokusaja.value = podaci.reduce((sum, q) => sum + q.brojPokusaja, 0)
    const ukupanProsjek = podaci.reduce((sum, q) => sum + (q.prosjek || 0), 0)
    prosjek.value = podaci.length > 0 ? Math.round(ukupanProsjek / podaci.length) : 0
  }
}


function onProgressUpdated() {
  fetchProgress().catch(err => console.error('Greška pri osvježavanju napretka:', err))
}


onMounted(() => {
  fetchProgress().catch(err => console.error('Greška pri dohvaćanju podataka:', err))
  if (!isProfesor) {
    window.addEventListener('progress-updated', onProgressUpdated)
  }
})

function confirmLogout() {
  if (confirm('Jesi li siguran da se želiš odjaviti?')) {
    localStorage.clear();
    router.push('/login');
  }
}


onBeforeUnmount(() => {
  window.removeEventListener('progress-updated', onProgressUpdated)
})
</script>




<style scoped>
.home-container {
  min-height: 100vh;
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  background: linear-gradient(135deg, #e0f7fa, #f1fdf5);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home-header {
  text-align: center;
  margin-bottom: 2rem;
}

.home-header h1 {
  color: #0077B6;
  font-size: 2.5rem;
  margin-bottom: 0.3rem;
}

.tagline {
  color: #3B9A57;
  font-size: 1.2rem;
}

.cards-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
}

.card {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.card:hover {
  background-color: #e0f7fa;
  transform: scale(1.03);
}

.card i {
  font-size: 2rem;
  color: #0077B6;
  margin-bottom: 0.5rem;
}

.card span {
  display: block;
  font-weight: bold;
  color: #333;
}

.progress-section {
  background-color: #ffffff;
  padding: 1rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  text-align: center;
  width: 100%;
}

.progress-section h2 {
  color: #0077B6;
  margin-bottom: 1.5rem;
}

.progress-block {
  margin-bottom: 1.5rem;
  text-align: left;
}

.progress-bar {
  height: 16px;
  width: 100%;
  background-color: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.bar-fill {
  height: 100%;
  background-color: #3B9A57;
  width: 0%;
  transition: width 0.5s ease-in-out;
}

.small {
  font-size: 0.9rem;
  color: #666;
}

/* Stil za statistiku profesora */
.profesor-statistika {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
  text-align: center;
  width: 100%;
  margin-top: 2rem;
}

.profesor-statistika h2 {
  color: #0077B6;
  margin-bottom: 2rem;
}

.stat-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
}

.stat-card {
  background-color: #f1fdf5;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  width: 220px;
  display: flex;
  align-items: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: scale(1.05);
}

.stat-card i {
  font-size: 2rem;
  color: #0077B6;
  margin-right: 1rem;
}

.stat-value {
  font-size: 1.7rem;
  font-weight: bold;
  color: #3B9A57;
  margin: 0;
}

.stat-label {
  font-size: 1rem;
  color: #555;
  margin: 0;
}
.logout-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: #c82333;
}
</style>