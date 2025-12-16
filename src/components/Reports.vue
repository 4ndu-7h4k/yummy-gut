<template>
  <div class="min-h-screen bg-white pb-20">
    <!-- Header -->
    <div class="header-white sticky top-0 z-10 shadow-sm">
      <div class="px-6 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
        <div class="flex gap-3">
          <Select
            v-model="period"
            @update:modelValue="fetchReports"
            :options="periodOptions"
            optionLabel="label"
            optionValue="value"
            class="w-32"
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

    <!-- Reports Content -->
    <div class="p-4 space-y-4">
      <div v-if="loading" class="text-center text-gray-600 py-8">
        <ProgressSpinner />
      </div>

      <div v-else>
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <Card class="card-white">
            <template #content>
              <p class="text-sm text-gray-500 mb-1">Total Sales</p>
              <p class="text-2xl font-bold text-ios-blue">₹{{ totalSales.toFixed(2) }}</p>
            </template>
          </Card>
          <Card class="card-white">
            <template #content>
              <p class="text-sm text-gray-500 mb-1">Total Orders</p>
              <p class="text-2xl font-bold text-blue-600">{{ totalOrders }}</p>
            </template>
          </Card>
        </div>

        <!-- Item Sales -->
        <Card class="card-white">
          <template #content>
            <h2 class="text-lg font-bold text-gray-900 mb-4">Item Sales</h2>
            
            <div v-if="itemSales.length === 0" class="text-center text-gray-500 py-4">
              No sales data for this period
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="item in itemSales"
                :key="item.id"
                class="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0"
              >
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ item.name }}</p>
                  <p class="text-sm text-gray-500">Sold: {{ item.quantity }} units</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-ios-blue">₹{{ item.revenue.toFixed(2) }}</p>
                  <p class="text-xs text-gray-400">{{ item.percentage }}%</p>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Most Sold Item -->
        <Card v-if="mostSoldItem" class="card-white border-blue-200 bg-blue-50">
          <template #content>
            <p class="text-sm text-blue-600 mb-1">Most Sold Item</p>
            <p class="text-xl font-bold text-gray-900">{{ mostSoldItem.name }}</p>
            <p class="text-sm text-blue-700">{{ mostSoldItem.quantity }} units sold</p>
          </template>
        </Card>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/config/supabase'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import BottomNav from './BottomNav.vue'

const toast = useToast()

const period = ref('today')
const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' }
]
const loading = ref(false)
const orders = ref([])
const itemSales = ref([])

const totalSales = computed(() => {
  return orders.value.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
})

const totalOrders = computed(() => {
  return orders.value.length
})

const mostSoldItem = computed(() => {
  if (itemSales.value.length === 0) return null
  return itemSales.value.reduce((max, item) => 
    item.quantity > max.quantity ? item : max
  , itemSales.value[0])
})

const getDateRange = () => {
  const now = new Date()
  let start
  
  switch (period.value) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      start = new Date(now)
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  
  return { start: start.toISOString(), end: now.toISOString() }
}

const fetchReports = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()
    
    // Fetch orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          item:items (*)
        )
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
    
    if (ordersError) throw ordersError
    orders.value = ordersData || []

    // Calculate item sales
    const itemMap = new Map()
    
    orders.value.forEach(order => {
      order.order_items?.forEach(oi => {
        const itemId = oi.item_id
        const itemName = oi.item?.name || 'Unknown'
        
        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            id: itemId,
            name: itemName,
            quantity: 0,
            revenue: 0
          })
        }
        
        const item = itemMap.get(itemId)
        item.quantity += oi.quantity
        item.revenue += parseFloat(oi.subtotal)
      })
    })

    const totalRevenue = Array.from(itemMap.values()).reduce((sum, item) => sum + item.revenue, 0)
    
    itemSales.value = Array.from(itemMap.values())
      .map(item => ({
        ...item,
        percentage: totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  } catch (error) {
    console.error('Error fetching reports:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error loading reports: ' + error.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchReports()
})
</script>
