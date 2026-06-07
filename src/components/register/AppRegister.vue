<script setup lang="ts">
import SplitLayout from '@/components/shared/SplitLayout.vue'
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref<string>('')
const password = ref<string>('')
const passwordConfirm = ref<string>('')

const errors = reactive<{
  email: string | null
  password: string | null
  passwordConfirm: string | null
}>({
  email: null,
  password: null,
  passwordConfirm: null,
})

function validate(): boolean {
  errors.email = null
  errors.password = null
  errors.passwordConfirm = null

  let valid = true

  if (!email.value) {
    errors.email = 'Email jest wymagany'
    valid = false
  }

  if (!password.value) {
    errors.password = 'Hasło jest wymagane'
    valid = false
  } else if (password.value.length < 6) {
    errors.password = 'Hasło musi mieć co najmniej 6 znaków'
    valid = false
  }

  if (!passwordConfirm.value) {
    errors.passwordConfirm = 'Potwierdzenie hasła jest wymagane'
    valid = false
  } else if (password.value !== passwordConfirm.value) {
    errors.passwordConfirm = 'Hasła nie są identyczne'
    valid = false
  }

  return valid
}

const isFormValid = computed(() => {
  return (
    email.value &&
    password.value &&
    passwordConfirm.value &&
    !errors.email &&
    !errors.password &&
    !errors.passwordConfirm
  )
})
const handleLogin = () => {
  if (!validate()) {
    return
  }
  router.push({ name: 'Overview' })
}

function onEmailInput() {
  if (errors.email) errors.email = null
}
function onPasswordInput() {
  if (errors.password) errors.password = null
}

function onPasswordConfirmInput() {
  if (errors.passwordConfirm) errors.passwordConfirm = null
}
</script>

<template>
  <SplitLayout>
    <template #left>
      <div class="image-container">
        <img src="../../resources/bg_1.png" alt="logo" height="100%" width="100%" />
      </div>
    </template>

    <template #right>
      <div class="d-flex flex-column align-items-left justify-content-center h-100 gap-4 content">
        <form class="login-form" @submit.prevent="handleLogin" novalidate>
          <h1 class="display-6">Utwórz konto</h1>
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

          <div class="mb-3">
            <label for="password" class="form-label">Powtórz hasło</label>
            <input
              type="password"
              class="form-control"
              id="password"
              v-model="passwordConfirm"
              @input="onPasswordConfirmInput"
              :class="{ 'is-invalid': errors.passwordConfirm }"
              placeholder="Wpisz hasło ponownie"
              required
            />
            <div class="invalid-feedback" v-if="errors.passwordConfirm">
              {{ errors.passwordConfirm }}
            </div>
          </div>

          <button type="submit" class="btn btn-primary mt-3" :disabled="!isFormValid">
            Zarejestruj
          </button>
        </form>
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
  border-right: 1px $white solid;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
