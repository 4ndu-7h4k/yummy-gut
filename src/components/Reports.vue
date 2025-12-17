<template>
  <div class="min-h-screen bg-[#F5F5F7] pb-20">
    <!-- Header -->
    <div class=" sticky top-0 z-10 px-3 pt-1">
      <div class="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
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

    <!-- Filter Section -->
    <div class="px-4 py-3 bg-[#F5F5F7] border-b border-gray-200">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">Filter:</label>
        <Select
          v-model="period"
          @update:modelValue="fetchReports"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          class="w-40"
        />
      </div>
    </div>

    <!-- Reports Content -->
    <div class="p-4 space-y-4 bg-[#F5F5F7]">
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
              </Column>
              <Column field="quantity" header="Qunty">
                <template #body="{ data }">
                  <span class="text-gray-700">{{ data.quantity }} units</span>
                </template>
              </Column>
              <Column field="revenue" header="Revenue">
                <template #body="{ data }">
                  <span class="font-bold text-ios-blue">₹{{ data.revenue.toFixed(2) }}</span>
                </template>
              </Column>
              <Column field="percentage" header="Total">
                <template #body="{ data }">
                  <span class="text-gray-600">{{ data.percentage }}%</span>
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

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/config/supabase'
import { useToast } from 'primevue/usetoast'
import { useFullscreen } from '@/composables/useFullscreen'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import BottomNav from './BottomNav.vue'

const toast = useToast()
const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen()

const period = ref('today')
const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'All', value: 'all' }
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
        label: 'Stock',
        data: topItems.map(item => item.stock_quantity ?? 0),
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
    case 'all':
      // No date filter - return null to fetch all records
      return { start: null, end: null }
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = now
  }
  
  return { start: start.toISOString(), end: end.toISOString() }
}

const fetchReports = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()
    
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
        const stockQuantity = oi.item?.stock_quantity ?? null
        
        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            id: itemId,
            name: itemName,
            quantity: 0,
            revenue: 0,
            stock_quantity: stockQuantity
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
