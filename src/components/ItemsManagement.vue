<template>
  <div class="h-screen flex flex-col pb-20">
    <!-- Header -->
    <div class=" sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-1">
        <h1 class="text-2xl font-bold text-gray-900">Items</h1>
        <div class="flex gap-3">
          <Button
            icon="pi pi-qrcode"
            @click="showQRModal = true"
            severity="secondary"
            size="small"
            outlined
            :pt="{ root: { class: 'px-2' } }"
            v-tooltip.top="'Show QR Code'"
          />
          <Button
            label="Add"
            icon="pi pi-plus"
            @click="showAddModal = true"
            severity="secondary"
            size="small"
            outlined
          />
        </div>
      </div>
    </div>

    <!-- Items List -->
    <div class="p-4 space-y-4 bg-[#F5F5F7] flex-1 overflow-y-auto pb-20">

      <!-- Daily Bun Shop Card -->
      <Card class="card-white !shadow-md border border-blue-100">
        <template #content>
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-lg text-gray-900">🍞 Daily Bun from Shop</h3>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="bunSaved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
              {{ bunSaved ? 'Saved' : 'Unsaved' }}
            </span>
          </div>

          <!-- Bun Count -->
          <label class="text-sm font-medium text-gray-600 mb-1 block">Bun Count</label>
          <div class="flex items-center gap-2 mb-3">
            <Button icon="pi pi-minus" severity="danger" outlined size="small"
              @click="bunCount = Math.max(0, bunCount - 5); recalcAmount()" class="!w-10 !h-10 shrink-0" />
            <InputNumber v-model="bunCount" :min="0" inputClass="text-center font-bold text-lg"
              class="flex-1" @update:modelValue="recalcAmount" />
            <Button icon="pi pi-plus" severity="success" outlined size="small"
              @click="bunCount += 5; recalcAmount()" class="!w-10 !h-10 shrink-0" />
          </div>

          <!-- Bun Amount -->
          <label class="text-sm font-medium text-gray-600 mb-1 block">
            Amount <span class="text-xs text-gray-400">(₹8 × {{ bunCount }})</span>
          </label>
          <InputNumber v-model="bunAmount" :min="0" mode="currency" currency="INR" locale="en-IN"
            inputClass="font-bold text-lg" class="w-full mb-3" />

          <Button :label="bunSaved ? 'Update' : 'Save'" icon="pi pi-check" severity="primary"
            class="w-full" :loading="bunSaving" @click="saveBunShop" />
        </template>
      </Card>

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
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-lg text-gray-900">{{ item.name }}</h3>
                <ToggleSwitch :modelValue="item.is_active" @update:modelValue="handleToggleActive(item)" />
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
              label="Add 30"
              icon="pi pi-plus"
              @click="handleQuickAdd(item)"
              severity="success"
              class="flex-1"
              :disabled="quickAddLoading.has(item.id)"
              :loading="quickAddLoading.has(item.id)"
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

    <!-- QR Code Modal -->
    <QRCodeModal
      v-model:visible="showQRModal"
      @close="showQRModal = false"
    />

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useItems } from '@/composables/useItems'
import { supabase } from '@/config/supabase'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import ItemModal from './ItemModal.vue'
import QRCodeModal from './QRCodeModal.vue'
import BottomNav from './BottomNav.vue'

const BUN_PRICE = 8
const DEFAULT_BUN_COUNT = 40

const toast = useToast()

const { items, loading, fetchItems, addItem, updateItem, toggleItemActive, setDailyStock, getTodayIST } = useItems()
const showAddModal = ref(false)
const editingItem = ref(null)
const showQRModal = ref(false)
const quickAddLoading = reactive(new Set())

// --- Daily Bun Shop ---
const bunCount = ref(DEFAULT_BUN_COUNT)
const bunAmount = ref(DEFAULT_BUN_COUNT * BUN_PRICE)
const bunSaving = ref(false)
const bunSaved = ref(false)

const getTodayDate = () => {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const ist = new Date(now.getTime() + istOffset)
  return ist.toISOString().split('T')[0]
}

const recalcAmount = () => {
  bunAmount.value = bunCount.value * BUN_PRICE
}

const fetchTodayBun = async () => {
  try {
    const today = getTodayDate()
    const { data, error } = await supabase
      .from('daily_bun_shop')
      .select('*')
      .eq('bun_date', today)
      .maybeSingle()

    if (data) {
      bunCount.value = data.bun_count
      bunAmount.value = parseFloat(data.bun_amount)
      bunSaved.value = true
    }
  } catch (err) {
    console.error('Error fetching bun shop data:', err)
  }
}

const saveBunShop = async () => {
  bunSaving.value = true
  try {
    const today = getTodayDate()
    const { error: upsertError } = await supabase
      .from('daily_bun_shop')
      .upsert({
        bun_date: today,
        bun_count: bunCount.value,
        bun_amount: bunAmount.value
      }, { onConflict: 'bun_date' })

    if (upsertError) throw upsertError

    bunSaved.value = true
    toast.add({ severity: 'success', summary: 'Saved', detail: `Bun: ${bunCount.value} pcs — ₹${bunAmount.value}`, life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save bun data: ' + err.message, life: 5000 })
  } finally {
    bunSaving.value = false
  }
}

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
  fetchItems(true)
  fetchTodayBun()
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

const handleQuickAdd = async (item) => {
  quickAddLoading.add(item.id)
  try {
    const today = getTodayIST()
    const newStock = (item.daily_stock ?? 0) + 30
    await setDailyStock(item.id, today, newStock)
    if (!item.is_active) {
      await updateItem(item.id, { is_active: true })
    } else {
      await fetchItems(true)
    }
    toast.add({ severity: 'success', summary: 'Success', detail: `Added 30 stock to ${item.name}`, life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error adding stock: ' + error.message, life: 5000 })
  } finally {
    quickAddLoading.delete(item.id)
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

