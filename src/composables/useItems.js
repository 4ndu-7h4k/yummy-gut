import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'

const items = ref([])
const loading = ref(false)
const error = ref(null)

export function useItems() {
  // Fetch all active items
  const fetchItems = async (includeInactive = false) => {
    loading.value = true
    error.value = null
    try {
      // Check if Supabase is configured
      if (!supabase || !supabase.from) {
        console.warn('Supabase not configured, using empty items array')
        items.value = []
        return
      }

      let query = supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true })
      
      if (!includeInactive) {
        query = query.eq('is_active', true)
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) {
        console.error('Supabase fetch error:', fetchError)
        // Don't throw, just set empty array so UI can still render
        items.value = []
        error.value = fetchError.message
      } else {
        items.value = data || []
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching items:', err)
      items.value = [] // Set empty array on error
    } finally {
      loading.value = false
    }
  }

  // Get active items only
  const activeItems = computed(() => {
    return items.value.filter(item => item.is_active)
  })

  // Add new item
  const addItem = async (itemData) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await supabase
        .from('items')
        .insert([{
          name: itemData.name,
          price: itemData.price,
          is_active: itemData.is_active ?? true,
          stock_quantity: itemData.stock_quantity ?? null
        }])
        .select()
        .single()
      
      if (insertError) throw insertError
      items.value.push(data)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error adding item:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update item
  const updateItem = async (id, updates) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: updateError } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error updating item:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete item (soft delete by setting is_active to false)
  const deleteItem = async (id) => {
    return updateItem(id, { is_active: false })
  }

  // Toggle item active status
  const toggleItemActive = async (id) => {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    return updateItem(id, { is_active: !item.is_active })
  }

  return {
    items,
    activeItems,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    toggleItemActive
  }
}

