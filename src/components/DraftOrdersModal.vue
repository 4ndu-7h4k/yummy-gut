<template>
  <Dialog
    :visible="true"
    :modal="true"
    :style="{ width: '100%', maxWidth: '100%' }"
    :pt="{
      root: { class: 'bottom-0 left-0 right-0 fixed m-0 rounded-t-3xl' },
      content: { class: 'rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col bg-white' }
    }"
    @update:visible="$emit('close')"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-xl font-bold text-gray-900">Draft Orders</h2>
        <Button
          icon="pi pi-times"
          text
          rounded
          @click="$emit('close')"
        />
      </div>
    </template>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="loading" class="text-center py-8 text-gray-600">
        <ProgressSpinner />
      </div>
      
      <div v-else-if="draftOrders.length === 0" class="text-center py-8 text-gray-500">
        No draft orders saved
      </div>

      <div v-else class="space-y-4">
        <Card
          v-for="draft in draftOrders"
          :key="draft.id"
          class="card-white"
        >
          <template #content>
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="font-semibold text-gray-900">{{ draft.name }}</h3>
                <p class="text-sm text-gray-500 mt-1">
                  {{ new Date(draft.updated_at).toLocaleString() }}
                </p>
              </div>
              <p class="text-lg font-bold text-blue-600">₹{{ parseFloat(draft.total_amount).toFixed(2) }}</p>
            </div>
            
            <div class="mb-4 pb-4 border-b border-gray-200">
              <p class="text-sm mb-2 text-gray-600">Items:</p>
              <div class="text-xs text-gray-500 space-y-1">
                <div v-for="(item, idx) in draft.items" :key="idx">
                  {{ item.name }} × {{ item.quantity }} @ ₹{{ parseFloat(item.price).toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <Button
                label="Load"
                icon="pi pi-upload"
                @click="$emit('load-draft', draft)"
                severity="primary"
                outlined
                class="flex-1"
              />
              <Button
                label="Delete"
                icon="pi pi-trash"
                @click="handleDelete(draft.id)"
                severity="danger"
                class="flex-1"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDraftOrders } from '@/composables/useDraftOrders'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()

const { draftOrders, loading, fetchDraftOrders, deleteDraft } = useDraftOrders()

onMounted(() => {
  fetchDraftOrders()
})

const handleDelete = async (id) => {
  if (confirm('Delete this draft?')) {
    try {
      await deleteDraft(id)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Draft deleted successfully', life: 3000 })
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting draft: ' + error.message, life: 5000 })
    }
  }
}

defineEmits(['close', 'load-draft'])
</script>
