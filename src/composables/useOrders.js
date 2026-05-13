import { ref, computed } from "vue";
import { supabase } from "@/config/supabase";

const orders = ref([]);
const loading = ref(false);
const error = ref(null);
const editingOrderId = ref(null); // Track which order is being edited

export function useOrders() {
  // Fetch orders filtered to a specific day (Date object) or all orders (null).
  const fetchOrders = async (limit = 50, dateFilter = "today") => {
    loading.value = true;
    error.value = null;
    try {
      let query = supabase.from("orders").select(`
          *,
          order_items (
            *,
            item:items (*)
          )
        `);

      // IST is UTC+5:30
      const istOffsetMs = 5.5 * 60 * 60 * 1000;

      if (dateFilter instanceof Date) {
        // Specific day passed as Date object — use its local date parts
        const d = dateFilter;
        const y = d.getFullYear();
        const m = d.getMonth();
        const day = d.getDate();

        const istDayStart = new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
        const startDate = new Date(istDayStart.getTime() - istOffsetMs);
        const istDayEnd = new Date(Date.UTC(y, m, day + 1, 0, 0, 0, 0));
        const endDate = new Date(istDayEnd.getTime() - istOffsetMs);

        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());
      } else if (dateFilter !== "all") {
        const now = new Date();
        const istNow = new Date(now.getTime() + istOffsetMs);
        const istYear = istNow.getUTCFullYear();
        const istMonth = istNow.getUTCMonth();
        const istDate = istNow.getUTCDate();

        let startDate, endDate;

        if (dateFilter === "today") {
          const istTodayStart = new Date(
            Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0)
          );
          startDate = new Date(istTodayStart.getTime() - istOffsetMs);
          const istTodayEnd = new Date(
            Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0, 0)
          );
          endDate = new Date(istTodayEnd.getTime() - istOffsetMs);
        } else if (dateFilter === "yesterday") {
          const istYesterdayStart = new Date(
            Date.UTC(istYear, istMonth, istDate - 1, 0, 0, 0, 0)
          );
          startDate = new Date(istYesterdayStart.getTime() - istOffsetMs);
          const istYesterdayEnd = new Date(
            Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0)
          );
          endDate = new Date(istYesterdayEnd.getTime() - istOffsetMs);
        }

        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());
      }

      const { data, error: fetchError } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      orders.value = data || [];
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching orders:", err);
    } finally {
      loading.value = false;
    }
  };

  // Set order being edited
  const setEditingOrder = (orderId) => {
    editingOrderId.value = orderId;
  };

  // Clear editing order
  const clearEditingOrder = () => {
    editingOrderId.value = null;
  };

  // Place new order or update existing order
  const placeOrder = async (orderItems, totalAmount) => {
    loading.value = true;
    error.value = null;
    try {
      let order;

      if (editingOrderId.value) {
        // Fetch old order items to restore stock
        const { data: oldOrderItems, error: fetchOldItemsError } =
          await supabase
            .from("order_items")
            .select("item_id, quantity")
            .eq("order_id", editingOrderId.value);

        if (fetchOldItemsError) throw fetchOldItemsError;

        // Update existing order
        const { data: updatedOrder, error: updateError } = await supabase
          .from("orders")
          .update({
            total_amount: totalAmount,
            status: "completed",
          })
          .eq("id", editingOrderId.value)
          .select()
          .single();

        if (updateError) throw updateError;
        order = updatedOrder;

        // Note: Stock is now tracked through daily_stock and order_items
        // No need to restore stock as it's calculated from order_items

        // Delete existing order items
        const { error: deleteItemsError } = await supabase
          .from("order_items")
          .delete()
          .eq("order_id", editingOrderId.value);

        if (deleteItemsError) throw deleteItemsError;

        // Insert new order items
        const orderItemsData = orderItems.map((item) => ({
          order_id: editingOrderId.value,
          item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsData);

        if (itemsError) throw itemsError;

        // Clear editing state
        clearEditingOrder();
      } else {
        // Create new order
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              total_amount: totalAmount,
              status: "completed",
            },
          ])
          .select()
          .single();

        if (orderError) throw orderError;
        order = newOrder;

        // Insert order items
        const orderItemsData = orderItems.map((item) => ({
          order_id: order.id,
          item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsData);

        if (itemsError) throw itemsError;
      }

      // Note: Stock is now tracked through daily_stock and order_items
      // Sales are automatically tracked in order_items, and available stock
      // is calculated using the get_available_stock function

      // Refresh orders list
      await fetchOrders();

      return order;
    } catch (err) {
      error.value = err.message;
      console.error("Error placing order:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    loading.value = true;
    error.value = null;
    try {
      // First, fetch order items to restore stock
      const { data: orderItems, error: fetchItemsError } = await supabase
        .from("order_items")
        .select("item_id, quantity")
        .eq("order_id", orderId);

      if (fetchItemsError) throw fetchItemsError;

      // Note: Stock is now tracked through daily_stock and order_items
      // When an order is deleted, the order_items are also deleted (CASCADE)
      // Available stock is calculated from daily_stock - sold_count, so it
      // will automatically reflect the deletion

      // Now delete the order (order_items will be cascade deleted)
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (deleteError) throw deleteError;

      orders.value = orders.value.filter((o) => o.id !== orderId);
    } catch (err) {
      error.value = err.message;
      console.error("Error deleting order:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    orders,
    loading,
    error,
    editingOrderId,
    fetchOrders,
    placeOrder,
    deleteOrder,
    setEditingOrder,
    clearEditingOrder,
  };
}
