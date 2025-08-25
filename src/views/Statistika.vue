<template>
  <div class="statistika-container">
    <h2>📊 Detaljna statistika kvizova</h2>

    <div v-for="quiz in kvizovi" :key="quiz.id" class="quiz-card">
      <h3 class="quiz-title">{{ quiz.naziv }} ({{ quiz.razred }})</h3>
      <p><strong>Ukupno pokušaja:</strong> {{ quiz.pokusaji.length }}</p>
      <p><strong>Prosjek točnosti:</strong> {{ quiz.prosjek }}%</p>

      <table v-if="quiz.pokusaji.length > 0" class="quiz-table">
        <thead>
          <tr>
            <th>Ime učenika</th>
            <th>Točno</th>
            <th>Netočno</th>
            <th>Datum</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pokusaj in quiz.pokusaji" :key="pokusaj.id">
            <td>{{ pokusaj.student.ime }} {{ pokusaj.student.prezime }}</td>
            <td>{{ pokusaj.result }}</td>
            <td>{{ pokusaj.total - pokusaj.result }}</td>
            <td>{{ new Date(pokusaj.solvedAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-attempts">Nema riješenih pokušaja.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const user = JSON.parse(localStorage.getItem('user') || '{}');
const kvizovi = ref([]);

onMounted(async () => {
  try {
    const res = await axios.get(`http://localhost:3001/profesori/${user.id}/quiz-statistics`);
    const summary = res.data;

    const detalji = await Promise.all(
      summary.map(async (kviz) => {
        const detaljiRes = await axios.get(`http://localhost:3001/api/v1/quiz/${kviz.id}/detalji`);
        return {
          ...kviz,
          pokusaji: detaljiRes.data.pokusaji || []
        };
      })
    );

    kvizovi.value = detalji;
  } catch (err) {
    console.error('Greška pri dohvaćanju detaljne statistike:', err);
  }
});
</script>

<style scoped>
.statistika-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f9ffff;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.1);
}

.quiz-card {
  background: white;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 10px;
  border-left: 5px solid #0077cc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.quiz-title {
  color: #0077cc;
  margin-bottom: 0.5rem;
}

.quiz-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.quiz-table th,
.quiz-table td {
  border: 1px solid #ccc;
  padding: 0.75rem;
  text-align: left;
}

.quiz-table th {
  background-color: #e6f2ff;
}

.quiz-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.no-attempts {
  color: #888;
  margin-top: 1rem;
  font-style: italic;
}
</style>