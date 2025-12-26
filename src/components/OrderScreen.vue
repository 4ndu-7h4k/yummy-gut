<template>
  <div class="h-screen bg-[#F5F5F7] flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-1">
        <h1 class="text-2xl font-bold text-gray-900">Yummy Gut</h1>
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
            label="Drafts"
            icon="pi pi-file"
            @click="showDrafts = true"
            severity="secondary"
            size="small"
            outlined
          />
        </div>
      </div>
      
      <!-- Edit Mode Banner -->
      <div v-if="editingOrderId" class="mt-2 px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-[12px] flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-pencil text-yellow-600"></i>
          <span class="text-sm font-medium text-yellow-800">
            Editing Order #{{ editingOrderId.slice(0, 8) }}
          </span>
        </div>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="handleCancelEdit"
          severity="secondary"
          size="small"
          outlined
          class="text-yellow-800 border-yellow-400 hover:bg-yellow-100"
        />
      </div>
    </div>

    <!-- Items Grid -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-6 text-center text-gray-600">
        <ProgressSpinner />
      </div>
      
      <div v-else-if="activeItems.length === 0" class="p-8 text-center">
        <p class="mb-2 text-lg text-gray-900">No active items available</p>
        <p v-if="error" class="text-red-600 text-sm mb-4">{{ error }}</p>
        <p v-else class="text-sm mb-4 text-gray-500">Set up Supabase to add items</p>
        <router-link to="/items">
          <Button
            label="Manage Items"
            icon="pi pi-plus"
            severity="primary"
          />
        </router-link>
      </div>

      <div 
        v-else 
        class="p-4 grid grid-cols-2 gap-4 bg-[#F5F5F7]"
        :style="{ paddingBottom: cart.length > 0 ? '320px' : '100px' }"
      >
        <ItemCard
          v-for="item in activeItems"
          :key="item.id"
          :item="item"
          :quantity="getCartQuantity(item.id)"
          @add="addToCart(item)"
          @remove="removeFromCart(item.id)"
        />
      </div>
    </div>

    <!-- Order Summary (Sticky Bottom) -->
    <OrderSummary
      :cart="cart"
      :grand-total="grandTotal"
      :total-items="totalItems"
      :is-editing="!!editingOrderId"
      :loading="orderLoading"
      @clear="clearCart"
      @place-order="handlePlaceOrder"
      @save-draft="handleSaveDraft"
    />

    <!-- Bottom Navigation -->
    <BottomNav />

    <!-- Draft Orders Modal -->
    <DraftOrdersModal
      v-if="showDrafts"
      @close="showDrafts = false"
      @load-draft="handleLoadDraft"
    />

    <!-- QR Code Modal -->
    <QRCodeModal
      v-model:visible="showQRModal"
      @qr-generated="handleQRGenerated"
      @qr-uploaded="handleQRUploaded"
      @close="showQRModal = false"
      @qr-updated="handleQRUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useItems } from '@/composables/useItems'
import { useCart } from '@/composables/useCart'
import { useOrders } from '@/composables/useOrders'
import { useDraftOrders } from '@/composables/useDraftOrders'
import { useToast } from 'primevue/usetoast'
import { useQRCode } from '@/composables/useQRCode'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import ItemCard from './ItemCard.vue'
import OrderSummary from './OrderSummary.vue'
import DraftOrdersModal from './DraftOrdersModal.vue'
import QRCodeModal from './QRCodeModal.vue'
import BottomNav from './BottomNav.vue'

const toast = useToast()
const { saveGeneratedQR, uploadQRCode } = useQRCode()

const { activeItems, loading, error, fetchItems } = useItems()
const { cart, addToCart, removeFromCart, clearCart, loadCart, grandTotal, totalItems } = useCart()
const { placeOrder, clearEditingOrder, editingOrderId, loading: orderLoading } = useOrders()
const { saveDraft } = useDraftOrders()

const showDrafts = ref(false)
const showQRModal = ref(false)

onMounted(() => {
  console.log('OrderScreen mounted, fetching items...')
  fetchItems().catch(err => {
    console.error('Error in fetchItems:', err)
  })
})

const getCartQuantity = (itemId) => {
  const item = cart.value.find(i => i.id === itemId)
  return item ? item.quantity : 0
}

const handlePlaceOrder = async () => {
  if (cart.value.length === 0) return

  try {
    const orderItems = cart.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: parseFloat((item.price * item.quantity).toFixed(2))
    }))

    await placeOrder(orderItems, parseFloat(grandTotal.value))
    
    // Haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    clearCart()
    clearEditingOrder() // Clear editing state after placing order
    
    toast.add({ severity: 'success', summary: 'Success', detail: 'Order placed successfully!', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error placing order: ' + error.message, life: 5000 })
  }
}

const handleSaveDraft = async () => {
  if (cart.value.length === 0) return

  const name = prompt('Enter draft name:', 'Untitled Draft')
  if (!name) return

  try {
    const orderItems = cart.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))

    await saveDraft(name, orderItems, parseFloat(grandTotal.value))
    clearCart()
    clearEditingOrder() // Clear editing state when saving as draft
    toast.add({ severity: 'success', summary: 'Success', detail: 'Draft saved successfully!', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error saving draft: ' + error.message, life: 5000 })
  }
}

const handleLoadDraft = (draft) => {
  loadCart(draft.items)
  clearEditingOrder() // Clear any editing state when loading a draft
  showDrafts.value = false
}

const handleCancelEdit = () => {
  if (confirm('Cancel editing? All changes will be discarded.')) {
    clearCart()
    clearEditingOrder()
    toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Edit cancelled', life: 2000 })
  }
}

const handleQRGenerated = async (data) => {
  try {
    await saveGeneratedQR(data.text, data.dataUrl)
    toast.add({ severity: 'success', summary: 'Success', detail: 'QR code generated and saved', life: 3000 })
  } catch (error) {
    console.error('Error saving QR code:', error)
    // Don't show error toast if storage isn't configured
    if (error.message && !error.message.includes('storage')) {
      toast.add({ severity: 'warn', summary: 'Warning', detail: 'QR code generated but not saved to storage', life: 3000 })
    }
  }
}

const handleQRUploaded = async (data) => {
  try {
    await uploadQRCode(data.file, null)
    toast.add({ severity: 'success', summary: 'Success', detail: 'QR code uploaded and saved', life: 3000 })
  } catch (error) {
    console.error('Error uploading QR code:', error)
    // Don't show error toast if storage isn't configured
    if (error.message && !error.message.includes('storage')) {
      toast.add({ severity: 'warn', summary: 'Warning', detail: 'QR code displayed but not saved to storage', life: 3000 })
    }
  }
}

const handleQRUpdated = async () => {
  // QR code was updated, modal will reload it automatically
}
</script>

