import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'

const orders = ref([])
const loading = ref(false)
const error = ref(null)
const editingOrderId = ref(null) // Track which order is being edited

export function useOrders() {
  // Fetch recent orders
  const fetchOrders = async (limit = 50) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            item:items (*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (fetchError) throw fetchError
      orders.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching orders:', err)
    } finally {
      loading.value = false
    }
  }

  // Set order being edited
  const setEditingOrder = (orderId) => {
    editingOrderId.value = orderId
  }

  // Clear editing order
  const clearEditingOrder = () => {
    editingOrderId.value = null
  }

  // Place new order or update existing order
  const placeOrder = async (orderItems, totalAmount) => {
    loading.value = true
    error.value = null
    try {
      let order

      if (editingOrderId.value) {
        // Fetch old order items to restore stock
        const { data: oldOrderItems, error: fetchOldItemsError } = await supabase
          .from('order_items')
          .select('item_id, quantity')
          .eq('order_id', editingOrderId.value)
        
        if (fetchOldItemsError) throw fetchOldItemsError

        // Update existing order
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({
            total_amount: totalAmount,
            status: 'completed'
          })
          .eq('id', editingOrderId.value)
          .select()
          .single()
        
        if (updateError) throw updateError
        order = updatedOrder

        // Restore stock quantities from old order items
        if (oldOrderItems && oldOrderItems.length > 0) {
          for (const oldItem of oldOrderItems) {
            // Get current stock quantity
            const { data: itemData } = await supabase
              .from('items')
              .select('stock_quantity')
              .eq('id', oldItem.item_id)
              .single()
            
            if (itemData && itemData.stock_quantity !== null) {
              await supabase
                .from('items')
                .update({ stock_quantity: itemData.stock_quantity + oldItem.quantity })
                .eq('id', oldItem.item_id)
            }
          }
        }

        // Delete existing order items
        const { error: deleteItemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', editingOrderId.value)
        
        if (deleteItemsError) throw deleteItemsError

        // Insert new order items
        const orderItemsData = orderItems.map(item => ({
          order_id: editingOrderId.value,
          item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData)
        
        if (itemsError) throw itemsError

        // Clear editing state
        clearEditingOrder()
      } else {
        // Create new order
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert([{
            total_amount: totalAmount,
            status: 'completed'
          }])
          .select()
          .single()
        
        if (orderError) throw orderError
        order = newOrder

        // Insert order items
        const orderItemsData = orderItems.map(item => ({
          order_id: order.id,
          item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData)
        
        if (itemsError) throw itemsError
      }

      // Update stock quantities if applicable
      for (const item of orderItems) {
        if (item.stock_quantity !== null) {
          await supabase
            .from('items')
            .update({ stock_quantity: item.stock_quantity - item.quantity })
            .eq('id', item.id)
        }
      }

      // Refresh orders list
      await fetchOrders()
      
      return order
    } catch (err) {
      error.value = err.message
      console.error('Error placing order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete order
  const deleteOrder = async (orderId) => {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
      
      if (deleteError) throw deleteError
      
      orders.value = orders.value.filter(o => o.id !== orderId)
    } catch (err) {
      error.value = err.message
      console.error('Error deleting order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    loading,
    error,
    editingOrderId,
    fetchOrders,
    placeOrder,
    deleteOrder,
    setEditingOrder,
    clearEditingOrder
  }
}

