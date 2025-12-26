<template>
  <div class="h-screen pb-20 flex flex-col">
    <!-- Header -->
    <div class=" sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-1">
        <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
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
            icon="pi pi-sign-out"
            @click="handleLogout"
            severity="secondary"
            size="small"
            outlined
            :pt="{ root: { class: 'px-2' } }"
            v-tooltip.top="'Logout'"
          />
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="px-4 py-3 bg-[#F5F5F7] border-b border-gray-200">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Filter:</label>
          <Select
            v-model="period"
            @update:modelValue="handlePeriodChange"
            :options="periodOptions"
            optionLabel="label"
            optionValue="value"
            class="w-40"
          />
        </div>
        <!-- Custom Date Picker -->
        <div v-if="period === 'custom'" class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Date:</label>
          <Calendar
            v-model="customStartDate"
            @update:modelValue="handleCustomDateChange"
            dateFormat="yy-mm-dd"
            showIcon
            iconDisplay="input"
            inputId="custom-date"
            class="w-40"
          />
        </div>
      </div>
    </div>

    <!-- Reports Content -->
    <div class="p-4 space-y-4 overflow-y-auto ">
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

        <div class="flex flex-col gap-4">

        <!-- Revenue Chart -->
        <Card v-if="itemSales.length > 0" class="card-white">
          <template #content>
            <h2 class="text-lg font-bold text-gray-900 mb-4">Revenue by Item</h2>
            <Chart type="bar" :data="revenueChartData" :options="chartOptions" class="h-64" />
          </template>
        </Card>

        <!-- Quantity Chart -->
        <Card v-if="itemSales.length > 0" class="card-white">
          <template #content>
            <div class="px-2 pb-2">
              <h2 class="text-sm font-bold text-gray-900 mb-1">Stock & Sales by Item</h2>
            </div>
            <div class="px-1 -mx-2">
              <Chart type="bar" :data="quantityChartData" :options="quantityChartOptions" class="h-48" />
            </div>
          </template>
        </Card>

        <!-- Item Sales Table -->
        <Card class="card-white">
          <template #content>
            <h2 class="text-lg font-bold text-gray-900 mb-4">Item Sales Details</h2>
            
            <div v-if="itemSales.length === 0" class="text-center text-gray-500 py-4">
              No sales data for this period
            </div>

            <DataTable
              v-else
              :value="itemSales"
              :frozenValue="lockedTotal"
              :rows="10"
              :rowsPerPageOptions="[5, 10, 20]"
              paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
              currentPageReportTemplate="{first} to {last} of {totalRecords}"
              responsiveLayout="scroll"
              class="p-datatable-sm"
            >
              <Column field="name" header="Name">
                <template #body="{ data }">
                  <span class="font-medium text-gray-900">{{ data.name }}</span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold text-gray-900">{{ data.name }}</span>
                </template>
              </Column>
              <Column field="quantity" header="Qunty">
                <template #body="{ data }">
                  <span class="text-gray-700">{{ data.quantity }}</span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold text-gray-900">{{ data.quantity }}</span>
                </template>
              </Column>
              <Column field="revenue" header="Revenue">
                <template #body="{ data }">
                  <span class="font-bold text-ios-blue">₹{{ data.revenue.toFixed(2) }}</span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold text-ios-blue">₹{{ data.revenue.toFixed(2) }}</span>
                </template>
              </Column>
              <Column field="percentage" header="Total">
                <template #body="{ data }">
                  <span class="text-gray-600">{{ data.percentage }}%</span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold text-gray-900">{{ data.percentage }}%</span>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Most Sold Item -->
        <Card v-if="mostSoldItem" class="card-white border-blue-200 bg-[#F5F5F7]">
          <template #content>
            <p class="text-sm text-blue-600 mb-1">Most Sold Item</p>
            <p class="text-xl font-bold text-gray-900">{{ mostSoldItem.name }}</p>
            <p class="text-sm text-blue-700">{{ mostSoldItem.quantity }} units sold</p>
          </template>
        </Card>
      </div>
      </div>
    </div>

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
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/composables/useAuth'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Calendar from 'primevue/calendar'
import QRCodeModal from './QRCodeModal.vue'
import BottomNav from './BottomNav.vue'

const toast = useToast()
const { signOut } = useAuth()

const period = ref('today')
const showQRModal = ref(false)
const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'All', value: 'all' },
  { label: 'Custom Date', value: 'custom' }
]
const customStartDate = ref(null)
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

