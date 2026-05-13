<template>
  <div class="h-screen pb-20 flex flex-col">
    <!-- Header -->
    <div class=" sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-1">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
          <div class="flex items-center bg-gray-200 rounded-full p-0.5">
            <router-link
              to="/reports"
              class="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200"
              :class="$route.path === '/reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'"
            >
              <i class="pi pi-chart-bar text-sm"></i>
            </router-link>
            <router-link
              to="/expenses"
              class="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200"
              :class="$route.path === '/expenses' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'"
            >
              <i class="pi pi-wallet text-sm"></i>
            </router-link>
          </div>
        </div>
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

    <!-- Date: week strip + pull-down calendar -->
    <div
      class="px-2 py-3 bg-[#F5F5F7] border-b border-gray-200"
      @touchstart="onStripTouchStart"
      @touchmove="onStripTouchMove"
      @touchend="onStripTouchEnd"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2 mb-2">
        <p class="text-xs text-gray-500 select-none order-2 sm:order-1">
          <template v-if="filterMode === 'day'">Swipe dates · Pull down for calendar</template>
          <template v-else-if="filterMode === 'range'">Choose start and end in the calendar</template>
          <template v-else>Showing all orders</template>
        </p>
        <div class="flex items-center gap-2 shrink-0 order-1 sm:order-2 justify-end w-full sm:w-auto">
          <Select
            v-model="filterMode"
            :options="filterModeOptions"
            optionLabel="label"
            optionValue="value"
            size="small"
            class="min-w-0 flex-1 sm:flex-initial sm:w-40"
          />
          <Button
            type="button"
            :icon="calendarExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            severity="secondary"
            size="small"
            outlined
            v-tooltip.top="calendarExpanded ? 'Hide calendar' : 'Show calendar'"
            :disabled="filterMode === 'all'"
            @click="calendarExpanded = !calendarExpanded"
            :pt="{ root: { class: 'p-2' } }"
          />
        </div>
      </div>

      <div
        v-show="filterMode === 'day'"
        ref="dayStripRef"
        class="flex gap-1 overflow-x-auto pb-1 scrollbar-thin snap-x snap-mandatory touch-pan-x"
        style="-webkit-overflow-scrolling: touch"
      >
        <button
          v-for="d in dayStrip"
          :key="d.key"
          type="button"
          :data-day-key="d.key"
          class="flex flex-col items-center justify-center min-w-[calc(100%/7)] max-w-[calc(100%/7)] shrink-0 snap-center rounded-xl py-2 px-1 border transition-colors touch-manipulation"
          :class="dayStripChipClass(d)"
          @click="selectDay(d.date)"
        >
          <span class="text-[10px] uppercase tracking-wide opacity-80">{{ d.weekday }}</span>
          <span class="text-lg font-semibold leading-tight">{{ d.dayNum }}</span>
          <span class="text-[10px] opacity-80">{{ d.monthShort }}</span>
        </button>
      </div>

      <div v-if="filterMode === 'day' && calendarExpanded" class="mt-3 flex justify-center px-1">
        <Calendar
          v-model="pickerDate"
          inline
          :maxDate="calendarMaxDate"
          class="w-full max-w-md"
          @update:modelValue="onPickerDateChange"
        />
      </div>

      <div v-if="filterMode === 'range' && calendarExpanded" class="mt-3 flex justify-center px-1">
        <Calendar
          v-model="rangeModel"
          selectionMode="range"
          inline
          :maxDate="calendarMaxDate"
          class="w-full max-w-md"
        />
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
              <p class="text-sm text-gray-500 mb-1">Orders</p>
              <p class="text-2xl font-bold text-blue-600">
                <span>{{ bunSoldCount }}</span>
                <span class="text-gray-400 mx-0.5">/</span>
                <span class="text-gray-500">{{ dailyBunTotal ?? '—' }}</span>
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ totalOrders }} orders</p>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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

const DAY_STRIP_RADIUS = 120

const toast = useToast()
const { signOut } = useAuth()

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return startOfDay(x)
}

const showQRModal = ref(false)
const filterMode = ref('day')
const filterModeOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Range', value: 'range' },
  { label: 'All time', value: 'all' },
]

const calendarExpanded = ref(false)
const selectedDate = ref(startOfDay(new Date()))
const pickerDate = ref(new Date(selectedDate.value))
const rangeModel = ref([addDays(startOfDay(new Date()), -7), startOfDay(new Date())])
const loading = ref(false)
const orders = ref([])
const itemSales = ref([])
const dailyBunTotal = ref(null)
const dayStripRef = ref(null)

let stripTouchY0 = 0
let stripTouchX0 = 0

