<template>
  <div
    v-if="cart.length > 0"
    class="fixed bottom-22 border-t border-gray-200 mx-3 left-0 right-0 bg-white z-20 safe-area-bottom rounded-[20px]"
  >
    <div class="px-6 py-4">
      <!-- Cash Amount, Balance and Grand Total -->
      <div class="flex items-center justify-between mb-3">
        <div>
          <!-- Cash Buttons - Scrollable -->
          <div class="mb-2">
            <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style="scrollbar-width: none; -ms-overflow-style: none;">
              <Button
                v-for="amount in cashDenominations"
                :key="amount"
                :label="`₹${amount}`"
                @click="selectCash(amount)"
                :severity="selectedCash === amount ? 'primary' : 'secondary'"
                :outlined="selectedCash !== amount"
                size="small"
                class="shrink-0 rounded-[999px]!"
              />
            </div>
          </div>
          <div v-if="selectedCash > 0">
            <p class="text-lg font-bold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
              ₹{{ balance.toFixed(2) }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500 mb-1">Grand Total</p>
          <p class="text-3xl font-bold text-blue-600">₹{{ grandTotal }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <Button
          icon="pi pi-trash"
          @click="handleClear"
          severity="danger"
          outlined
          size="small"
          class="flex-1 rounded-[999px]!"
        />
        <Button
          icon="pi pi-save"
          @click="$emit('save-draft')"
          severity="secondary"
          size="small"
          class="flex-1"
        />
          <Button
            :label="isEditing ? 'Update Order' : 'Place Order'"
            :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"
            @click="$emit('place-order')"
            severity="primary"
            size="small"
            :disabled="loading"
            class="flex-2 fle"
          />
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  cart: {
    type: Array,
    required: true
  },
  grandTotal: {
    type: String,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clear', 'place-order', 'save-draft'])

const cashDenominations = [100, 200, 500, 1000]
const selectedCash = ref(0)

const balance = computed(() => {
  const total = parseFloat(props.grandTotal) || 0
  return selectedCash.value - total
})

const selectCash = (amount) => {
  // Toggle selection - if same amount clicked, deselect
  selectedCash.value = selectedCash.value === amount ? 0 : amount
}

// Reset cash when cart is cleared
const handleClear = () => {
  selectedCash.value = 0
  emit('clear')
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>

