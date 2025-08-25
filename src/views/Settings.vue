<template>
  <div class="settings-page">
    <div class="settings-header">
      <button @click="goBack" class="back-button">&lt; Natrag</button>
      <h2>{{ language === 'hr' ? 'Postavke' : 'Settings' }}</h2>
    </div>

    <div class="settings-list">
      <div>
        {{ language === 'hr' ? 'Tema' : 'Theme' }}:
        <label class="switch">
          <input type="checkbox" v-model="darkMode" @change="applyTheme" />
          <span class="slider"></span>
        </label>
      </div>
      <div>
        {{ language === 'hr' ? 'Jezik' : 'Language' }}:
        <select v-model="language" @change="saveToStorage">
          <option value="hr">Hrvatski</option>
          <option value="en">English</option>
        </select>
      </div>
      <div>
        {{ language === 'hr' ? 'Obavijesti' : 'Notifications' }}:
        <label class="switch">
          <input type="checkbox" v-model="notificationsEnabled" @change="saveToStorage" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <button class="save-button" @click="saveChanges">{{ language === 'hr' ? 'Spremi promjene' : 'Save changes' }}</button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'Settings',
  setup() {
    const router = useRouter();
    const darkMode = ref(false);
    const notificationsEnabled = ref(true);
    const language = ref('hr');

    const applyTheme = () => {
      if (darkMode.value) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      saveToStorage();
    };

    const goBack = () => router.push('/home');

    const saveToStorage = () => {
      localStorage.setItem('darkMode', JSON.stringify(darkMode.value));
      localStorage.setItem('language', language.value);
      localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled.value));
    };

    const saveChanges = () => {
      saveToStorage();
      alert(language.value === 'hr' ? 'Postavke su spremljene.' : 'Settings saved.');
    };

    onMounted(() => {
      darkMode.value = JSON.parse(localStorage.getItem('darkMode')) || false;
      language.value = localStorage.getItem('language') || 'hr';
      notificationsEnabled.value = JSON.parse(localStorage.getItem('notificationsEnabled')) || true;
      applyTheme();
    });

    return {
      goBack,
      saveChanges,
      darkMode,
      notificationsEnabled,
      language,
      applyTheme
    };
  }
};
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: auto;
  padding: 1rem;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  background: none;
  border: none;
  color: #0077B6;
  font-size: 1rem;
  cursor: pointer;
}

.settings-list > div {
  padding: 1rem;
  background: #f0f9ff;
  margin-bottom: 1rem;
  border-radius: 10px;
  cursor: default;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-list select {
  padding: 0.4rem;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.save-button {
  background-color: #3B9A57;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: block;
  margin: auto;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  border-radius: 34px;
  transition: 0.4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}
input:checked + .slider {
  background-color: #0077B6;
}
input:checked + .slider:before {
  transform: translateX(20px);
}

/* Global dark mode styles */
:global(body.dark-mode) {
  background-color: #1e1e1e;
  color: #f5f5f5;
}

:global(body.dark-mode) a {
  color: #66d9ef;
}

:global(body.dark-mode) input,
:global(body.dark-mode) select,
:global(body.dark-mode) textarea {
  background-color: #2c2c2c;
  color: #fff;
  border: 1px solid #555;
}
</style>
