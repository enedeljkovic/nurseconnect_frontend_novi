<template>
  <div class="materials-page">
    <div class="text-start mb-3">
      <router-link to="/home" class="btn btn-outline-primary">
        ⬅ Natrag na početnu stranicu
      </router-link>
    </div>
    <h2 class="section-title">📚 Odaberi predmet za pregled materijala</h2>

    <div class="subject-grid">
      <div
        v-for="predmet in predmeti"
        :key="predmet.naziv"
        class="subject-card"
        @click="openSubject(predmet.naziv)"
      >
        <img :src="predmet.slika" class="subject-image" />
        <h3>{{ predmet.naziv }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'Materials',
  setup() {
    const router = useRouter();

    const predmeti = [
      { naziv: 'Psihologija', slika: 'https://img.icons8.com/color/96/psychology.png' },
      { naziv: 'Načela poučavanja', slika: 'https://img.icons8.com/color/96/training.png' },
      { naziv: 'Etika u sestrinstvu', slika: 'https://img.icons8.com/color/96/scales.png' },
      { naziv: 'Anatomija i fiziologija', slika: 'https://img.icons8.com/color/96/body.png' },
      { naziv: 'Bakteriologija, virologija i parazitologija', slika: 'https://img.icons8.com/color/96/microscope.png' },
      { naziv: 'Biokemija', slika: 'https://img.icons8.com/color/96/test-tube.png' },
      { naziv: 'Opća načela zdravlja i njege', slika: 'https://img.icons8.com/color/96/health-checkup.png' },
      { naziv: 'Zdravstvena njega - opća', slika: 'https://img.icons8.com/color/96/nurse-female.png' },
      { naziv: 'Zdravstvena njega zdravog djeteta i adolescenta', slika: 'https://img.icons8.com/color/96/children.png' },
      { naziv: 'Osnove fizikalne i radne terapije (izborni)', slika: 'https://img.icons8.com/color/96/exercise.png' },
      { naziv: 'Profesionalna komunikacija u sestrinstvu (izborni)', slika: 'https://img.icons8.com/color/96/speech-bubble.png' },
      { naziv: 'Sat razrednika', slika: 'https://img.icons8.com/color/96/classroom.png' }
    ];

    const openSubject = (predmet) => {
      const user = JSON.parse(localStorage.getItem('user'));
      const isProfesor = localStorage.getItem('isProfesor') === 'true';
      const profesorPredmeti = JSON.parse(localStorage.getItem('profesorPredmeti')) || [];

      
      if (isProfesor && profesorPredmeti.includes(predmet)) {
        router.push({ name: 'AddMaterial', query: { predmet } });
      } else {
        
        const path = `/materials/${encodeURIComponent(predmet)}`;
        router.push(path);
      }
    };

    return {
      predmeti,
      openSubject
    };
  }
};
</script>


<style scoped>
.materials-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #0077B6;
  text-decoration: none;
  font-weight: 500;
}

.back-icon {
  font-size: 1.2rem;
}

.back-button:hover {
  text-decoration: underline;
  color: #005f8a;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.subject-card {
  background-color: #f1fefc;
  border: 1px solid #cce;
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.subject-card:hover {
  transform: translateY(-5px);
  background-color: #e1f9f8;
}

.subject-image {
  width: 64px;
  height: 64px;
  margin-bottom: 0.5rem;
}

.subject-card h3 {
  color: #0077B6;
  margin: 0.3rem 0 0.5rem;
  font-size: 1.1rem;
}
</style>