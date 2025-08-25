<template>
  <div class="container my-5">
    <h2 class="mb-4 text-center text-primary">📝 Upravljanje kvizovima po predmetima</h2>

    <div class="mb-3">
      <select v-model="odabraniPredmet" class="form-select shadow-sm">
        <option disabled value="">⬇ Odaberi predmet</option>
        <option value="Općenito">Općenito</option>
        <option v-for="predmet in predmeti" :key="predmet" :value="predmet">
          {{ predmet }}
        </option>
      </select>
    </div>

    <div v-if="filtriraniKvizovi.length === 0" class="alert alert-warning text-center">
      Nema kvizova za odabrani predmet.
    </div>

    <div class="row g-4" v-else>
      <div class="col-md-6" v-for="kviz in filtriraniKvizovi" :key="kviz.id">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <h5 class="card-title">{{ kviz.naziv }}</h5>
            <p class="card-text"><strong>Predmet:</strong> {{ kviz.predmet }}</p>
            <button @click="obrisiKviz(kviz.id)" class="btn btn-outline-danger btn-sm mt-2">🗑 Obriši</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';

export default {
  name: 'AdminQuizzes',
  setup() {
    const kvizovi = ref([]);
    const odabraniPredmet = ref('');
    const predmeti = ref([]);

    const ucitajKvizove = async () => {
      try {
        const res = await axios.get('http://localhost:3001/quizzes');
        kvizovi.value = res.data;
        const sviPredmeti = res.data
          .map(k => k.predmet)
          .filter(p => p && p !== ''); 
        predmeti.value = [...new Set(sviPredmeti)];
      } catch (err) {
        console.error('Greška pri dohvaćanju kvizova:', err);
      }
    };

    const obrisiKviz = async (id) => {
      if (confirm('Jeste li sigurni da želite obrisati ovaj kviz?')) {
        try {
          await axios.delete(`http://localhost:3001/quizzes/${id}`);
          await ucitajKvizove();
        } catch (err) {
          console.error('Greška pri brisanju kviza:', err);
        }
      }
    };

    const filtriraniKvizovi = computed(() => {
      return kvizovi.value.filter(k => {
        if (odabraniPredmet.value === 'Općenito') return true;
        return k.predmet === odabraniPredmet.value;
      });
    });

    onMounted(ucitajKvizove);

    return { kvizovi, predmeti, odabraniPredmet, filtriraniKvizovi, obrisiKviz };
  }
};
</script>

<style scoped>
.card-title {
  font-size: 1.2rem;
}
</style>
