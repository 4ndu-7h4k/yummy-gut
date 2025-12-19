<template>
  <div class="h-screen flex flex-col pb-20">
    <!-- Header -->
    <div class=" sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-1">
        <h1 class="text-2xl font-bold text-gray-900">Items</h1>
        <div class="flex gap-3">
          <Button
            v-if="isSupported()"
            :icon="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
            @click="toggleFullscreen"
            severity="secondary"
            size="small"
            outlined
            :pt="{ root: { class: 'px-2' } }"
            v-tooltip.top="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
          />
          <Button
            label="Add"
            icon="pi pi-plus"
            @click="showAddModal = true"
            severity="secondary"
            size="small"
            outlined
          />
          <router-link to="/">
            <Button
              label="POS"
              icon="pi pi-shopping-cart"
              severity="secondary"
              size="small"
              outlined
            />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Items List -->
    <div class="p-4 space-y-4 bg-[#F5F5F7] flex-1 overflow-y-auto pb-20">
      <div v-if="loading" class="text-center py-8 text-gray-600">
        <ProgressSpinner />
      </div>

      <div v-else-if="items.length === 0" class="text-center py-8">
        <p class="mb-4 text-lg text-gray-900">No items found</p>
        <Button
          label="Add First Item"
          icon="pi pi-plus"
          @click="showAddModal = true"
          severity="primary"
        />
      </div>

      <Card
        v-for="item in sortedItems"
        :key="item.id"
        class="card-white"
      >
        <template #content>
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-semibold text-lg text-gray-900">{{ item.name }}</h3>
                <Tag
                  :value="item.is_active ? 'Active' : 'Inactive'"
                  :severity="item.is_active ? 'success' : 'danger'"
                />
                <Tag
                  :value="`Order: ${item.display_order ?? 0}`"
                  severity="info"
                />
              </div>
              <p class="text-blue-600 font-bold text-xl mb-1">₹{{ parseFloat(item.price).toFixed(2) }}</p>
              <div v-if="item.daily_stock !== null" class="text-sm space-y-2 mt-2">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-gray-600 font-semibold">Stock Status</span>
                    <span class="text-gray-700 font-semibold">
                      <span :class="item.available_stock !== null && item.available_stock <= 5 ? 'text-red-600' : 'text-green-600'">
                        {{ item.available_stock ?? 'N/A' }}
                      </span>
                      / {{ item.daily_stock }}
                    </span>
                  </div>
                  <ProgressBar 
                    :value="getStockPercentage(item)" 
                    :showValue="false"
                    :severity="getStockSeverity(item)"
                  />
                </div>
                <div class="flex justify-between text-xs text-gray-500">
                  <span>Sold: {{ item.sold_count ?? 0 }}</span>
                  <span>Available: {{ item.available_stock ?? 'N/A' }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500 italic">
                Stock not tracked for today
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <Button
              label="Edit"
              icon="pi pi-pencil"
              @click="handleEdit(item)"
              severity="primary"
              outlined
              class="flex-1"
            />
            <Button
              :label="item.is_active ? 'Disable' : 'Enable'"
              :icon="item.is_active ? 'pi pi-ban' : 'pi pi-check'"
              @click="handleToggleActive(item)"
              :severity="item.is_active ? 'warning' : 'success'"
              class="flex-1"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Add/Edit Modal -->
    <ItemModal
      v-if="showAddModal || editingItem"
      :item="editingItem"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useItems } from '@/composables/useItems'
import { useToast } from 'primevue/usetoast'
import { useFullscreen } from '@/composables/useFullscreen'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import ItemModal from './ItemModal.vue'
import BottomNav from './BottomNav.vue'

const toast = useToast()
const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen()

const { items, loading, fetchItems, addItem, updateItem, toggleItemActive } = useItems()
const showAddModal = ref(false)
const editingItem = ref(null)

// Sort items by display_order for management screen
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => {
    const orderA = a.display_order ?? 0
    const orderB = b.display_order ?? 0
    if (orderA !== orderB) {
      return orderA - orderB
    }
    return (a.name || '').localeCompare(b.name || '')
  })
})

onMounted(() => {
  fetchItems(true) // Include inactive items
})

const handleEdit = (item) => {
  editingItem.value = { ...item }
}

const handleToggleActive = async (item) => {
  try {
    await toggleItemActive(item.id)
    toast.add({ severity: 'success', summary: 'Success', detail: 'Item updated successfully', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error updating item: ' + error.message, life: 5000 })
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingItem.value = null
}

const handleSave = async (itemData) => {
  try {
    if (editingItem.value) {
      await updateItem(editingItem.value.id, itemData)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Item updated successfully', life: 3000 })
    } else {
      await addItem(itemData)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Item added successfully', life: 3000 })
    }
    closeModal()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving item: ' + error.message, life: 5000 })
  }
}

const getStockPercentage = (item) => {
  if (item.daily_stock === null || item.daily_stock === 0) return 0
  if (item.available_stock === null) return 0
  return (item.available_stock / item.daily_stock) * 100
}

const getStockSeverity = (item) => {
  if (item.available_stock === null) return 'info'
  const percentage = getStockPercentage(item)
  if (percentage <= 20 || item.available_stock <= 5) return 'danger'
  if (percentage <= 50) return 'warning'
  return 'success'
}
</script>

