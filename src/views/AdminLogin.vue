<template>
  <div class="admin-login-page">
    <div class="login-box">
      <h2>🔐 Admin Prijava</h2>

      <form @submit.prevent="handleAdminLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input v-model="email" type="email" id="email" required placeholder="Unesi admin email" />
        </div>

        <div class="form-group">
          <label for="password">Lozinka</label>
          <input v-model="password" type="password" id="password" required placeholder="Unesi lozinku" />
        </div>

        <button type="submit">Prijavi se kao admin</button>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>

      <p class="back-to-login" @click="goBack">⬅ Natrag na login</p>
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
    const router = useRouter();

    const handleAdminLogin = async () => {
      error.value = '';
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
      goBack
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
</style>
