<template>
  <Card class="card-white p-0">
    <template #content>
      <div class="flex flex-col gap-3 ">
        <div class="flex-1">
          <h3 class="font-semibold text-lg mb-2 text-gray-900">{{ item.name }}</h3>
          <p class="text-blue-600 font-bold text-xl mb-1">₹{{ parseFloat(item.price).toFixed(2) }}</p>
          <p v-if="item.stock_quantity !== null" class="text-xs text-gray-500">
            Stock: {{ item.stock_quantity }}
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
            class="w-12 h-12 flex-shrink-0"
          />
          
          <div class="flex-1 text-center min-w-[30px]">
            <span class="text-2xl font-bold text-gray-900">{{ quantity }}</span>
          </div>
          
          <Button
            icon="pi pi-plus"
            @click="$emit('add')"
            :disabled="item.stock_quantity !== null && quantity >= item.stock_quantity"
            severity="primary"
            rounded
            size="small"
            class="w-12 h-12 flex-shrink-0"
          />
        </div>

        <div v-if="quantity > 0" class="pt-3 border-t border-gray-200">
          <p class="text-sm text-center text-gray-600">
            Subtotal: <span class="font-semibold text-gray-900">₹{{ (item.price * quantity).toFixed(2) }}</span>
          </p>
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
