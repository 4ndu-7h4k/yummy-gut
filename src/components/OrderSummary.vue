<template>
  <div
    v-if="cart.length > 0"
    class="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-20 safe-area-bottom"
  >
    <div class="px-6 py-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-sm text-gray-500 mb-1">Total Items</p>
          <p class="text-2xl font-bold text-gray-900">{{ totalItems }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500 mb-1">Grand Total</p>
          <p class="text-3xl font-bold text-blue-600">₹{{ grandTotal }}</p>
        </div>
      </div>

      <div class="flex gap-3">
        <Button
          label="Clear"
          icon="pi pi-trash"
          @click="$emit('clear')"
          severity="secondary"
          outlined
          size="small"
          class="flex-1"
        />
        <Button
          label="Save"
          icon="pi pi-save"
          @click="$emit('save-draft')"
          severity="secondary"
          size="small"
          class="flex-1"
        />
        <Button
          :label="isEditing ? 'Update Order' : 'Place Order'"
          icon="pi pi-check-circle"
          @click="$emit('place-order')"
          severity="primary"
          size="small"
          class="flex-1"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
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
  }
})

defineEmits(['clear', 'place-order', 'save-draft'])
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>

