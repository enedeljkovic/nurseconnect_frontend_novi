<template>
  <div class="login-page">
    <div class="login-box">
      <h1>NurseConnect</h1>
      <p class="tagline">Igram se i učim</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input v-model="email" type="email" id="email" placeholder="Unesi email" required />
        </div>

        <div class="form-group">
          <label for="kod">Kod</label>
          <input v-model="kod" type="password" id="kod" placeholder="Unesi kod" required />
        </div>

        <button type="submit">Prijavi se</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <p class="switch-mode" @click="toggleMode">
        Trenutno se prijavljuješ kao <strong>{{ isProfesor ? 'profesor' : 'učenik' }}</strong>.
        Klikni za prijavu kao {{ isProfesor ? 'učenik' : 'profesor' }}.
      </p>

      <p class="admin-login" @click="goToAdminLogin">
        🔐 Prijava kao admin
      </p>
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
    const router = useRouter();

    const handleLogin = async () => {
      error.value = '';
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
      goToAdminLogin
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
</style>
