<template>
  <div class="container my-5">
    <h2 class="text-center text-primary mb-4">👨‍🎓 Upravljanje studentima</h2>

    <div class="card shadow p-4 mb-5">
      <h4 class="mb-3">➕ Dodaj novog studenta</h4>
      <form @submit.prevent="dodajIliAzurirajStudenta">
        <div class="row g-3">
          <div class="col-md-3">
            <input v-model="noviStudent.ime" type="text" class="form-control" placeholder="Ime" required />
          </div>
          <div class="col-md-3">
            <input v-model="noviStudent.prezime" type="text" class="form-control" placeholder="Prezime" required />
          </div>
          <div class="col-md-3">
            <input v-model="noviStudent.email" type="email" class="form-control" placeholder="Email" required />
          </div>
          <div class="col-md-3">
            <select v-model="noviStudent.razred" class="form-select" required>
              <option disabled value="">Odaberi razred</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
        </div>
        <div class="mt-3 d-flex justify-content-between align-items-center">
          <button type="submit" class="btn btn-success">
            {{ noviStudent.id ? '💾 Spremi promjene' : '✅ Dodaj' }}
          </button>
          <span class="text-success">{{ poruka }}</span>
        </div>
      </form>
    </div>

    <div class="card shadow p-4">
      <h4 class="mb-3">📋 Popis studenata</h4>
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th>Ime</th>
            <th>Prezime</th>
            <th>Email</th>
            <th>Razred</th>
            <th>Kod</th>
            <th>Akcija</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in studenti" :key="student.id">
            <td>{{ student.ime }}</td>
            <td>{{ student.prezime }}</td>
            <td>{{ student.email }}</td>
            <td>{{ student.razred }}</td>
            <td>{{ student.kod }}</td>
            <td>
              <button class="btn btn-primary btn-sm me-2" @click="urediStudenta(student)">✏️ Uredi</button>
              <button class="btn btn-danger btn-sm" @click="obrisiStudenta(student.id)">🗑️ Obriši</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="studenti.length === 0" class="text-muted text-center">Nema dodanih studenata.</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted } from 'vue';

export default {
  name: 'AdminStudents',
  setup() {
    const studenti = ref([]);
    const poruka = ref('');
    const noviStudent = ref({ ime: '', prezime: '', email: '', razred: '' });

    const ucitajStudente = async () => {
      try {
        const res = await axios.get('http://localhost:3001/students');
        studenti.value = res.data;
      } catch (err) {
        console.error('Greška kod dohvaćanja studenata:', err);
      }
    };

    const dodajIliAzurirajStudenta = async () => {
      try {
        if (noviStudent.value.id) {
          await axios.put(`http://localhost:3001/students/${noviStudent.value.id}`, noviStudent.value);
          poruka.value = 'Promjene spremljene!';
        } else {
          await axios.post('http://localhost:3001/students', noviStudent.value);
          poruka.value = 'Student uspješno dodan!';
        }

        noviStudent.value = { ime: '', prezime: '', email: '', razred: '' };
        ucitajStudente();
      } catch (err) {
        console.error('Greška kod dodavanja ili ažuriranja:', err);
        poruka.value = 'Greška prilikom spremanja.';
      }
    };

    const urediStudenta = (student) => {
      noviStudent.value = { ...student }; // kopija
    };

    const obrisiStudenta = async (id) => {
      try {
        await axios.delete(`http://localhost:3001/students/${id}`);
        ucitajStudente();
      } catch (err) {
        console.error('Greška kod brisanja:', err);
      }
    };

    onMounted(ucitajStudente);

    return { studenti, noviStudent, poruka, dodajIliAzurirajStudenta, obrisiStudenta, urediStudenta };
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
}
input::placeholder {
  font-style: italic;
}
</style>
