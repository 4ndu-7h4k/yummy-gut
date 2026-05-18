<template>
  <div class="h-screen pb-20 flex flex-col">
    <div class="sticky top-0 z-10 px-3 bg-[#F5F5F7]">
      <div class="flex items-center justify-between px-4 pb-3 pt-1">
        <div class="flex items-center gap-3">
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            size="small"
            outlined
            rounded
            @click="router.push('/expenses')"
            v-tooltip.top="'Back to Expenses'"
            :pt="{ root: { class: 'p-2' } }"
          />
          <h1 class="text-2xl font-bold text-gray-900">People</h1>
        </div>
        <Button label="Add" icon="pi pi-plus" size="small" @click="openAddModal" />
      </div>
    </div>

    <div class="p-4 grid grid-cols-2 gap-4">
      <div v-for="person in PEOPLE" :key="person.id">
        <Card
          class="card-white cursor-pointer transition-shadow"
          :class="selectedPerson === person.id ? 'ring-2 ring-ios-blue shadow-md' : ''"
          @click="selectedPerson = selectedPerson === person.id ? null : person.id"
        >
          <template #content>
            <div class="flex items-center gap-2 mb-2">
              <i
                class="pi pi-user text-lg"
                :class="person.id === 'juby' ? 'text-violet-600' : 'text-amber-600'"
              ></i>
              <p class="font-bold text-gray-900">{{ person.label }}</p>
            </div>
            <p class="text-2xl font-bold text-red-600">₹{{ personTotal(person.id).toFixed(2) }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ personCount(person.id) }} expense{{ personCount(person.id) === 1 ? '' : 's' }}
            </p>
            <p v-if="personUnsettled(person.id) > 0" class="text-xs text-amber-700 mt-1 font-medium">
              ₹{{ personUnsettled(person.id).toFixed(2) }} unsettled
            </p>
          </template>
        </Card>
      </div>
    </div>

    <div class="px-4 pb-2 flex gap-2 flex-wrap">
      <Button
        label="All"
        size="small"
        :severity="selectedPerson === null ? 'primary' : 'secondary'"
        :outlined="selectedPerson !== null"
        @click="selectedPerson = null"
      />
      <Button
        v-for="person in PEOPLE"
        :key="person.id"
        :label="person.label"
        size="small"
        :severity="selectedPerson === person.id ? 'primary' : 'secondary'"
        :outlined="selectedPerson !== person.id"
        @click="selectedPerson = person.id"
      />
    </div>

    <div class="p-4 pt-0 space-y-3 flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center py-8">
        <ProgressSpinner />
      </div>

      <div v-else-if="filteredExpenses.length === 0" class="text-center py-8 text-gray-500">
        No expenses yet
      </div>

      <div v-else class="space-y-3">
        <Card v-for="exp in filteredExpenses" :key="exp.id" class="card-white">
          <template #content>
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    class="text-xs font-semibold px-2 py-0.5 rounded-full"
                    :class="exp.person === 'juby' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ personLabel(exp.person) }}
                  </span>
                  <span
                    v-if="exp.settled"
                    class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800"
                  >
                    Settled
                  </span>
                  <span
                    v-else
                    class="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
                  >
                    Pending
                  </span>
                </div>
                <p class="text-sm text-gray-500">{{ formatDate(exp.expense_date) }}</p>
                <p v-if="exp.notes" class="text-sm text-gray-700 mt-1 break-words">{{ exp.notes }}</p>
              </div>
              <p class="text-xl font-bold text-red-600 shrink-0">₹{{ parseFloat(exp.amount).toFixed(2) }}</p>
            </div>

            <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                size="small"
                severity="primary"
                outlined
                class="flex-1"
                @click="openEditModal(exp)"
              />
              <Button
                :label="exp.settled ? 'Unsettle' : 'Settle'"
                :icon="exp.settled ? 'pi pi-times' : 'pi pi-check'"
                size="small"
                :severity="exp.settled ? 'secondary' : 'success'"
                outlined
                class="flex-1"
                @click="toggleSettled(exp)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                @click="handleDelete(exp)"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <Dialog
      v-model:visible="showModal"
      modal
      :header="editingExpense ? 'Edit expense' : 'New expense'"
      :style="{ width: '100%', maxWidth: '28rem' }"
      :pt="{ content: { class: 'pb-4' } }"
      @hide="closeModal"
    >
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">Person</label>
          <div class="flex gap-2">
            <Button
              v-for="person in PEOPLE"
              :key="person.id"
              :label="person.label"
              class="flex-1"
              :severity="form.person === person.id ? 'primary' : 'secondary'"
              :outlined="form.person !== person.id"
              @click="form.person = person.id"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">Date</label>
          <Calendar
            v-model="form.expenseDate"
            dateFormat="yy-mm-dd"
            showIcon
            iconDisplay="input"
            :maxDate="calendarMaxDate"
            class="w-full"
          />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">Amount (₹)</label>
          <InputNumber
            v-model="form.amount"
            :min="0"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            class="w-full"
            inputClass="w-full"
          />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
          <Textarea v-model="form.notes" rows="3" class="w-full" placeholder="Optional" />
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="form.settled" inputId="settled" :binary="true" />
          <label for="settled" class="text-sm text-gray-700 cursor-pointer">Settled</label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" outlined @click="closeModal" />
        <Button
          :label="editingExpense ? 'Update' : 'Save'"
          icon="pi pi-check"
          :loading="saving"
          @click="handleSave"
        />
      </template>
    </Dialog>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import BottomNav from './BottomNav.vue'

