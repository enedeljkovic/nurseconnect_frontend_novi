<template>
  <div class="container my-5">
    <h2 class="mb-2 text-primary">📝 Dodaj novi kviz</h2>
    <h5 class="mb-4 text-muted">Predmet: {{ predmet }}</h5>

    <form @submit.prevent="spremiKviz">
      <div class="mb-3">
        <label class="form-label">Naziv kviza</label>
        <input v-model="naziv" type="text" class="form-control" placeholder="Npr. Anatomija 1" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Razred</label>
        <select v-model="razred" class="form-select" required>
          <option value="">Odaberi razred</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Maksimalan broj pokušaja</label>
        <input v-model.number="maxPokusaja" type="number" min="1" class="form-control" required />
      </div>

      <div v-for="(pitanje, idx) in pitanja" :key="idx" class="card mb-4 shadow-sm">
        <div class="card-body">
          <h5 class="card-title">Pitanje {{ idx + 1 }}</h5>

          <div class="mb-3">
            <label class="form-label">Vrsta pitanja</label>
            <select v-model="pitanje.type" class="form-select">
              <option value="multiple">Višestruki odabir</option>
              <option value="truefalse">Točno / Netočno</option>
              <option value="image">Tekst + slika</option>
              <option value="image-choice">Biranje više slika</option>
              <option value="hotspot">Hotspot (klik na sliku)</option>
            </select>
          </div>

          <div class="mb-3" v-if="pitanje.type !== 'truefalse' || true">
            <label class="form-label">Tekst pitanja</label>
            <input v-model="pitanje.question" type="text" class="form-control" required />
          </div>

          <div v-if="pitanje.type === 'multiple' || pitanje.type === 'image'">
            <div v-if="pitanje.type === 'image'" class="mb-3 text-center">
              <label class="form-label">Dodaj sliku</label>
              <input type="file" accept="image/*" class="form-control" @change="handleImageUpload($event, idx)" />
              <div v-if="pitanje.imagePreview" class="mt-2">
                <img :src="pitanje.imagePreview" class="img-thumbnail" style="max-width:500px;" />
              </div>
            </div>

            <label class="form-label">Odgovori</label>
            <div v-for="(opt, o) in pitanje.options" :key="o" class="input-group mb-2">
              <input v-model="pitanje.options[o]" type="text" class="form-control" />
              <button type="button" class="btn btn-outline-danger" @click="removeOption(idx, o)">🗑</button>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm mb-3" @click="addOption(idx)">+ Dodaj opciju</button>

            <div>
              <label class="form-label">Točni odgovori</label>
              <select v-model="pitanje.correct" multiple class="form-select">
                <option v-for="(opt, o) in pitanje.options" :key="o" :value="opt">{{ opt }}</option>
              </select>
              <small class="text-muted">Možete odabrati više točnih odgovora</small>
            </div>
          </div>

          <div v-else-if="pitanje.type === 'truefalse'" class="mb-3">
            <label class="form-label mt-3">Točan odgovor</label>
            <div class="form-check">
              <input v-model="pitanje.correct" class="form-check-input" type="radio" :id="`t${idx}`" value="T" />
              <label class="form-check-label" :for="`t${idx}`">Točno</label>
            </div>
            <div class="form-check">
              <input v-model="pitanje.correct" class="form-check-input" type="radio" :id="`n${idx}`" value="N" />
              <label class="form-check-label" :for="`n${idx}`">Netočno</label>
            </div>
          </div>

          <div v-else-if="pitanje.type === 'image-choice'" class="mb-3">
            <label class="form-label">Dodaj slike kao opcije</label>
            <input type="file" accept="image/*" multiple class="form-control mb-2" @change="handleImageChoiceUpload($event, idx)" />
            <div class="d-flex flex-wrap gap-3 mb-2">
              <img
                v-for="opt in pitanje.options"
                :key="opt.value"
                :src="opt.url"
                class="img-thumbnail"
                style="width:120px; cursor:pointer"
                :class="{ 'border border-success': pitanje.correct.includes(opt.value) }"
                @click="toggleImageChoice(idx, opt.value)"
              />
            </div>
            <small class="text-muted">Klikom označi ispravne slike</small>
          </div>

          <div v-else-if="pitanje.type === 'hotspot'" class="mb-3">
            <label class="form-label">Dodaj sliku za hotspot</label>
            <input type="file" accept="image/*" class="form-control mb-2" @change="handleHotspotImage($event, idx)" />
            <div v-if="pitanje.imagePreview" class="position-relative d-inline-block" @click="onHotspotClick($event, idx)">
              <img :src="pitanje.imagePreview" class="img-fluid" style="max-width:500px; cursor:crosshair;" />
              <div
                v-for="(hs, h) in pitanje.hotspots"
                :key="h"
                class="position-absolute rounded-circle"
                :style="{
                  width: hs.r*2 + 'px',
                  height: hs.r*2 + 'px',
                  top: hs.y - hs.r + 'px',
                  left: hs.x - hs.r + 'px',
                  border: '2px solid red'
                }"
              ></div>
            </div>
            <small class="text-muted d-block mt-2">Klikom označi svaku točku (hotspot)</small>
          </div>

          <button type="button" class="btn btn-sm btn-danger mt-3" @click="removePitanje(idx)">Ukloni pitanje</button>
        </div>
      </div>

      <button type="button" class="btn btn-outline-primary mt-2" @click="addPitanje">+ Dodaj pitanje</button>
      <button type="submit" class="btn btn-success w-100 mt-4">✅ Spremi kviz</button>
    </form>
  </div>
