<template>
  <div class="material-details">
    <div class="material-card">
      <h2>{{ material?.naziv }}</h2>

      <img
        v-if="material?.imageUrl"
        :src="material.imageUrl"
        alt="Slika materijala"
        class="material-image"
      />

      <p class="material-description">{{ material?.opis }}</p>

      <a
        v-if="material?.fileUrl"
        :href="material.fileUrl"
        class="download-button"
        target="_blank"
      >
        📄 Preuzmi datoteku
      </a>

      <router-link to="/materials" class="back-button">
        ← Natrag na materijale
      </router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'MaterialDetails',
  setup() {
    const route = useRoute();
    const material = ref(null);

    const fetchMaterial = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/materials`);
        material.value = res.data.find(m => m.id === parseInt(route.params.id));
      } catch (error) {
        console.error('Greška pri dohvaćanju detalja materijala:', error);
      }
    };

    onMounted(fetchMaterial);

    return { material };
  }
};
</script>

<style scoped>
.material-details {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.material-card {
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 850px;
  width: 100%;
}

.material-card h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #0077B6;
}

.material-image {
  width: 100%;
  max-height: 350px;
  object-fit: cover;
  border-radius: 0.8rem;
  margin: 1.5rem 0;
}

.material-description {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #333;
  white-space: pre-line;
}

.download-button {
  display: inline-block;
  margin-top: 1rem;
  background-color: #3B9A57;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.download-button:hover {
  background-color: #2e7746;
}

.back-button {
  display: inline-block;
  margin-top: 2rem;
  background-color: #0077B6;
  color: #fff;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background-color: #005f8a;
}
</style>
