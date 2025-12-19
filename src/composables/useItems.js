import { ref, computed } from "vue";
import { supabase } from "@/config/supabase";

const items = ref([]);
const loading = ref(false);
const error = ref(null);

export function useItems() {
  // Get today's date in IST (YYYY-MM-DD format)
  const getTodayIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset);
    return istNow.toISOString();
  };
  // date 12:00 am
  const getTodayStatTimeInUTC = () => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    return startOfDay.toISOString();
  };

  // Fetch all active items with daily stock information
  const fetchItems = async (includeInactive = false) => {
    loading.value = true;
    error.value = null;
    try {
      // Check if Supabase is configured
      if (!supabase || !supabase.from) {
        console.warn("Supabase not configured, using empty items array");
        items.value = [];
        return;
      }

      let query = supabase.from("items").select("*");

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      // Order by display_order first, then by name as fallback
      query = query
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
        // Don't throw, just set empty array so UI can still render
        items.value = [];
        error.value = fetchError.message;
      } else {
        // Fetch daily stock information for today
        const today = getTodayStatTimeInUTC();
        const itemsWithStock = await Promise.all(
          (data || []).map(async (item) => {
            try {
              // Get daily stock for today
              const { data: dailyStock, error: dailyStockError } =
                await supabase
                  .from("daily_stock")
                  .select("initial_stock")
                  .eq("item_id", item.id)
                  .eq("stock_date", today)
                  .maybeSingle();
              // Get sold count for today using the function

              const { data: soldData, error: soldError } = await supabase.rpc(
                "get_sold_count",
                {
                  p_item_id: item.id,
                  p_date: today,
                }
              );
              889;
              const { data: initialStock, error: initialStockError } =
                await supabase
                  .from("daily_stock")
                  .select("initial_stock")
                  .eq("item_id", item.id)
                  .eq("stock_date", getTodayIST())
                  .maybeSingle();

              return {
                ...item,
                daily_stock: initialStock?.initial_stock ?? null,
                sold_count: soldData,
                available_stock: Math.max(
                  0,
                  Number(initialStock?.initial_stock ?? 0) - Number(soldData)
                ),
              };
            } catch (err) {
              console.error(`Error fetching stock for item ${item.id}:`, err);
              // Return item without stock info if there's an error
              return {
                ...item,
                daily_stock: null,
                sold_count: 0,
                available_stock: null,
              };
            }
          })
        );
        items.value = itemsWithStock;
      }
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching items:", err);
      items.value = []; // Set empty array on error
    } finally {
      loading.value = false;
    }
  };

  // Get active items only, sorted by display_order
  const activeItems = computed(() => {
    return items.value
      .filter((item) => item.is_active)
      .sort((a, b) => {
        const orderA = a.display_order ?? 0;
        const orderB = b.display_order ?? 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // If display_order is the same, sort by name
        return (a.name || "").localeCompare(b.name || "");
      });
  });

  // Set daily stock for an item
  const setDailyStock = async (itemId, stockDate, initialStock) => {
    try {
      const { data, error: upsertError } = await supabase
        .from("daily_stock")
        .upsert(
          {
            item_id: itemId,
            stock_date: stockDate,
            initial_stock: initialStock,
          },
          {
            onConflict: "item_id,stock_date",
          }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;
      return data;
    } catch (err) {
      console.error("Error setting daily stock:", err);
      throw err;
    }
  };

  // Add new item
  const addItem = async (itemData) => {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: insertError } = await supabase
        .from("items")
        .insert([
          {
            name: itemData.name,
            price: itemData.price,
            display_order: itemData.display_order ?? 0,
            is_active: itemData.is_active ?? true,
            stock_quantity: null, // Keep for backward compatibility but don't use for daily tracking
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // If daily_stock is provided, set it for today
      if (itemData.daily_stock !== null && itemData.daily_stock !== undefined) {
        const today = getTodayIST();
        await setDailyStock(data.id, today, itemData.daily_stock);
      }

      // Refresh items to get updated stock info
      await fetchItems(true);
      return data;
    } catch (err) {
      error.value = err.message;
      console.error("Error adding item:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update item
  const updateItem = async (id, updates) => {
    loading.value = true;
    error.value = null;
    try {
      // Extract daily_stock from updates if present
      const { daily_stock, ...itemUpdates } = updates;

      const { data, error: updateError } = await supabase
        .from("items")
        .update(itemUpdates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // If daily_stock is provided, update it for today
      if (daily_stock !== null && daily_stock !== undefined) {
        const today = getTodayIST();
        await setDailyStock(id, today, daily_stock);
      }

      // Refresh items to get updated stock info
      await fetchItems(true);
      return data;
    } catch (err) {
      error.value = err.message;
      console.error("Error updating item:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete item (soft delete by setting is_active to false)
  const deleteItem = async (id) => {
    return updateItem(id, { is_active: false });
  };

  // Toggle item active status
  const toggleItemActive = async (id) => {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;
    return updateItem(id, { is_active: !item.is_active });
  };

  return {
    items,
    activeItems,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    toggleItemActive,
    setDailyStock,
    getTodayIST,
  };
}