const lockedTotal = computed(() => {
  if (itemSales.value.length === 0) return []
  
  const totalRevenue = itemSales.value.reduce((sum, item) => sum + item.revenue, 0)
  
  // Find chai item (case-insensitive)
  const chaiItem = itemSales.value.find(item => 
    item.name.toLowerCase().includes('tea')
  )
  
  // Calculate quantities
  const chaiQuantity = chaiItem ? chaiItem.quantity : 0
  const otherItemsQuantity = itemSales.value.reduce((sum, item) => {
    const isChai = item.name.toLowerCase().includes('tea')
    return isChai ? sum : sum + item.quantity
  }, 0)
  
  // Format quantity: "X [other items] + Y chai"
  let quantityDisplay = ''
  if (chaiQuantity > 0 && otherItemsQuantity > 0) {
    quantityDisplay = `${otherItemsQuantity} buns + ${chaiQuantity} chai`
  } else if (chaiQuantity > 0) {
    quantityDisplay = `${chaiQuantity} chai`
  } else {
    quantityDisplay = `${otherItemsQuantity} buns`
  }
  
  return [{
    name: 'Total',
    quantity: quantityDisplay,
    revenue: totalRevenue,
    percentage: '100.0'
  }]
})

const revenueChartData = computed(() => {
  const topItems = itemSales.value.slice(0, 10) // Show top 10 items
  return {
    labels: topItems.map(item => item.name),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: topItems.map(item => item.revenue),
        backgroundColor: '#a3d5ff',
        borderRadius: {
          topLeft: 6,
          topRight: 6,
        },
        borderWidth: 1
      }
    ]
  }
})

const quantityChartData = computed(() => {
  const topItems = itemSales.value.slice(0, 10) // Show top 10 items
  return {
    labels: topItems.map(item => item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name),
    datasets: [
    {
        label: 'Sold',
        data: topItems.map(item => item.quantity),
        backgroundColor: '#a3d5ff',
        borderWidth: 0,
        borderRadius: {
          topLeft: 6,
          topRight: 6,
        },
        borderSkipped: false,
      },
      {
        label: 'Available Stock',
        data: topItems.map(item => item.available_stock ?? item.daily_stock ?? 0),
        backgroundColor: '#d1eaff',
        borderWidth: 0,
        borderRadius: {
          topLeft: 6,
          topRight: 6,
        },
        borderSkipped: false,
      },
      
    ]
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  }
})

const quantityChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 4,
        right: 4,
        top: 4,
        bottom: 4
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        padding: 6,
        titleFont: {
          size: 10
        },
        bodyFont: {
          size: 10
        },
        displayColors: true,
        cornerRadius: 6,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value} units`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 9
          },
          padding: 2,
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        stacked: false,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 9
          },
          precision: 0,
          padding: 2
        }
      }
    },
    categoryPercentage: 0.7,
    barPercentage: 0.85
  }
})

const getDateRange = () => {
  const now = new Date()
  let start, end
  
  switch (period.value) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = now
      break
    case 'yesterday':
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
      break
    case 'custom':
      if (customStartDate.value) {
        // Set start date to beginning of selected day
        start = new Date(customStartDate.value)
        start.setHours(0, 0, 0, 0)
        // Set end date to end of selected day
        end = new Date(customStartDate.value)
        end.setHours(23, 59, 59, 999)
      } else {
        // If date not selected, return null to prevent fetching
        return { start: null, end: null }
      }
      break
    case 'all':
      // No date filter - return null to fetch all records
      return { start: null, end: null }
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = now
  }
  
  return { start: start.toISOString(), end: end.toISOString() }
}

const handlePeriodChange = () => {
  // Reset custom date when switching away from custom
  if (period.value !== 'custom') {
    customStartDate.value = null
  }
  fetchReports()
}

const handleCustomDateChange = () => {
  // Fetch reports when date is selected
  if (customStartDate.value) {
    fetchReports()
  }
}

const fetchReports = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()
    
    // For custom date, don't fetch if date is not selected
    if (period.value === 'custom' && (!start || !end)) {
      loading.value = false
      return
    }
    
    // Fetch orders
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          item:items (*)
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply date filters only if not 'all'
    if (start && end) {
      query = query.gte('created_at', start).lte('created_at', end)
    }
    
    const { data: ordersData, error: ordersError } = await query
    
    if (ordersError) throw ordersError
    orders.value = ordersData || []

    // Calculate item sales
    const itemMap = new Map()
    
    orders.value.forEach(order => {
      order.order_items?.forEach(oi => {
        const itemId = oi.item_id
        const itemName = oi.item?.name || 'Unknown'
        const availableStock = oi.item?.available_stock ?? oi.item?.daily_stock ?? null
        
        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            id: itemId,
            name: itemName,
            quantity: 0,
            revenue: 0,
            available_stock: availableStock
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

const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    try {
      await signOut()
      toast.add({ severity: 'info', summary: 'Logged Out', detail: 'You have been logged out successfully', life: 3000 })
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error logging out: ' + error.message, life: 5000 })
    }
  }
}

onMounted(() => {
  fetchReports()
})
</script>
