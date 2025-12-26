<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <Card class="w-full max-w-md">
      <template #content>
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p class="text-gray-600">Sign in to access the POS system</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Username / Email
            </label>
            <InputText
              id="username"
              v-model="username"
              type="text"
              placeholder="Enter your username"
              class="w-full"
              :class="{ 'p-invalid': errors.username }"
              autocomplete="username"
            />
            <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              :feedback="false"
              toggleMask
              autocomplete="current-password"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>

          <Button
            type="submit"
            label="Sign In"
            icon="pi pi-sign-in"
            class="w-full"
            :loading="loading"
            :disabled="loading"
          />
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()
const toast = useToast()
const { signIn } = useAuth()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!username.value.trim()) {
    errors.value.username = 'Username is required'
  }
  
  if (!password.value) {
    errors.value.password = 'Password is required'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleLogin = async () => {
  errorMessage.value = ''
  errors.value = {}
  
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    await signIn(username.value.trim(), password.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Logged in successfully',
      life: 3000
    })
    router.push('/')
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Invalid username or password'
    toast.add({
      severity: 'error',
      summary: 'Login Failed',
      detail: error.message || 'Invalid username or password',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.p-card) {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

:deep(.p-inputtext),
:deep(.p-password-input) {
  width: 100%;
}
</style>

