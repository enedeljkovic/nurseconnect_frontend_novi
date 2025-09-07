<template>
  <div class="login-page">
    <div class="login-box">
      <h1>NurseConnect</h1>
      <p class="tagline">Igram se i učim</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="Unesi email"
            required
            :disabled="isLoading"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="kod">Kod</label>
          <input
            v-model="kod"
            type="password"
            id="kod"
            placeholder="Unesi kod"
            required
            :disabled="isLoading"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" :disabled="isLoading">
          <span v-if="!isLoading">Prijavi se</span>
          <span v-else>Prijava u tijeku…</span>
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <p class="switch-mode" @click="!isLoading && toggleMode()">
        Trenutno se prijavljuješ kao <strong>{{ isProfesor ? 'profesor' : 'učenik' }}</strong>.
        Klikni za prijavu kao {{ isProfesor ? 'učenik' : 'profesor' }}.
      </p>

      <p class="admin-login" @click="!isLoading && goToAdminLogin()">
        🔐 Prijava kao admin
      </p>
    </div>

    <!-- Loader overlay -->
    <div v-if="isLoading" class="nc-fullscreen-loader" role="alert" aria-busy="true">
      <div class="nc-loader-box">
        <div class="nc-spinner" aria-hidden="true"></div>
        <div class="nc-loader-text">Pričekajte… prijava u tijeku</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const kod = ref('');
    const error = ref('');
    const isProfesor = ref(false);
    const isLoading = ref(false);
    const router = useRouter();

    const handleLogin = async () => {
      if (isLoading.value) return; // spriječi dvoklik
      error.value = '';
      isLoading.value = true;
      document.documentElement.style.cursor = 'wait';

      try {
        const url = isProfesor.value
          ? 'http://localhost:3001/login-profesor'
          : 'http://localhost:3001/login';

        const response = await axios.post(url, { kod: kod.value });

        const korisnik = isProfesor.value ? response.data.profesor : response.data.student;

        if (!korisnik?.id) {
          error.value = 'Greška: Neispravni podaci.';
          return;
        }

        if (korisnik.email !== email.value) {
          error.value = 'Email i kod se ne podudaraju.';
          return;
        }

        localStorage.setItem('user', JSON.stringify(korisnik));
        localStorage.setItem('isProfesor', isProfesor.value.toString());

        if (!isProfesor.value && korisnik.razred) {
          localStorage.setItem('razred', korisnik.razred);
        }

        router.push('/home');
      } catch (err) {
        error.value = err.response?.data?.error || 'Greška prilikom prijave.';
      } finally {
        isLoading.value = false;
        document.documentElement.style.cursor = '';
      }
    };

    const toggleMode = () => {
      isProfesor.value = !isProfesor.value;
    };

    const goToAdminLogin = () => {
      router.push({ name: 'AdminLogin' });
    };

    return {
      email,
      kod,
      handleLogin,
      error,
      isProfesor,
      toggleMode,
      goToAdminLogin,
      isLoading
    };
  }
};
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f4f9ff;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-box h1 {
  margin-bottom: 0.5rem;
  color: #0077cc;
}

.tagline {
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  color: #555;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  width: 100%;
  padding: 0.6rem;
  background-color: #0077cc;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

button:hover {
  background-color: #005fa3;
}

.switch-mode,
.admin-login {
  margin-top: 15px;
  font-size: 0.9rem;
  color: #0077cc;
  cursor: pointer;
  text-decoration: underline;
}

.switch-mode:hover,
.admin-login:hover {
  color: #005fa3;
}

.error {
  margin-top: 1rem;
  color: red;
  font-weight: bold;
}

/* Loader styles */
.nc-fullscreen-loader{
  position: fixed; inset: 0;
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(2px);
  display: grid; place-items: center;
  z-index: 2000;
}
.nc-loader-box{
  background: #fff;
  padding: 20px 24px;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0,0,0,.12);
  display: flex; align-items: center; gap: 12px;
}
.nc-spinner{
  width: 26px; height: 26px;
  border: 3px solid #e5e7eb;
  border-top-color: #0d6efd;
  border-radius: 50%;
  animation: ncspin .8s linear infinite;
}
.nc-loader-text{
  font-weight: 600; color: #0d6efd;
}
@keyframes ncspin { to { transform: rotate(360deg); } }
</style>