const PEOPLE = [
  { id: 'juby', label: 'Juby' },
  { id: 'anandu', label: 'Anandu' },
]

const toast = useToast()
const router = useRouter()

const expenses = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingExpense = ref(null)
const selectedPerson = ref(null)

const form = ref({
  person: 'juby',
  expenseDate: new Date(),
  amount: null,
  notes: '',
  settled: false,
})

const calendarMaxDate = computed(() => {
  const x = new Date()
  x.setHours(23, 59, 59, 999)
  return x
})

function personLabel(id) {
  return PEOPLE.find((p) => p.id === id)?.label ?? id
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function toDateString(d) {
  if (!d) return null
  const x = d instanceof Date ? d : new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const filteredExpenses = computed(() => {
  let list = [...expenses.value]
  if (selectedPerson.value) {
    list = list.filter((e) => e.person === selectedPerson.value)
  }
  return list.sort((a, b) => {
    const dc = b.expense_date.localeCompare(a.expense_date)
    if (dc !== 0) return dc
    return new Date(b.created_at) - new Date(a.created_at)
  })
})

function personTotal(personId) {
  return expenses.value
    .filter((e) => e.person === personId)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
}

function personUnsettled(personId) {
  return expenses.value
    .filter((e) => e.person === personId && !e.settled)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
}

function personCount(personId) {
  return expenses.value.filter((e) => e.person === personId).length
}

async function fetchExpenses() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('individual_expenses')
      .select('*')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    expenses.value = data || []
  } catch (err) {
    console.error(err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Could not load expenses: ' + err.message,
      life: 5000,
    })
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    person: selectedPerson.value || 'juby',
    expenseDate: new Date(),
    amount: null,
    notes: '',
    settled: false,
  }
}

function openAddModal() {
  editingExpense.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(exp) {
  editingExpense.value = exp
  form.value = {
    person: exp.person,
    expenseDate: new Date(exp.expense_date + 'T12:00:00'),
    amount: parseFloat(exp.amount),
    notes: exp.notes || '',
    settled: exp.settled,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingExpense.value = null
}

async function handleSave() {
  if (!form.value.expenseDate) {
    toast.add({ severity: 'warn', summary: 'Date required', life: 3000 })
    return
  }
  if (form.value.amount == null || form.value.amount < 0) {
    toast.add({ severity: 'warn', summary: 'Valid amount required', life: 3000 })
    return
  }

  saving.value = true
  const payload = {
    person: form.value.person,
    expense_date: toDateString(form.value.expenseDate),
    amount: form.value.amount,
    notes: form.value.notes?.trim() || null,
    settled: form.value.settled,
  }

  try {
    if (editingExpense.value) {
      const { error } = await supabase
        .from('individual_expenses')
        .update(payload)
        .eq('id', editingExpense.value.id)
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Updated', life: 3000 })
    } else {
      const { error } = await supabase.from('individual_expenses').insert([payload])
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Saved', life: 3000 })
    }
    closeModal()
    await fetchExpenses()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message,
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}

async function toggleSettled(exp) {
  try {
    const { error } = await supabase
      .from('individual_expenses')
      .update({ settled: !exp.settled })
      .eq('id', exp.id)
    if (error) throw error
    exp.settled = !exp.settled
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
  }
}

async function handleDelete(exp) {
  if (!confirm('Delete this expense?')) return
  try {
    const { error } = await supabase.from('individual_expenses').delete().eq('id', exp.id)
    if (error) throw error
    expenses.value = expenses.value.filter((e) => e.id !== exp.id)
    toast.add({ severity: 'success', summary: 'Deleted', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
  }
}

onMounted(fetchExpenses)
</script>
