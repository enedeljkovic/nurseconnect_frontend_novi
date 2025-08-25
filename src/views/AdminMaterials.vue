<template>
  <div class="container my-5">
    <h2 class="mb-4 text-center text-primary">📚 Upravljanje materijalima po predmetima</h2>

    <div v-if="predmeti.length === 0" class="alert alert-warning text-center">
      Trenutno nema dostupnih materijala.
    </div>

    <div v-else>
      <select v-model="odabraniPredmet" class="form-select mb-4">
        <option disabled value="">⬇ Odaberi predmet</option>
        <option v-for="predmet in predmeti" :key="predmet">{{ predmet }}</option>
      </select>

      <div v-if="odabraniPredmet && materijaliPoPredmetima[odabraniPredmet]">
        <div class="row g-4">
          <div class="col-md-6" v-for="material in materijaliPoPredmetima[odabraniPredmet]" :key="material.id">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h5 class="card-title">{{ material.naziv }}</h5>
                <p class="card-text"><strong>Opis:</strong> {{ material.opis }}</p>
                <a :href="material.fileUrl" target="_blank" class="btn btn-outline-primary btn-sm me-2">
                  📄 Otvori datoteku
                </a>
                <button @click="obrisiMaterial(material.id)" class="btn btn-outline-danger btn-sm">🗑 Obriši</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center text-muted">
        <p>Odaberi predmet za prikaz materijala.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted } from 'vue';

export default {
  name: 'AdminMaterials',
  setup() {
    const materijaliPoPredmetima = ref({});
    const predmeti = ref([]);
    const odabraniPredmet = ref('');

    const ucitajMaterijale = async () => {
      try {
        const res = await axios.get('http://localhost:3001/materials');
        const grupirani = {};

        res.data.forEach(mat => {
          if (!grupirani[mat.subject]) grupirani[mat.subject] = [];
          grupirani[mat.subject].push(mat);
        });

        materijaliPoPredmetima.value = grupirani;
        predmeti.value = Object.keys(grupirani);
        odabraniPredmet.value = predmeti.value[0] || '';
      } catch (err) {
        console.error('❌ Greška pri dohvaćanju materijala:', err);
      }
    };

    const obrisiMaterial = async (id) => {
      if (confirm('Jeste li sigurni da želite obrisati ovaj materijal?')) {
        try {
          await axios.delete(`http://localhost:3001/materials/${id}`);
          ucitajMaterijale();
        } catch (err) {
          console.error('❌ Greška pri brisanju materijala:', err);
        }
      }
    };

    onMounted(ucitajMaterijale);

    return {
      materijaliPoPredmetima,
      predmeti,
      odabraniPredmet,
      obrisiMaterial
    };
  }
};
</script>

<style scoped>
.card-title {
  font-size: 1.2rem;
}
</style>
