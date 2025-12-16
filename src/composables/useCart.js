import { ref, computed } from 'vue'

const cart = ref([]) // Array of { id, name, price, quantity, stock_quantity }

export function useCart() {
  // Add item to cart or increment quantity
  const addToCart = (item) => {
    const existingItem = cart.value.find(i => i.id === item.id)
    
    if (existingItem) {
      // Check stock if applicable
      if (item.stock_quantity !== null && existingItem.quantity >= item.stock_quantity) {
        return false // Out of stock
      }
      existingItem.quantity++
    } else {
      cart.value.push({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
        stock_quantity: item.stock_quantity
      })
    }
    return true
  }

  // Remove item from cart or decrement quantity
  const removeFromCart = (itemId) => {
    const item = cart.value.find(i => i.id === itemId)
    if (!item) return
    
    if (item.quantity > 1) {
      item.quantity--
    } else {
      cart.value = cart.value.filter(i => i.id !== itemId)
    }
  }

  // Update quantity directly
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      cart.value = cart.value.filter(i => i.id !== itemId)
      return
    }
    
    const item = cart.value.find(i => i.id === itemId)
    if (item) {
      // Check stock if applicable
      if (item.stock_quantity !== null && quantity > item.stock_quantity) {
        item.quantity = item.stock_quantity
      } else {
        item.quantity = quantity
      }
    }
  }

  // Clear cart
  const clearCart = () => {
    cart.value = []
  }

  // Load cart from draft or order
  const loadCart = (items) => {
    cart.value = items.map(item => ({
      id: item.id || item.item_id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      stock_quantity: item.stock_quantity
    }))
  }

  // Calculate item subtotal
  const itemSubtotal = computed(() => {
    return (item) => {
      return (item.price * item.quantity).toFixed(2)
    }
  })

  // Calculate grand total
  const grandTotal = computed(() => {
    return cart.value.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0).toFixed(2)
  })

  // Get total items count
  const totalItems = computed(() => {
    return cart.value.reduce((total, item) => total + item.quantity, 0)
  })

  // Check if cart is empty
  const isEmpty = computed(() => {
    return cart.value.length === 0
  })

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    itemSubtotal,
    grandTotal,
    totalItems,
    isEmpty
  }
}

