<template>
  <div class="container my-5">
    <h2 class="mb-4 text-center text-primary">⚙️ Admin Postavke</h2>

    <div class="row g-4">

      <div class="col-md-6">
        <div class="card p-4 shadow-sm h-100">
          <h5 class="text-secondary mb-3">🔐 Promjena lozinke</h5>
          <div class="mb-3">
            <label class="form-label">Trenutna lozinka</label>
            <input v-model="trenutnaLozinka" type="password" class="form-control" placeholder="Unesi trenutnu lozinku" />
          </div>
          <div class="mb-3">
            <label class="form-label">Nova lozinka</label>
            <input v-model="novaLozinka" type="password" class="form-control" placeholder="Unesi novu lozinku" />
          </div>
          <div class="mb-3">
            <label class="form-label">Potvrdi novu lozinku</label>
            <input v-model="potvrdaLozinke" type="password" class="form-control" placeholder="Ponovi novu lozinku" />
          </div>
          <button class="btn btn-success" @click="promijeniLozinku">Spremi lozinku</button>
        </div>
      </div>

      <!-- Statistika -->
      <div class="col-md-6">
        <div class="card p-4 shadow-sm h-100">
          <h5 class="text-secondary mb-3">📊 Statistika sustava</h5>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between">
              <span>👤 Studenata:</span> <strong>{{ statistika.studenti }}</strong>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>🧑‍🏫 Profesora:</span> <strong>{{ statistika.profesori }}</strong>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>📚 Materijala:</span> <strong>{{ statistika.materijali }}</strong>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>📝 Kvizova:</span> <strong>{{ statistika.kvizovi }}</strong>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminSettings',
  data() {
    return {
      trenutnaLozinka: '',
      novaLozinka: '',
      potvrdaLozinke: '',
      statistika: {
        studenti: 0,
        profesori: 0,
        materijali: 0,
        kvizovi: 0
      }
    };
  },
  methods: {
    async promijeniLozinku() {
      if (!this.trenutnaLozinka || !this.novaLozinka || !this.potvrdaLozinke) {
        return alert('Sva polja su obavezna.');
      }
      if (this.novaLozinka !== this.potvrdaLozinke) {
        return alert('Nova lozinka i potvrda se ne poklapaju.');
      }

      try {
        await axios.put('http://localhost:3001/admin/promjena-lozinke', {
          trenutna: this.trenutnaLozinka,
          nova: this.novaLozinka
        });
        alert('Lozinka je uspješno promijenjena!');
        this.trenutnaLozinka = this.novaLozinka = this.potvrdaLozinke = '';
      } catch (err) {
        console.error(err);
        alert('Greška pri promjeni lozinke.');
      }
    },
    async dohvatiStatistiku() {
      try {
        const res = await axios.get('http://localhost:3001/admin/statistika');
        this.statistika = res.data;
      } catch (err) {
        console.error('Greška pri dohvaćanju statistike:', err);
      }
    }
  },
  mounted() {
    this.dohvatiStatistiku();
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
}
</style>
