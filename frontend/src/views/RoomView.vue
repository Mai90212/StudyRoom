<template>
  <div v-if="roomId" class="room-view">
    <Room
      :room-id="roomId"
      :user-id="userId"
      :invite-code="inviteCode"
      @leave="handleLeave"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Room from "../components/Room.vue";

const route = useRoute();
const router = useRouter();

const user = JSON.parse(localStorage.getItem("user") || "{}");
const userId = user.id || 1;
const roomId = ref(Number(route.query.roomId) || null);
const inviteCode = ref(route.query.inviteCode || "");

function handleLeave() {
  router.push("/lobby");
}
</script>

<style scoped>
.room-view {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
