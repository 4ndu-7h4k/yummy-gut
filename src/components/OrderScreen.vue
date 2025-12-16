<template>
  <div class="min-h-screen bg-white pb-20">
    <!-- Header -->
    <div class="header-white sticky top-0 z-10 shadow-sm p-3">
      <div class="flex items-center justify-between bg-whitepx-4 pt-3 pb-2">
        <h1 class="text-2xl font-bold text-gray-900">POS</h1>
        <div class="flex gap-3">
          <Button
            label="Drafts"
            icon="pi pi-file"
            @click="showDrafts = true"
            severity="secondary"
            size="small"
            outlined
          />
          <router-link to="/items">
            <Button
              label="Items"
              icon="pi pi-box"
              severity="secondary"
              size="small"
              outlined
            />
          </router-link>
        </div>
      </div>
      
      <!-- Edit Mode Banner -->
      <div v-if="editingOrderId" class="mt-2 px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400 rounded flex items-center justify-between">
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

    <div v-else class="p-4 grid grid-cols-2 gap-4">
      <ItemCard
        v-for="item in activeItems"
        :key="item.id"
        :item="item"
        :quantity="getCartQuantity(item.id)"
        @add="addToCart(item)"
        @remove="removeFromCart(item.id)"
      />
    </div>

    <!-- Order Summary (Sticky Bottom) -->
    <OrderSummary
      :cart="cart"
      :grand-total="grandTotal"
      :total-items="totalItems"
      :is-editing="!!editingOrderId"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useItems } from '@/composables/useItems'
import { useCart } from '@/composables/useCart'
import { useOrders } from '@/composables/useOrders'
import { useDraftOrders } from '@/composables/useDraftOrders'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import ItemCard from './ItemCard.vue'
import OrderSummary from './OrderSummary.vue'
import DraftOrdersModal from './DraftOrdersModal.vue'
import BottomNav from './BottomNav.vue'

const toast = useToast()

const { activeItems, loading, error, fetchItems } = useItems()
const { cart, addToCart, removeFromCart, clearCart, loadCart, grandTotal, totalItems } = useCart()
const { placeOrder, clearEditingOrder, editingOrderId } = useOrders()
const { saveDraft } = useDraftOrders()

const showDrafts = ref(false)

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
      subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
      stock_quantity: item.stock_quantity
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
</script>

