<template>
  <div
    v-if="cart.length > 0"
    class="fixed bottom-22 border-t border-gray-200 mx-3 left-0 right-0 bg-white z-20 safe-area-bottom rounded-[20px]"
  >
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 mb-3">Total Items</p>
          <p class="text-2xl font-bold text-gray-900">{{ totalItems }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500 mb-1">Grand Total</p>
          <p class="text-3xl font-bold text-blue-600">₹{{ grandTotal }}</p>
        </div>
      </div>

      <div class="flex gap-3">
        <Button
          icon="pi pi-trash"
          @click="$emit('clear')"
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
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['clear', 'place-order', 'save-draft'])
</script>

<style scoped>

</style>

