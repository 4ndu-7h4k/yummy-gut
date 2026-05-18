<template>
  <div class="h-screen pb-20 flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-1">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Expenses</h1>
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
        <router-link
          to="/individual-expenses"
          class="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200"
          :class="$route.path === '/individual-expenses' ? 'bg-ios-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'"
          v-tooltip.top="'People expenses'"
        >
          <i class="pi pi-user text-sm"></i>
        </router-link>
      </div>
    </div>

    <!-- Date filter -->
    <div
      class="px-2 py-3 bg-[#F5F5F7] border-b border-gray-200"
      @touchstart="onStripTouchStart"
      @touchmove="onStripTouchMove"
      @touchend="onStripTouchEnd"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2 mb-2">
        <p class="text-xs text-gray-500 select-none order-2 sm:order-1">
          <template v-if="filterMode === 'monthly'">Tap arrows to change month</template>
          <template v-else-if="filterMode === 'day'">Swipe dates · Pull down for calendar</template>
          <template v-else-if="filterMode === 'range'">Choose start and end in the calendar</template>
          <template v-else>Showing all expenses</template>
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

      <!-- Monthly selector -->
      <div v-show="filterMode === 'monthly'" class="flex items-center justify-center gap-4 py-2">
        <Button
          icon="pi pi-chevron-left"
          severity="secondary"
          size="small"
          text
          rounded
          @click="changeMonth(-1)"
          :pt="{ root: { class: 'p-2' } }"
        />
        <span class="text-base font-semibold text-gray-800 min-w-[140px] text-center">
          {{ selectedMonthLabel }}
        </span>
        <Button
          icon="pi pi-chevron-right"
          severity="secondary"
          size="small"
          text
          rounded
          :disabled="isCurrentMonth"
          @click="changeMonth(1)"
          :pt="{ root: { class: 'p-2' } }"
        />
      </div>

      <!-- Day strip -->
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

      <div v-if="filterMode === 'monthly' && calendarExpanded" class="mt-3 flex justify-center px-1">
        <Calendar
          v-model="monthPickerDate"
          view="month"
          dateFormat="mm/yy"
          inline
          :maxDate="calendarMaxDate"
          class="w-full max-w-md"
          @update:modelValue="onMonthPickerChange"
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

    <!-- Content -->
    <div class="p-4 space-y-4 overflow-y-auto">
      <div v-if="loading" class="text-center text-gray-600 py-8">
        <ProgressSpinner />
      </div>

      <div v-else>
        <!-- Profit Card -->
        <Card class="card-white mb-4">
          <template #content>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-gray-500 mb-1">Profit</p>
                <p class="text-3xl font-bold" :class="profit >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ profit >= 0 ? '' : '-' }}₹{{ Math.abs(profit).toFixed(2) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500 mb-1">Shop Open</p>
                <p class="text-2xl font-bold text-gray-800">
                  {{ shopOpenDays }}<span class="text-gray-400 text-lg">/{{ totalDaysInPeriod }}</span>
                </p>
                <p class="text-xs text-gray-400">days</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Income & Expense Cards -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <Card class="card-white">
            <template #content>
              <p class="text-sm text-gray-500 mb-1">Income</p>
              <p class="text-2xl font-bold text-green-600">₹{{ totalIncome.toFixed(2) }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ totalOrders }} orders</p>
            </template>
          </Card>
          <Card class="card-white">
            <template #content>
              <p class="text-sm text-gray-500 mb-1">Bun Expense</p>
              <p class="text-2xl font-bold text-red-600">₹{{ totalBunExpense.toFixed(2) }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ totalBunCount }} buns</p>
            </template>
          </Card>
        </div>

        <!-- Daily breakdown -->
        <Card v-if="dailyBreakdown.length > 0" class="card-white">
          <template #content>
            <h2 class="text-lg font-bold text-gray-900 mb-4">Daily Breakdown</h2>
            <DataTable
              :value="dailyBreakdown"
              :frozenValue="breakdownTotal"
              responsiveLayout="scroll"
              class="p-datatable-sm"
              :rows="31"
              :paginator="dailyBreakdown.length > 31"
              paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
              currentPageReportTemplate="{first} to {last} of {totalRecords}"
            >
              <Column field="dateLabel" header="Date">
                <template #body="{ data }">
                  <span class="font-medium text-gray-900">{{ data.dateLabel }}</span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold text-gray-900">{{ data.dateLabel }}</span>
                </template>
              </Column>
              <Column field="income" header="Income">
                <template #body="{ data }">
                  <span class="text-green-600 font-medium">₹{{ data.income.toFixed(2) }}</span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold text-green-600">₹{{ data.income.toFixed(2) }}</span>
                </template>
              </Column>
              <Column field="expense" header="Expense">
                <template #body="{ data }">
                  <span class="text-red-600 font-medium">₹{{ data.expense.toFixed(2) }}</span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold text-red-600">₹{{ data.expense.toFixed(2) }}</span>
                </template>
              </Column>
              <Column field="profit" header="Profit">
                <template #body="{ data }">
                  <span class="font-bold" :class="data.profit >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ data.profit >= 0 ? '' : '-' }}₹{{ Math.abs(data.profit).toFixed(2) }}
                  </span>
                </template>
                <template #frozenbody="{ data }">
                  <span class="font-bold" :class="data.profit >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ data.profit >= 0 ? '' : '-' }}₹{{ Math.abs(data.profit).toFixed(2) }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <div v-if="!loading && totalOrders === 0 && totalBunExpense === 0" class="text-center text-gray-500 py-8">
          No data for this period
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { supabase } from '@/config/supabase'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Calendar from 'primevue/calendar'
import BottomNav from './BottomNav.vue'

