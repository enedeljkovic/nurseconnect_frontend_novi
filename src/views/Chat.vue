<template>
  <div class="container my-5">
    <h2 class="mb-4 text-primary text-center">📬 Chat s profesorima</h2>

    <div class="mb-4">
      <label class="form-label">Odaberi profesora:</label>
      <select v-model="selectedRecipientId" class="form-select" @change="fetchMessages">
        <option disabled value="">-- Odaberi --</option>
        <option
          v-for="prof in professors"
          :key="prof.id"
          :value="prof.id"
        >
          {{ prof.ime }} {{ prof.prezime }}
          <span v-if="unreadMessages[prof.id]" class="text-danger">({{ unreadMessages[prof.id] }} nova)</span>
        </option>
      </select>
    </div>

    <div class="chat-box mb-3 p-3 rounded shadow-sm">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message-bubble', msg.senderId === currentUserId ? 'sent' : 'received']"
      >
        <p class="mb-1"><strong>{{ msg.senderId === currentUserId ? 'Vi' : 'On' }}:</strong> {{ msg.content }}</p>
        <small class="text-muted">{{ formatTimestamp(msg.timestamp) }}</small>
      </div>
    </div>

    <div class="input-group">
      <input
        v-model="newMessage"
        type="text"
        class="form-control"
        placeholder="Upiši poruku..."
        @keyup.enter="sendMessage"
      />
      <button class="btn btn-primary" @click="sendMessage">Pošalji</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted, watch } from 'vue';

export default {
  name: 'Chat',
  setup() {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser?.id;

    const professors = ref([]);
    const selectedRecipientId = ref('');
    const messages = ref([]);
    const newMessage = ref('');
    const unreadMessages = ref({});

    const fetchProfessors = async () => {
      const res = await axios.get('http://localhost:3001/profesori');
      professors.value = res.data.filter(p => p.id !== currentUserId);
      await fetchUnreadCounts();
    };

    const fetchUnreadCounts = async () => {
      const res = await axios.get(`http://localhost:3001/messages/unread/${currentUserId}`);
      unreadMessages.value = res.data;
    };

    const fetchMessages = async () => {
      if (!selectedRecipientId.value) return;

      await axios.post('http://localhost:3001/messages/mark-read', {
        senderId: selectedRecipientId.value,
        receiverId: currentUserId
      });

      const res = await axios.get(`http://localhost:3001/messages/${currentUserId}/${selectedRecipientId.value}`);
      messages.value = res.data;
      await fetchUnreadCounts();
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !selectedRecipientId.value) return;
      await axios.post('http://localhost:3001/messages', {
        senderId: currentUserId,
        receiverId: selectedRecipientId.value,
        content: newMessage.value
      });
      newMessage.value = '';
      fetchMessages();
    };

    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} u ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    onMounted(() => {
      fetchProfessors();
    });

    return {
      currentUserId,
      professors,
      selectedRecipientId,
      messages,
      newMessage,
      fetchMessages,
      sendMessage,
      unreadMessages,
      formatTimestamp
    };
  }
};
</script>

<style scoped>
.chat-box {
  background-color: #f8f9fa;
  height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
}

.message-bubble {
  max-width: 75%;
  padding: 0.6rem 1rem;
  margin: 0.4rem 0;
  border-radius: 15px;
  position: relative;
  word-break: break-word;
}

.sent {
  background-color: #d1e7dd;
  align-self: flex-end;
  margin-left: auto;
  text-align: right;
}

.received {
  background-color: #f8d7da;
  align-self: flex-start;
  margin-right: auto;
  text-align: left;
}
</style>