function dateKey(d) {
  const x = startOfDay(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(a, b) {
  return dateKey(a) === dateKey(b)
}

function isToday(d) {
  return isSameDay(d, new Date())
}

const calendarMaxDate = computed(() => {
  const x = startOfDay(new Date())
  x.setHours(23, 59, 59, 999)
  return x
})

function dayStripChipClass(d) {
  const selected = isSameDay(d.date, selectedDate.value)
  if (selected) {
    if (isToday(d.date)) {
      return 'bg-blue-400 text-white border-blue-400 shadow-sm'
    }
    return 'bg-blue-400 text-white border-blue-400 shadow-sm'
  }
  return 'bg-white text-gray-800 border-gray-200 active:bg-gray-50'
}

const dayStrip = computed(() => {
  const base = startOfDay(new Date())
  const list = []
  for (let i = -DAY_STRIP_RADIUS; i <= 0; i++) {
    const date = addDays(base, i)
    list.push({
      key: dateKey(date),
      date,
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: date.getDate(),
      monthShort: date.toLocaleDateString(undefined, { month: 'short' }),
    })
  }
  return list
})

function scrollSelectedIntoView(behavior = 'smooth') {
  nextTick(() => {
    const strip = dayStripRef.value
    if (!strip || filterMode.value !== 'day') return
    const key = dateKey(selectedDate.value)
    const el = strip.querySelector(`[data-day-key="${key}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior })
  })
}

function onStripTouchStart(e) {
  if (e.touches.length !== 1) return
  stripTouchY0 = e.touches[0].clientY
  stripTouchX0 = e.touches[0].clientX
}

function onStripTouchMove(e) {
  if (e.touches.length !== 1 || filterMode.value === 'all' || calendarExpanded.value) return
  const y = e.touches[0].clientY
  const x = e.touches[0].clientX
  const dy = y - stripTouchY0
  const dx = x - stripTouchX0
  if (dy > 56 && dy > Math.abs(dx) * 1.25) {
    calendarExpanded.value = true
    stripTouchY0 = y
    stripTouchX0 = x
  }
}

function onStripTouchEnd() {
  stripTouchY0 = 0
  stripTouchX0 = 0
}

function selectDay(date) {
  const d = startOfDay(date)
  if (d > startOfDay(new Date())) return
  selectedDate.value = d
  pickerDate.value = new Date(selectedDate.value)
  scrollSelectedIntoView()
}

function onPickerDateChange() {
  if (filterMode.value !== 'day') return
  if (!pickerDate.value) return
  let d = startOfDay(pickerDate.value)
  const maxDay = startOfDay(new Date())
  if (d > maxDay) {
    d = maxDay
    pickerDate.value = new Date(d)
  }
  selectedDate.value = d
  scrollSelectedIntoView()
}

watch(filterMode, (mode) => {
  if (mode === 'all') {
    calendarExpanded.value = false
  } else if (mode === 'range') {
    calendarExpanded.value = true
  }
})

watch(selectedDate, (d) => {
  pickerDate.value = new Date(d)
})

const totalSales = computed(() => {
  return orders.value.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
})

const totalOrders = computed(() => {
  return orders.value.length
})

const bunSoldCount = computed(() => {
  return itemSales.value.reduce((sum, item) => {
    const isTea = item.name.toLowerCase().includes('tea') || item.name.toLowerCase().includes('chai')
    return isTea ? sum : sum + item.quantity
  }, 0)
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
  if (filterMode.value === 'all') {
    return { start: null, end: null }
  }
  if (filterMode.value === 'day') {
    const start = new Date(selectedDate.value)
    start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate.value)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString() }
  }
  const r = rangeModel.value
  if (!r || !Array.isArray(r) || !r[0]) {
    return { start: null, end: null }
  }
  let a = startOfDay(r[0])
  let b = r[1] != null ? startOfDay(r[1]) : a
  const maxD = startOfDay(new Date())
  if (a > maxD) a = maxD
  if (b > maxD) b = maxD
  if (a > b) {
    const t = a
    a = b
    b = t
  }
  const start = new Date(a)
  start.setHours(0, 0, 0, 0)
  const end = new Date(b)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

const fetchDailyBun = async () => {
  try {
    if (filterMode.value !== 'day') {
      dailyBunTotal.value = null
      return
    }
    const day = dateKey(selectedDate.value)
    const { data, error } = await supabase
      .from('daily_bun_shop')
      .select('bun_count')
      .eq('bun_date', day)
      .maybeSingle()

    dailyBunTotal.value = data?.bun_count ?? null
  } catch (err) {
    console.error('Error fetching daily bun:', err)
    dailyBunTotal.value = null
  }
}

const fetchReports = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()

    fetchDailyBun()

    if (filterMode.value === 'range' && (!start || !end)) {
      loading.value = false
      orders.value = []
      itemSales.value = []
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

watch([filterMode, selectedDate, rangeModel], () => {
  fetchReports()
}, { deep: true })

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
  scrollSelectedIntoView('auto')
})
</script>
