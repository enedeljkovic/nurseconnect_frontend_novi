<template>
  <div class="container my-5">
    <h2 class="mb-4 text-center text-primary">🧑‍🏫 Upravljanje profesorima</h2>

    <div class="card p-4 mb-4 shadow-sm">
      <h5 class="mb-3 text-secondary">
        {{ editMode ? '✏️ Uredi profesora' : '➕ Dodaj novog profesora' }}
      </h5>
      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <input v-model="ime" type="text" class="form-control" placeholder="Ime" />
        </div>
        <div class="col-md-3">
          <input v-model="prezime" type="text" class="form-control" placeholder="Prezime" />
        </div>
        <div class="col-md-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" />
        </div>
        <div class="col-md-3">
          <input v-model="kod" type="text" class="form-control" placeholder="Kod" />
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">📘 Odaberi predmete:</label>
        <div class="row">
          <div class="col-md-4 mb-2" v-for="predmet in sviPredmeti" :key="predmet.id">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" :value="predmet.id" v-model="odabraniPredmeti" :id="'p' + predmet.id">
              <label class="form-check-label" :for="'p' + predmet.id">{{ predmet.naziv }}</label>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-success" @click="editMode ? spremiIzmjene() : dodajProfesora()">
          {{ editMode ? '💾 Spremi' : '✅ Dodaj' }}
        </button>
        <button class="btn btn-secondary" v-if="editMode" @click="ponistiIzmjene">❌ Odustani</button>
      </div>
    </div>

    <!-- Popis profesora -->
    <div class="card p-4 shadow-sm">
      <h5 class="mb-3 text-secondary">📋 Popis profesora</h5>
      <table class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th>Ime</th>
            <th>Prezime</th>
            <th>Email</th>
            <th>Kod</th>
            <th>Predmeti</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prof in profesori" :key="prof.id">
            <td>{{ prof.ime }}</td>
            <td>{{ prof.prezime }}</td>
            <td>{{ prof.email }}</td>
            <td>{{ prof.kod }}</td>
            <td>
              <ul class="mb-0">
                <li v-for="predmet in prof.Subjects" :key="predmet.id">{{ predmet.naziv }}</li>
              </ul>
            </td>
            <td>
              <button class="btn btn-warning btn-sm me-2" @click="urediProfesora(prof)">✏️</button>
              <button class="btn btn-danger btn-sm" @click="obrisiProfesora(prof.id)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminProfessors',
  data() {
    return {
      profesori: [],
      sviPredmeti: [],
      ime: '',
      prezime: '',
      email: '',
      kod: '',
      odabraniPredmeti: [],
      editMode: false,
      editId: null
    };
  },
  methods: {
    async dohvatiProfesore() {
      try {
        const res = await axios.get('http://localhost:3001/profesori-sve');
        this.profesori = res.data;
      } catch (err) {
        console.error('Greška pri dohvaćanju profesora:', err);
      }
    },
    async dohvatiPredmete() {
      try {
        const res = await axios.get('http://localhost:3001/subjects');
        this.sviPredmeti = res.data;
      } catch (err) {
        console.error('Greška pri dohvaćanju predmeta:', err);
      }
    },
    async dodajProfesora() {
      if (!this.ime || !this.prezime || !this.email || !this.kod || this.odabraniPredmeti.length === 0) {
        alert('Molimo ispuni sva polja i odaberi barem jedan predmet.');
        return;
      }

      try {
        await axios.post('http://localhost:3001/profesori', {
          ime: this.ime,
          prezime: this.prezime,
          email: this.email,
          kod: this.kod,
          subjectIds: this.odabraniPredmeti
        });

        this.resetForm();
        this.dohvatiProfesore();
      } catch (err) {
        console.error('Greška pri dodavanju profesora:', err);
      }
    },
    urediProfesora(prof) {
      this.editMode = true;
      this.editId = prof.id;
      this.ime = prof.ime;
      this.prezime = prof.prezime;
      this.email = prof.email;
      this.kod = prof.kod;
      this.odabraniPredmeti = prof.Subjects.map(p => p.id);
    },
    async spremiIzmjene() {
      try {
        await axios.put(`http://localhost:3001/profesori/${this.editId}`, {
          ime: this.ime,
          prezime: this.prezime,
          email: this.email,
          kod: this.kod,
          subjectIds: this.odabraniPredmeti
        });
        this.resetForm();
        this.dohvatiProfesore();
      } catch (err) {
        console.error('Greška pri spremanju izmjena:', err);
      }
    },
    async obrisiProfesora(id) {
      if (!confirm('Jesi siguran da želiš obrisati ovog profesora?')) return;
      try {
        await axios.delete(`http://localhost:3001/profesori/${id}`);
        this.dohvatiProfesore();
      } catch (err) {
        console.error('Greška pri brisanju profesora:', err);
      }
    },
    ponistiIzmjene() {
      this.resetForm();
    },
    resetForm() {
      this.ime = this.prezime = this.email = this.kod = '';
      this.odabraniPredmeti = [];
      this.editMode = false;
      this.editId = null;
    }
  },
  mounted() {
    this.dohvatiProfesore();
    this.dohvatiPredmete();
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
}
.table td, .table th {
  vertical-align: middle;
}
</style>