</template>



<script>
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';

export default {
  name: 'AddQuiz',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const predmet = route.query.predmet || 'Nepoznato';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const naziv = ref('');
    const razred = ref('');
    const maxPokusaja = ref(1);
    const pitanja = ref([]);

    const addPitanje = () => {
      pitanja.value.push({
        type: 'multiple',
        question: '',
        options: [''],
        correct: [],
        image: '',
        imagePreview: '',
        hotspots: []
      });
    };
    const removePitanje = i => pitanja.value.splice(i, 1);
    const addOption = (qi) => pitanja.value[qi].options.push('');
    const removeOption = (qi, oi) => pitanja.value[qi].options.splice(oi, 1);

    const handleImageUpload = (e, qi) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => {
        pitanja.value[qi].image = ev.target.result;
        pitanja.value[qi].imagePreview = ev.target.result;
      };
      r.readAsDataURL(f);
    };

    const handleImageChoiceUpload = async (e, qi) => {
  const files = Array.from(e.target.files);
  pitanja.value[qi].options = [];
  pitanja.value[qi].correct = [];

  for (const [i, f] of files.entries()) {
    const formData = new FormData();
    formData.append('file', f);

    try {
      const res = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      pitanja.value[qi].options.push({ url: res.data.fileUrl, value: `opt${i}` });
    } catch (err) {
      console.error('Greška pri uploadu slike:', err);
    }
  }
};
    const toggleImageChoice = (qi, val) => {
      const arr = pitanja.value[qi].correct;
      const idx = arr.indexOf(val);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(val);
    };

    // hotspot
    const onHotspotClick = (ev, qi) => {
      const rect = ev.currentTarget.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const r = 20;
      pitanja.value[qi].hotspots.push({ x, y, r });
    };
   const handleHotspotImage = (e, qi) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    pitanja.value[qi].image = ev.target.result;
    pitanja.value[qi].imagePreview = ev.target.result;
    pitanja.value[qi].hotspots = []; // ISPRAVKA
  };
  r.readAsDataURL(f);
};


    // spremi kviz
    const spremiKviz = async () => {
      try {
        await axios.post('http://localhost:3001/quizzes', {
          naziv: naziv.value,
          pitanja: pitanja.value,
          predmet,
          razred: razred.value,
          maxPokusaja: maxPokusaja.value,
          profesorId: user.id
        });
        router.push('/quizzes');
      } catch (err) {
        console.error('Greška pri spremanju kviza:', err);
        alert('❌ Došlo je do greške.');
      }
    };

    return {
      naziv,
      razred,
      maxPokusaja,
      pitanja,
      predmet,
      addPitanje,
      removePitanje,
      addOption,
      removeOption,
      handleImageUpload,
      handleImageChoiceUpload,
      toggleImageChoice,
      onHotspotClick,
      handleHotspotImage,
      spremiKviz
    };
  }
};
</script>

<style scoped>
.container { max-width: 800px; }
.card-title { color: #333; }
</style>
