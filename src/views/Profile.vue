<template>
  <div class="profile-page">
    <div class="profile-header">
      <img src="https://cdn-icons-png.flaticon.com/512/847/847969.png" alt="avatar" class="avatar" />
      <div class="header-text">
        <h2>{{ user?.ime }} {{ user?.prezime }}</h2>
        <p class="role">{{ isProfesor ? 'Profesor' : 'Učenik' }}</p>
      </div>
    </div>

    <div class="profile-details">
      <p><strong>Email:</strong> {{ user?.email || 'N/A' }}</p>
      <p><strong>Ime:</strong> {{ user?.ime || 'N/A' }}</p>
      <p><strong>Prezime:</strong> {{ user?.prezime || 'N/A' }}</p>
    </div>

    
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'Profile',
  setup() {
    const isProfesor = ref(localStorage.getItem('isProfesor') === 'true');
    const user = ref(null);

    onMounted(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser);
        } catch (err) {
          console.error('Neispravan JSON iz localStorage:', err);
        }
      }
    });

    return {
      user,
      isProfesor
    };
  }
};
</script>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 3rem auto;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #0077B6;
}

.header-text h2 {
  margin: 0;
  color: #0077B6;
}

.role {
  font-weight: 500;
  color: #555;
  font-size: 0.95rem;
}

.profile-details p {
  font-size: 1.05rem;
  margin: 0.8rem 0;
  color: #333;
}

.settings-link {
  display: inline-block;
  margin-top: 1.5rem;
  background-color: #0077B6;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
}
.settings-link:hover {
  background-color: #005f8a;
}
</style>
