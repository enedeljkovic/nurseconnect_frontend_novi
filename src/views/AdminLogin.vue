<template>
  <div class="admin-login-page">
    <div class="login-box">
      <h2>🔐 Admin Prijava</h2>

      <form @submit.prevent="handleAdminLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            required
            placeholder="Unesi admin email"
            :disabled="isLoading"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Lozinka</label>
          <input
            v-model="password"
            type="password"
            id="password"
            required
            placeholder="Unesi lozinku"
            :disabled="isLoading"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" :disabled="isLoading">
          <span v-if="!isLoading">Prijavi se kao admin</span>
          <span v-else>Prijava u tijeku…</span>
        </button>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>

      <p class="back-to-login" @click="!isLoading && goBack()">⬅ Natrag na login</p>
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
  name: 'AdminLogin',
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const isLoading = ref(false);
    const router = useRouter();

    const handleAdminLogin = async () => {
      if (isLoading.value) return;
      error.value = '';
      isLoading.value = true;
      document.documentElement.style.cursor = 'wait';

      try {
        const res = await axios.post('http://localhost:3001/admin/login', {
          email: email.value,
          password: password.value
        });

        const admin = res.data.admin;
        localStorage.setItem('user', JSON.stringify({ id: 'admin', role: 'admin' }));
        localStorage.setItem('adminToken', res.data.token);

        router.push('/admin-panel');
      } catch (err) {
        error.value = err.response?.data?.error || 'Greška prilikom prijave.';
      } finally {
        isLoading.value = false;
        document.documentElement.style.cursor = '';
      }
    };

    const goBack = () => {
      router.push('/login');
    };

    return {
      email,
      password,
      handleAdminLogin,
      error,
      goBack,
      isLoading
    };
  }
};
</script>

<style scoped>
.admin-login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f8fa;
  height: 100vh;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h2 {
  color: #0077cc;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
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

.error-msg {
  color: red;
  margin-top: 1rem;
  font-weight: 500;
}

.back-to-login {
  margin-top: 1.5rem;
  color: #0077cc;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
}

.back-to-login:hover {
  color: #005fa3;
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
