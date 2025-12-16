import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'

const draftOrders = ref([])
const loading = ref(false)
const error = ref(null)

export function useDraftOrders() {
  // Fetch all draft orders
  const fetchDraftOrders = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('draft_orders')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (fetchError) throw fetchError
      draftOrders.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching draft orders:', err)
    } finally {
      loading.value = false
    }
  }

  // Save draft order
  const saveDraft = async (name, items, totalAmount) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await supabase
        .from('draft_orders')
        .insert([{
          name: name || 'Untitled Draft',
          items: items,
          total_amount: totalAmount
        }])
        .select()
        .single()
      
      if (insertError) throw insertError
      draftOrders.value.unshift(data)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error saving draft:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update draft order
  const updateDraft = async (id, updates) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: updateError } = await supabase
        .from('draft_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      const index = draftOrders.value.findIndex(d => d.id === id)
      if (index !== -1) {
        draftOrders.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error updating draft:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete draft order
  const deleteDraft = async (id) => {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await supabase
        .from('draft_orders')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      draftOrders.value = draftOrders.value.filter(d => d.id !== id)
    } catch (err) {
      error.value = err.message
      console.error('Error deleting draft:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    draftOrders,
    loading,
    error,
    fetchDraftOrders,
    saveDraft,
    updateDraft,
    deleteDraft
  }
}

