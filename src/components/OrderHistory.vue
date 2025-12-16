<template>
  <div class="min-h-screen bg-white pb-20">
    <!-- Header -->
    <div class="header-white sticky top-0 z-10 shadow-sm">
      <div class="px-6 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Order History</h1>
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

    <!-- Orders List -->
    <div class="p-4 space-y-4">
      <div v-if="loading" class="text-center text-gray-600 py-8">
        <ProgressSpinner />
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-8">
        <p class="text-gray-500">No orders yet</p>
      </div>

      <Card
        v-for="order in orders"
        :key="order.id"
        class="card-white"
      >
        <template #content>
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-xs text-gray-500 mb-1">
                {{ new Date(order.created_at).toLocaleString() }}
              </p>
              <p class="text-sm font-mono text-gray-700">Order #{{ order.id.slice(0, 8) }}</p>
            </div>
            <p class="text-xl font-bold text-ios-blue">₹{{ parseFloat(order.total_amount).toFixed(2) }}</p>
          </div>

          <div class="mb-4 pb-4 border-b border-gray-200">
            <div v-for="orderItem in order.order_items" :key="orderItem.id" class="text-sm text-gray-700 mb-1">
              <span class="font-medium">{{ orderItem.item?.name || 'Unknown' }}</span>
              <span class="text-gray-500"> × {{ orderItem.quantity }}</span>
              <span class="text-gray-500 float-right">₹{{ parseFloat(orderItem.subtotal).toFixed(2) }}</span>
            </div>
          </div>

          <div class="flex gap-3">
            <Button
              label="Load & Edit"
              icon="pi pi-upload"
              @click="handleLoadOrder(order)"
              severity="primary"
              outlined
              class="flex-1"
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              @click="handleDelete(order.id)"
              severity="danger"
              class="flex-1"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrders } from '@/composables/useOrders'
import { useCart } from '@/composables/useCart'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import BottomNav from './BottomNav.vue'

const toast = useToast()

const router = useRouter()
const { orders, loading, fetchOrders, deleteOrder, setEditingOrder } = useOrders()
const { loadCart } = useCart()

onMounted(() => {
  fetchOrders()
})

const handleLoadOrder = (order) => {
  const items = order.order_items.map(oi => ({
    id: oi.item_id,
    name: oi.item?.name || 'Unknown',
    price: parseFloat(oi.price),
    quantity: oi.quantity,
    stock_quantity: oi.item?.stock_quantity || null
  }))
  
  loadCart(items)
  setEditingOrder(order.id) // Set the order ID being edited
  router.push('/')
}

const handleDelete = async (orderId) => {
  if (confirm('Delete this order?')) {
    try {
      await deleteOrder(orderId)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Order deleted successfully', life: 3000 })
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error deleting order: ' + error.message, life: 5000 })
    }
  }
}
</script>
