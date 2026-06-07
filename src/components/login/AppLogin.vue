<script setup lang="ts">
import SplitLayout from '@/components/shared/SplitLayout.vue'
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.ts'

const router = useRouter()
const auth = useAuthStore()
const route = useRoute()

const email = ref<string>('')
const password = ref<string>('')

const errors = reactive<{ email: string | null; password: string | null }>({
  email: null,
  password: null,
})

function validate(): boolean {
  errors.email = null
  errors.password = null

  let valid = true

  if (!email.value) {
    errors.email = 'Email jest wymagany'
    valid = false
  }

  if (!password.value) {
    errors.password = 'Hasło jest wymagane'
    valid = false
  }

  return valid
}

const isFormValid = computed(() => {
  return email.value && password.value
})

const handleLogin = () => {
  if (!validate()) {
    return
  }

  const user = { jwt: 'real-jwt-from-api' }
  auth.setUser(user)

  const redirect = (route.query.redirect as string) || '/overview'
  router.push(redirect)
}

function onEmailInput() {
  if (errors.email) errors.email = null
}
function onPasswordInput() {
  if (errors.password) errors.password = null
}
</script>

<template>
  <SplitLayout>
    <template #left>
      <div class="d-flex flex-column align-items-left justify-content-center h-100 gap-4 content">
        <h1 class="display-6">Zaloguj się</h1>
        <form class="login-form" @submit.prevent="handleLogin" novalidate>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              type="email"
              class="form-control"
              :class="{ 'is-invalid': errors.email }"
              id="email"
              v-model="email"
              @input="onEmailInput"
              placeholder="Wpisz swój email"
              required
            />
            <div class="invalid-feedback" v-if="errors.email">{{ errors.email }}</div>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Hasło</label>
            <input
              type="password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              id="password"
              v-model="password"
              @input="onPasswordInput"
              placeholder="Wpisz swoje hasło"
              required
            />
            <div class="invalid-feedback" v-if="errors.password">{{ errors.password }}</div>
          </div>

          <button type="submit" class="btn btn-primary mt-3" :disabled="!isFormValid">
            Zaloguj się
          </button>
        </form>
      </div>
    </template>

    <template #right>
      <div class="image-container">
        <img src="../../resources/bg_2.png" alt="logo" height="100%" width="100%" />
      </div>
    </template>
  </SplitLayout>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.content {
  padding: 0 150px;
}

.image-container {
  position: relative;
  border-left: 1px $white solid;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
