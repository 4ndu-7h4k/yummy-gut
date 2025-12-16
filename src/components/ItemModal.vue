<template>
  <Dialog
    :visible="true"
    :modal="true"
    :style="{ width: '100%', maxWidth: '100%' }"
    :pt="{
      root: { class: 'bottom-0 left-0 right-0 fixed m-0 rounded-t-3xl' },
      content: { class: 'rounded-t-3xl bg-white' }
    }"
    @update:visible="$emit('close')"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-xl font-bold text-gray-900">
          {{ item ? 'Edit Item' : 'Add Item' }}
        </h2>
        <Button
          icon="pi pi-times"
          text
          rounded
          @click="$emit('close')"
        />
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2 text-gray-700">
          Name *
        </label>
        <InputText
          v-model="formData.name"
          placeholder="e.g., Bun, Chai"
          required
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2 text-gray-700">
          Price (₹) *
        </label>
        <InputNumber
          v-model="formData.price"
          mode="decimal"
          :min="0"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="0.00"
          required
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2 text-gray-700">
          Stock Quantity (optional)
        </label>
        <InputNumber
          v-model="formData.stock_quantity"
          :min="0"
          placeholder="Leave empty for unlimited"
          class="w-full"
        />
      </div>

      <div class="flex items-center">
        <Checkbox
          v-model="formData.is_active"
          inputId="is_active"
          binary
        />
        <label for="is_active" class="ml-2 text-sm text-gray-700">
          Active (visible in POS)
        </label>
      </div>

      <div class="flex gap-3 pt-4">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="$emit('close')"
          class="flex-1"
        />
        <Button
          :label="item ? 'Update' : 'Add'"
          type="submit"
          severity="primary"
          class="flex-1"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'

const props = defineProps({
  item: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const formData = ref({
  name: '',
  price: 0,
  stock_quantity: null,
  is_active: true
})

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value = {
      name: newItem.name,
      price: parseFloat(newItem.price),
      stock_quantity: newItem.stock_quantity,
      is_active: newItem.is_active
    }
  } else {
    formData.value = {
      name: '',
      price: 0,
      stock_quantity: null,
      is_active: true
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  const data = {
    name: formData.value.name.trim(),
    price: formData.value.price,
    stock_quantity: formData.value.stock_quantity || null,
    is_active: formData.value.is_active
  }
  emit('save', data)
}
</script>
