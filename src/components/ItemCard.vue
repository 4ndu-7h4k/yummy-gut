<template>
  <Card :class="['card-white p-0', { 'item-highlighted': quantity > 0 }]">
    <template #content>
      <div class="flex flex-col gap-3 ">
        <div class="flex-1">
          <h3 class="font-semibold text-lg mb-2 text-gray-900">{{ item.name }}</h3>
          <p class="text-blue-600 font-bold text-xl mb-1">₹{{ item.price * quantity }}</p>
          <p v-if="item.available_stock !== null" class="text-xs text-gray-500">
            Available: {{ item.available_stock - quantity }} - <span class="text-lg font-bold text-green-600">₹{{ parseInt(item.price) }}</span>
          </p>
        </div>

        <div class="flex items-center justify-between gap-4">
          <Button
            icon="pi pi-minus"
            @click="$emit('remove')"
            :disabled="quantity === 0"
            severity="secondary"
            rounded
            size="small"
            outlined
            class="w-12 h-12 flex-shrink-0 touch-manipulation"
          />
          
          <div class="flex-1 text-center min-w-[30px]">
            <span class="text-2xl font-bold text-gray-900">{{ quantity }}</span>
          </div>
          
          <Button
            icon="pi pi-plus"
            @click="$emit('add')"
            :disabled="item.available_stock !== null && quantity >= item.available_stock"
            severity="primary"
            rounded
            size="small"
            class="w-12 h-12 flex-shrink-0 touch-manipulation"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import Card from 'primevue/card'
import Button from 'primevue/button'

defineProps({
  item: {
    type: Object,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  }
})

defineEmits(['add', 'remove'])
</script>

<style scoped>
/* iOS-style smooth transitions */
:deep(.p-card) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.item-highlighted {
  background: linear-gradient(135deg, #e3fdf5 0%, #f0fff5 100%) !important;
}

.item-highlighted :deep(.p-card-body) {
  background: transparent !important;
}

.card-white {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
</style>