const toast = useToast()
const DAY_STRIP_RADIUS = 120

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

const filterMode = ref('monthly')
const filterModeOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Day', value: 'day' },
  { label: 'Range', value: 'range' },
  { label: 'All time', value: 'all' },
]

const calendarExpanded = ref(false)
const selectedDate = ref(startOfDay(new Date()))
const pickerDate = ref(new Date(selectedDate.value))
const selectedMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const monthPickerDate = ref(new Date(selectedMonth.value))
const rangeModel = ref([addDays(startOfDay(new Date()), -7), startOfDay(new Date())])
const dayStripRef = ref(null)
const loading = ref(false)
const orders = ref([])
const bunEntries = ref([])

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

const selectedMonthLabel = computed(() => {
  return selectedMonth.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

const isCurrentMonth = computed(() => {
  const now = new Date()
  return selectedMonth.value.getFullYear() === now.getFullYear()
    && selectedMonth.value.getMonth() === now.getMonth()
})

function changeMonth(delta) {
  const d = new Date(selectedMonth.value)
  d.setMonth(d.getMonth() + delta)
  const now = new Date()
  if (d.getFullYear() > now.getFullYear() || (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth())) {
    return
  }
  selectedMonth.value = d
  monthPickerDate.value = new Date(d)
}

function onMonthPickerChange() {
  if (!monthPickerDate.value) return
  selectedMonth.value = new Date(monthPickerDate.value.getFullYear(), monthPickerDate.value.getMonth(), 1)
}

function dayStripChipClass(d) {
  const selected = isSameDay(d.date, selectedDate.value)
  if (selected) {
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

const getDateRange = () => {
  if (filterMode.value === 'all') {
    return { start: null, end: null }
  }
  if (filterMode.value === 'monthly') {
    const start = new Date(selectedMonth.value)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString() }
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
  if (a > b) { const t = a; a = b; b = t }
  const start = new Date(a)
  start.setHours(0, 0, 0, 0)
  const end = new Date(b)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

const totalIncome = computed(() => {
  return orders.value.reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
})

const totalOrders = computed(() => orders.value.length)

const totalBunExpense = computed(() => {
  return bunEntries.value.reduce((sum, e) => sum + parseFloat(e.bun_amount), 0)
})

const totalBunCount = computed(() => {
  return bunEntries.value.reduce((sum, e) => sum + e.bun_count, 0)
})

const profit = computed(() => totalIncome.value - totalBunExpense.value)

const shopOpenDays = computed(() => {
  const unique = new Set(bunEntries.value.map(e => e.bun_date))
  return unique.size
})

const totalDaysInPeriod = computed(() => {
  const { start, end } = getDateRange()
  if (!start || !end) {
    if (bunEntries.value.length === 0) return 0
    const dates = bunEntries.value.map(e => new Date(e.bun_date + 'T00:00:00'))
    const min = new Date(Math.min(...dates))
    const max = new Date(Math.max(...dates))
    return Math.round((max - min) / 86400000)
  }
  const s = new Date(start)
  const e = new Date(end)
  return Math.round((e - s) / 86400000)
})

const dailyBreakdown = computed(() => {
  const map = new Map()

  orders.value.forEach(o => {
    const key = dateKey(new Date(o.created_at))
    if (!map.has(key)) map.set(key, { income: 0, expense: 0 })
    map.get(key).income += parseFloat(o.total_amount)
  })

  bunEntries.value.forEach(e => {
    const key = e.bun_date
    if (!map.has(key)) map.set(key, { income: 0, expense: 0 })
    map.get(key).expense += parseFloat(e.bun_amount)
  })

  return Array.from(map.entries())
    .map(([key, val]) => {
      const d = new Date(key + 'T00:00:00')
      return {
        date: key,
        dateLabel: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' }),
        income: val.income,
        expense: val.expense,
        profit: val.income - val.expense,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
})

const breakdownTotal = computed(() => {
  if (dailyBreakdown.value.length === 0) return []
  const totIncome = dailyBreakdown.value.reduce((s, d) => s + d.income, 0)
  const totExpense = dailyBreakdown.value.reduce((s, d) => s + d.expense, 0)
  return [{
    dateLabel: 'Total',
    income: totIncome,
    expense: totExpense,
    profit: totIncome - totExpense,
  }]
})

const getDateKeyRange = () => {
  const { start, end } = getDateRange()
  if (!start || !end) return { startKey: null, endKey: null }
  return {
    startKey: dateKey(new Date(start)),
    endKey: dateKey(new Date(end)),
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()

    if (filterMode.value === 'range' && (!start || !end)) {
      loading.value = false
      orders.value = []
      bunEntries.value = []
      return
    }

    let orderQuery = supabase
      .from('orders')
      .select('total_amount, created_at')
      .order('created_at', { ascending: false })

    if (start && end) {
      orderQuery = orderQuery.gte('created_at', start).lte('created_at', end)
    }

    const { data: ordersData, error: ordersError } = await orderQuery
    if (ordersError) throw ordersError
    orders.value = ordersData || []

    const { startKey, endKey } = getDateKeyRange()

    let bunQuery = supabase
      .from('daily_bun_shop')
      .select('bun_date, bun_count, bun_amount')
      .order('bun_date', { ascending: false })

    if (startKey && endKey) {
      bunQuery = bunQuery.gte('bun_date', startKey).lte('bun_date', endKey)
    }

    const { data: bunData, error: bunError } = await bunQuery
    if (bunError) throw bunError
    bunEntries.value = bunData || []
  } catch (error) {
    console.error('Error fetching expenses data:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error loading data: ' + error.message, life: 5000 })
  } finally {
    loading.value = false
  }
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

watch([filterMode, selectedDate, selectedMonth, rangeModel], () => {
  fetchData()
}, { deep: true })

onMounted(() => {
  fetchData()
  scrollSelectedIntoView('auto')
})
</script>
