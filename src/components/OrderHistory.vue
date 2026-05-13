<template>
  <div class="h-screen flex flex-col pb-20">
    <!-- Header -->
    <div class=" sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-1">
        <h1 class="text-2xl font-bold text-gray-900">Order History</h1>
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
        </div>
      </div>
      
    </div>

    <!-- Day strip + pull-down calendar -->
    <div
      class="px-2 py-3 bg-[#F5F5F7] border-b border-gray-200"
      @touchstart="onStripTouchStart"
      @touchmove="onStripTouchMove"
      @touchend="onStripTouchEnd"
    >
      <div class="flex items-center justify-between px-2 mb-2">
        <p class="text-xs text-gray-500 select-none">
          Swipe dates · Pull down for calendar
        </p>
        <Button
          type="button"
          :icon="calendarExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          severity="secondary"
          size="small"
          outlined
          v-tooltip.top="calendarExpanded ? 'Hide calendar' : 'Show calendar'"
          @click="calendarExpanded = !calendarExpanded"
          :pt="{ root: { class: 'p-2' } }"
        />
      </div>

      <div
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

      <div v-if="calendarExpanded" class="mt-3 flex justify-center px-1">
        <Calendar
          v-model="pickerDate"
          inline
          :maxDate="calendarMaxDate"
          class="w-full max-w-md"
          @update:modelValue="onPickerDateChange"
        />
      </div>
    </div>

    <!-- Orders List -->
    <div class="p-4 space-y-4 bg-[#F5F5F7] flex-1 overflow-y-auto">
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
              <p class="text-sm font-mono text-gray-700">{{ getTimeAgo(order.created_at, order.id) }} ago</p>
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
import { useRouter } from 'vue-router'
import { useOrders } from '@/composables/useOrders'
import { useCart } from '@/composables/useCart'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Calendar from 'primevue/calendar'
import QRCodeModal from './QRCodeModal.vue'
import BottomNav from './BottomNav.vue'

const DAY_STRIP_RADIUS = 120

const toast = useToast()
const router = useRouter()
const showQRModal = ref(false)
const { orders, loading, fetchOrders, deleteOrder, setEditingOrder } = useOrders()
const { loadCart } = useCart()

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

function dateKey(d) {
  const x = startOfDay(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
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

const selectedDate = ref(startOfDay(new Date()))
const pickerDate = ref(new Date(selectedDate.value))
const calendarExpanded = ref(false)
const dayStripRef = ref(null)

let stripTouchY0 = 0
let stripTouchX0 = 0

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

function scrollSelectedIntoView(behavior = 'smooth') {
  nextTick(() => {
    const strip = dayStripRef.value
    if (!strip) return
    const key = dateKey(selectedDate.value)
    const el = strip.querySelector(`[data-day-key="${key}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior })
  })
}

function selectDay(date) {
  const d = startOfDay(date)
  if (d > startOfDay(new Date())) return
  selectedDate.value = d
  pickerDate.value = new Date(d)
  scrollSelectedIntoView()
}

function onPickerDateChange() {
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

function onStripTouchStart(e) {
  if (e.touches.length !== 1) return
  stripTouchY0 = e.touches[0].clientY
  stripTouchX0 = e.touches[0].clientX
}

function onStripTouchMove(e) {
  if (e.touches.length !== 1 || calendarExpanded.value) return
  const dy = e.touches[0].clientY - stripTouchY0
  const dx = e.touches[0].clientX - stripTouchX0
  if (dy > 56 && dy > Math.abs(dx) * 1.25) {
    calendarExpanded.value = true
    stripTouchY0 = e.touches[0].clientY
    stripTouchX0 = e.touches[0].clientX
  }
}

function onStripTouchEnd() {
  stripTouchY0 = 0
  stripTouchX0 = 0
}

watch(selectedDate, (d) => {
  pickerDate.value = new Date(d)
  fetchOrders(50, d)
})

onMounted(() => {
  fetchOrders(50, selectedDate.value)
  scrollSelectedIntoView('auto')
})

const handleLoadOrder = (order) => {
  const items = order.order_items.map(oi => ({
    id: oi.item_id,
    name: oi.item?.name || 'Unknown',
    price: parseFloat(oi.price),
    quantity: oi.quantity
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

const getTimeAgo = (createdAt, orderId) => {
  const now = new Date()
  const orderDate = new Date(createdAt)
  const diffMs = now - orderDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  // If less than 1 minute, show "just now"
  if (diffMins < 1) {
    return 'just now'
  }
  
  // If less than 1 hour, show minutes
  if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? '' : ''}`
  }
  
  // If less than 3 hours, show hours
  if (diffHours < 3) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }
  
  // If 3 hours or more, show order ID
  return `Order #${orderId.slice(0, 8)}`
}
</script>
