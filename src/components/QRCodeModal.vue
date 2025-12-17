<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="false"
    :draggable="false"
    :style="{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' }"
    class="qr-modal fullscreen-modal"
    :pt="{
      root: { class: 'rounded-none' },
      content: { class: 'rounded-none' }
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-xl font-bold text-gray-900">QR Code</h3>
        <Button
          icon="pi pi-times"
          @click="close"
          text
          rounded
          severity="secondary"
        />
      </div>
    </template>

    <div class="space-y-4 h-full flex flex-col">
      <!-- Loading State -->
      <div v-if="loadingQR" class="text-center py-8">
        <ProgressSpinner />
        <p class="text-sm text-gray-600 mt-2">Loading QR code...</p>
      </div>

      <!-- Existing QR Code Display -->
      <div v-else-if="existingQRCode && !showReplaceOptions" class="flex flex-col h-full">
        <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">Yummy Gut Scan to Pay</h2>
        <div class="flex-1 flex items-center justify-center bg-white p-4 rounded-[16px] border-2 border-gray-200">
          <img
            :src="existingQRCode.public_url || existingQRCodeImage"
            alt="QR Code"
            class="w-full h-full object-contain"
            @error="handleImageError"
          />
        </div>
        <div class="text-center w-full mt-4">
          <p class="text-sm text-gray-600 mb-3">
            {{ countdown > 0 ? `Closing in ${countdown} seconds...` : 'QR Code will close automatically' }}
          </p>
          <div class="flex gap-2">
            <Button
              label="Replace"
              icon="pi pi-refresh"
              @click="showReplaceOptions = true"
              severity="secondary"
              outlined
              class="flex-1"
            />
            <Button
              label="Close"
              icon="pi pi-times"
              @click="close"
              severity="secondary"
              outlined
              class="flex-1"
            />
          </div>
        </div>
      </div>

      <!-- Mode Selection (when no QR exists or replacing) -->
      <div v-else-if="!existingQRCode || showReplaceOptions" class="flex gap-3">
        <Button
          label="Generate QR"
          icon="pi pi-qrcode"
          @click="showGenerateForm = true"
          severity="primary"
          class="flex-1"
        />
        <Button
          label="Upload Image"
          icon="pi pi-upload"
          @click="triggerFileUpload"
          severity="secondary"
          class="flex-1"
          outlined
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          class="hidden"
        />
        <Button
          v-if="showReplaceOptions"
          label="Cancel"
          icon="pi pi-times"
          @click="showReplaceOptions = false"
          severity="danger"
          outlined
          class="flex-1"
        />
      </div>

      <!-- Generate QR Form -->
      <div v-if="showGenerateForm && !qrDataUrl && !existingQRCode" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Enter text or URL to generate QR code:
          </label>
          <Textarea
            v-model="qrText"
            rows="3"
            placeholder="Enter text, URL, or any data..."
            class="w-full"
          />
        </div>
        <div class="flex gap-2">
          <Button
            label="Generate"
            icon="pi pi-check"
            @click="generateQR"
            :disabled="!qrText.trim()"
            severity="primary"
            class="flex-1"
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            @click="showGenerateForm = false"
            severity="secondary"
            outlined
            class="flex-1"
          />
        </div>
      </div>

      <!-- New QR Code Display (when generating/uploading new one) -->
      <div v-if="(qrDataUrl || uploadedImage) && !existingQRCode" class="flex flex-col h-full">
        <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">Yummy Gut Scan to Pay</h2>
        <div class="flex-1 flex items-center justify-center bg-white p-4 rounded-[16px] border-2 border-gray-200">
          <img
            :src="qrDataUrl || uploadedImage"
            alt="QR Code"
            class="w-full h-full object-contain"
          />
        </div>
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600 mb-2">
            {{ countdown > 0 ? `Closing in ${countdown} seconds...` : 'QR Code will close automatically' }}
          </p>
          <Button
            label="Close"
            icon="pi pi-times"
            @click="close"
            severity="secondary"
            outlined
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import { useQRCode } from '@/composables/useQRCode'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close', 'qr-generated', 'qr-uploaded', 'qr-updated'])

// Computed property for v-model binding
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const { fetchLatestQRCode } = useQRCode()

const qrDataUrl = ref(null)
const uploadedImage = ref(null)
const qrText = ref('')
const showGenerateForm = ref(false)
const fileInput = ref(null)
const countdown = ref(5)
const existingQRCode = ref(null)
const existingQRCodeImage = ref(null)
const loadingQR = ref(false)
const showReplaceOptions = ref(false)
let countdownTimer = null

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // Load existing QR code when modal opens
    await loadExistingQRCode()
    
    // Start countdown if QR code is displayed
    if (existingQRCode.value || qrDataUrl.value || uploadedImage.value) {
      startCountdown()
    }
  } else {
    // Reset when modal closes
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    showReplaceOptions.value = false
  }
})

watch([qrDataUrl, uploadedImage], () => {
  if ((qrDataUrl.value || uploadedImage.value) && isVisible.value) {
    // Clear existing QR when new one is generated/uploaded
    existingQRCode.value = null
    existingQRCodeImage.value = null
    showReplaceOptions.value = false
    startCountdown()
  }
})

const loadExistingQRCode = async (forceRefresh = false) => {
  loadingQR.value = true
  try {
    const latestQR = await fetchLatestQRCode(forceRefresh)
    if (latestQR && latestQR.public_url) {
      existingQRCode.value = latestQR
      existingQRCodeImage.value = latestQR.public_url
    } else {
      existingQRCode.value = null
      existingQRCodeImage.value = null
    }
  } catch (error) {
    console.error('Error loading existing QR code:', error)
    existingQRCode.value = null
    existingQRCodeImage.value = null
  } finally {
    loadingQR.value = false
  }
}

const handleImageError = () => {
  // If public URL fails, try to load from data URL if available
  if (existingQRCode.value?.qr_text && existingQRCode.value.type === 'generated') {
    // Could regenerate from text if needed
    console.warn('Failed to load QR code image from URL')
  }
}

const startCountdown = () => {
  countdown.value = 10
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      close()
    }
  }, 1000)
}

const generateQR = async () => {
  if (!qrText.value.trim()) return

  try {
    const dataUrl = await QRCode.toDataURL(qrText.value, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    qrDataUrl.value = dataUrl
    showGenerateForm.value = false
    
    // Emit event for saving if needed
    emit('qr-generated', {
      type: 'generated',
      text: qrText.value,
      dataUrl: dataUrl
    })
    
    // Reload existing QR code after saving (force refresh to get latest)
    setTimeout(async () => {
      await loadExistingQRCode(true)
      emit('qr-updated')
    }, 500)
  } catch (error) {
    console.error('Error generating QR code:', error)
    alert('Error generating QR code: ' + error.message)
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    
    // Emit event for uploading to Supabase if needed
    emit('qr-uploaded', {
      type: 'uploaded',
      file: file,
      dataUrl: e.target.result
    })
    
    // Reload existing QR code after saving (force refresh to get latest)
    setTimeout(async () => {
      await loadExistingQRCode(true)
      emit('qr-updated')
    }, 500)
  }
  reader.readAsDataURL(file)
}

const close = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  qrDataUrl.value = null
  uploadedImage.value = null
  qrText.value = ''
  showGenerateForm.value = false
  showReplaceOptions.value = false
  countdown.value = 5
  isVisible.value = false
  emit('close')
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.qr-modal :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.fullscreen-modal :deep(.p-dialog) {
  margin: 0 !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
}

.fullscreen-modal :deep(.p-dialog-content) {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}
</style>

